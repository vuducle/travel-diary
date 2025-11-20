import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import type { Trip as TripEntity } from '@prisma/client';
import { promises as fs } from 'fs';
import * as path from 'path';
import { PrismaService } from '../../database/prisma.module';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import type { Prisma } from '@prisma/client';

@Injectable()
export class TripsService {
  constructor(private readonly prisma: PrismaService) {}

  // Shared pagination result type
  public static mapPaginated<T>(args: {
    items: T[];
    total: number;
    page: number;
    limit: number;
  }) {
    const totalPages = Math.ceil(args.total / args.limit) || 1;
    const hasNextPage =
      (args.page - 1) * args.limit + args.items.length < args.total;
    return {
      items: args.items,
      total: args.total,
      page: args.page,
      limit: args.limit,
      totalPages,
      hasNextPage,
    };
  }

  async create(userId: string, dto: CreateTripDto, coverImageUrl?: string) {
    // Block suspended users from creating trips
    const actor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { suspendedAt: true, suspendedReason: true },
    });
    if (actor?.suspendedAt) {
      throw new ForbiddenException(
        actor.suspendedReason ||
          'Your account is suspended and cannot create trips.',
      );
    }

    const trip = await this.prisma.trip.create({
      data: {
        title: dto.title,
        description: dto.description,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        coverImage: coverImageUrl,
        visibility: dto.visibility ?? 'PRIVATE',
        userId,
      },
      include: {
        locations: true,
        entries: true,
      },
    });
    return trip;
  }

  async findAllForUser(userId: string) {
    return this.prisma.trip.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { locations: true, entries: true } },
      },
    });
  }

  async findAllPaginated(page: number, limit: number, userId?: string) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.trip.findMany({
        where: { visibility: 'PUBLIC' },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, username: true, avatarUrl: true },
          },
          // get all counts and whether the user liked each trip
          _count: {
            select: {
              locations: true,
              entries: true,
              likes: true,
              comments: true,
            },
          },
          likes: userId
            ? {
                where: { userId },
                select: { userId: true },
                take: 1,
              }
            : false,
        },
      }),
      this.prisma.trip.count({ where: { visibility: 'PUBLIC' } }),
    ]);

    // Map items to include userLiked field
    const mappedItems = items.map((item) => ({
      ...item,
      userLiked: userId ? (item.likes as any[])?.length > 0 : false,
      likes: undefined, // Remove the likes array from response
    }));

    const totalPages = Math.ceil(total / limit) || 1;
    return {
      items: mappedItems,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: skip + items.length < total,
    };
  }

  async findOneForUser(userId: string, tripId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, userId },
      include: {
        locations: true,
        entries: true,
      },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  async updateForUser(
    userId: string,
    tripId: string,
    dto: UpdateTripDto,
    coverImageUrl?: string,
    removeCover?: boolean,
  ) {
    // ensure ownership
    await this.ensureOwnership(userId, tripId);

    // Read existing for later cleanup
    const existing = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { coverImage: true },
    });

    const data: Prisma.TripUpdateInput = {
      title: dto.title,
      description: dto.description,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    };
    if (typeof coverImageUrl !== 'undefined') {
      data.coverImage = coverImageUrl;
    } else if (removeCover) {
      data.coverImage = null;
    }
    if (typeof dto.visibility !== 'undefined') {
      (data as { visibility?: unknown }).visibility = dto.visibility;
    }

    const trip = await this.prisma.trip.update({
      where: { id: tripId },
      data,
      include: {
        locations: true,
        entries: true,
      },
    });

    const shouldDeleteOld =
      (!!coverImageUrl || !!removeCover) && !!existing?.coverImage;
    if (shouldDeleteOld && existing?.coverImage) {
      await this.deleteCoverFileSafe(existing.coverImage).catch(
        () => undefined,
      );
    }
    return trip;
  }

  async removeForUser(userId: string, tripId: string) {
    await this.ensureOwnership(userId, tripId);

    // Fetch existing trip data and related entry images before deletion
    const existing = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        coverImage: true,
        entries: {
          select: {
            images: {
              select: { url: true },
            },
          },
        },
      },
    });

    // Delete all related data in a transaction
    await this.prisma.$transaction([
      this.prisma.entry.deleteMany({ where: { tripId } }),
      this.prisma.location.deleteMany({ where: { tripId } }),
      this.prisma.trip.delete({ where: { id: tripId } }),
    ]);

    // Clean up image files from disk
    if (existing?.coverImage) {
      await this.deleteCoverFileSafe(existing.coverImage).catch(
        () => undefined,
      );
    }

    // Delete all entry image files
    if (existing?.entries) {
      for (const entry of existing.entries) {
        for (const image of entry.images) {
          await this.deleteEntryImageSafe(image.url).catch(() => undefined);
        }
      }
    }

    return { message: 'Trip deleted' };
  }

  private async ensureOwnership(userId: string, tripId: string) {
    const exists = await this.prisma.trip.findFirst({
      where: { id: tripId, userId },
    });
    if (!exists) throw new NotFoundException('Trip not found');
  }

  async clearCover(userId: string, tripId: string) {
    await this.ensureOwnership(userId, tripId);
    const existing = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { coverImage: true },
    });
    if (!existing?.coverImage) {
      // No cover to remove; idempotent behavior
      return { message: 'No cover to remove' };
    }
    await this.prisma.trip.update({
      where: { id: tripId },
      data: { coverImage: null },
    });
    await this.deleteCoverFileSafe(existing.coverImage).catch(() => undefined);
    return { message: 'Cover removed' };
  }

  private async deleteCoverFileSafe(coverImageUrl: string) {
    try {
      const relative = coverImageUrl.replace(/^\/+/, '');
      const absolute = path.resolve(process.cwd(), relative);
      const uploadsTripsDir = path.resolve(process.cwd(), 'uploads', 'trips');
      if (!absolute.startsWith(uploadsTripsDir)) return;
      await fs.unlink(absolute);
    } catch {
      // ignore errors
    }
  }

  private async deleteEntryImageSafe(imageUrl: string) {
    try {
      const relative = imageUrl.replace(/^\/+/, '');
      const absolute = path.resolve(process.cwd(), relative);
      const uploadsEntriesDir = path.resolve(
        process.cwd(),
        'uploads',
        'entries',
      );
      if (!absolute.startsWith(uploadsEntriesDir)) return;
      await fs.unlink(absolute);
    } catch {
      // ignore errors
    }
  }

  // Visibility helpers
  private async areFriends(userA: string, userB: string) {
    const f = await this.prisma.friendship.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: userA, addresseeId: userB },
          { requesterId: userB, addresseeId: userA },
        ],
      },
    });
    return !!f;
  }

  async canReadTrip(viewerId: string, tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { userId: true, visibility: true },
    });
    if (!trip) return false;
    if (trip.userId === viewerId) return true;
    if (trip.visibility === 'PUBLIC') return true;
    if (trip.visibility === 'FRIENDS') {
      return this.areFriends(viewerId, trip.userId);
    }
    return false;
  }

  async findOneForView(viewerId: string, tripId: string) {
    const allowed = await this.canReadTrip(viewerId, tripId);
    if (!allowed) throw new NotFoundException('Trip not found');
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
            bio: true,
          },
        },
        locations: {
          select: {
            id: true,
            name: true,
            country: true,
            state: true,
            city: true,
            street: true,
            road: true,
            lat: true,
            lng: true,
            coverImage: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            locations: true,
            entries: true,
          },
        },
      },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  async findVisibleTripsForUser(
    viewerId: string,
    ownerId: string,
    page = 1,
    limit = 10,
  ): Promise<{
    items: TripEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
  }> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const isSelf = viewerId === ownerId;
    const where: Prisma.TripWhereInput = { userId: ownerId };
    if (!isSelf) {
      // viewer isn't the owner, restrict by visibility
      const friends = await this.areFriends(viewerId, ownerId);
      where.visibility = friends ? { in: ['PUBLIC', 'FRIENDS'] } : 'PUBLIC';
    }

    const [items, total] = await Promise.all([
      this.prisma.trip.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { locations: true, entries: true } } },
      }),
      this.prisma.trip.count({ where }),
    ]);

    const totalPages = Math.ceil(total / safeLimit) || 1;
    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
      hasNextPage: skip + items.length < total,
    };
  }
}
