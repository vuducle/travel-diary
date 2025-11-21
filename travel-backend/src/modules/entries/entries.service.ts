import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.module';
import { promises as fs } from 'fs';
import * as path from 'path';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class EntriesService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureTripOwnership(userId: string, tripId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, userId },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  private async ensureLocationInTrip(tripId: string, locationId?: string) {
    if (!locationId) return;
    const loc = await this.prisma.location.findUnique({
      where: { id: locationId },
    });
    if (!loc || loc.tripId !== tripId)
      throw new BadRequestException('Location must belong to the same trip');
  }

  async create(userId: string, dto: CreateEntryDto, imageUrls: string[]) {
    await this.ensureTripOwnership(userId, dto.tripId);
    await this.ensureLocationInTrip(dto.tripId, dto.locationId);

    const created = await this.prisma.entry.create({
      data: {
        title: dto.title,
        content: dto.content,
        date: dto.date ? new Date(dto.date) : undefined,
        tripId: dto.tripId,
        locationId: dto.locationId ?? undefined,
      },
    });

    if (imageUrls.length > 0) {
      const data = imageUrls.map((url, idx) => ({
        url,
        order: idx,
        entryId: created.id,
      }));
      await this.prisma.entryImage.createMany({ data });
    }

    const images = await this.prisma.entryImage.findMany({
      where: { entryId: created.id },
      orderBy: { order: 'asc' },
    });
    return { ...created, images };
  }

  async findOneForUser(userId: string, entryId: number) {
    const entry = await this.prisma.entry.findFirst({
      where: { id: entryId, trip: { is: { userId } } },
      include: { images: { orderBy: { order: 'asc' } } },
    });
    if (!entry) throw new NotFoundException('Entry not found');
    return entry;
  }

  async findManyForUser(
    userId: string,
    params: {
      tripId?: string;
      locationId?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { tripId, locationId } = params;
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 10));
    const skip = (page - 1) * limit;

    if (tripId) await this.ensureTripOwnership(userId, tripId);
    if (locationId && tripId)
      await this.ensureLocationInTrip(tripId, locationId);

    const where: Prisma.EntryWhereInput = { trip: { is: { userId } } };
    if (tripId) where.tripId = tripId;
    if (locationId) where.locationId = locationId;

    const [items, total] = await Promise.all([
      this.prisma.entry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { images: { orderBy: { order: 'asc' } }, location: true },
      }),
      this.prisma.entry.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: skip + items.length < total,
    };
  }

  async findManyForPublicTrip(
    tripId: string,
    params: {
      locationId?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { locationId } = params;
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 10));
    const skip = (page - 1) * limit;

    // Check if the trip is public
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { visibility: true },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.visibility !== 'PUBLIC') {
      throw new UnauthorizedException(
        'This trip is not public. Authentication required.',
      );
    }

    if (locationId) {
      await this.ensureLocationInTrip(tripId, locationId);
    }

    const where: Prisma.EntryWhereInput = { tripId };
    if (locationId) where.locationId = locationId;

    const [items, total] = await Promise.all([
      this.prisma.entry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { images: { orderBy: { order: 'asc' } }, location: true },
      }),
      this.prisma.entry.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: skip + items.length < total,
    };
  }

  async updateForUser(
    userId: string,
    entryId: number,
    dto: UpdateEntryDto,
    addImageUrls: string[] = [],
  ) {
    // ensure ownership
    const entry = await this.prisma.entry.findFirst({
      where: { id: entryId, trip: { is: { userId } } },
      include: { images: true },
    });
    if (!entry) throw new NotFoundException('Entry not found');

    if (dto.locationId)
      await this.ensureLocationInTrip(entry.tripId, dto.locationId);

    // Remove requested images (also delete files)
    if (dto.removeImageIds?.length) {
      const toRemove = entry.images.filter((img) =>
        dto.removeImageIds!.includes(img.id),
      );
      for (const img of toRemove) {
        await this.deleteEntryImageFileSafe(img.url).catch(() => undefined);
      }
      await this.prisma.entryImage.deleteMany({
        where: { id: { in: dto.removeImageIds }, entryId },
      });
    }

    // Add new images
    if (addImageUrls.length) {
      const existingCount = await this.prisma.entryImage.count({
        where: { entryId },
      });
      const data = addImageUrls.map((url, idx) => ({
        url,
        order: existingCount + idx,
        entryId,
      }));
      await this.prisma.entryImage.createMany({ data });
    }

    // Reorder if provided
    if (dto.reorderImageIds?.length) {
      // Ensure all IDs belong to this entry
      const imgs = await this.prisma.entryImage.findMany({
        where: { entryId },
      });
      const idsSet = new Set(imgs.map((i) => i.id));
      const validIds = dto.reorderImageIds.filter((id) => idsSet.has(id));
      await this.prisma.$transaction(
        validIds.map((id, idx) =>
          this.prisma.entryImage.update({
            where: { id },
            data: { order: idx },
          }),
        ),
      );
    }

    const updated = await this.prisma.entry.update({
      where: { id: entryId },
      data: {
        title: dto.title,
        content: dto.content,
        date: dto.date ? new Date(dto.date) : undefined,
        locationId:
          typeof dto.locationId === 'undefined' ? undefined : dto.locationId,
      },
      include: { images: { orderBy: { order: 'asc' } }, location: true },
    });
    return updated;
  }

  async removeForUser(userId: string, entryId: number) {
    const entry = await this.prisma.entry.findFirst({
      where: { id: entryId, trip: { is: { userId } } },
      include: { images: true },
    });
    if (!entry) throw new NotFoundException('Entry not found');

    for (const img of entry.images) {
      await this.deleteEntryImageFileSafe(img.url).catch(() => undefined);
    }
    await this.prisma.entry.delete({ where: { id: entryId } });
    return { message: 'Entry deleted' };
  }

  private async deleteEntryImageFileSafe(imageUrl: string) {
    try {
      const relative = imageUrl.replace(/^\/+/, '');
      const absolute = path.resolve(process.cwd(), relative);
      const uploadsDir = path.resolve(process.cwd(), 'uploads', 'entries');
      if (!absolute.startsWith(uploadsDir)) return;
      await fs.unlink(absolute);
    } catch {
      // ignore
    }
  }

  async findTripLocationsWithEntries(
    userId: string,
    tripId: string,
    page = 1,
    limit = 20,
  ) {
    await this.ensureTripOwnership(userId, tripId);
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;
    const where = { tripId, entries: { some: {} } } as const;

    const [items, total] = await Promise.all([
      this.prisma.location.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { entries: true } },
          entries: {
            orderBy: { createdAt: 'desc' },
            include: {
              images: { orderBy: { order: 'asc' } },
            },
          },
        },
      }),
      this.prisma.location.count({ where }),
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

  private async canReadTrip(viewerId: string, tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { userId: true, visibility: true },
    });
    if (!trip) return false;
    if (trip.userId === viewerId) return true;
    if (trip.visibility === 'PUBLIC') return true;
    if (trip.visibility === 'FRIENDS')
      return this.areFriends(viewerId, trip.userId);
    return false;
  }

  async listEntriesForTripView(
    viewerId: string,
    tripId: string,
    page = 1,
    limit = 10,
  ) {
    const allowed = await this.canReadTrip(viewerId, tripId);
    if (!allowed) throw new NotFoundException('Trip not found');
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;
    const where = { tripId } as const;
    const [items, total] = await Promise.all([
      this.prisma.entry.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: { images: { orderBy: { order: 'asc' } }, location: true },
      }),
      this.prisma.entry.count({ where }),
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

  async findTripLocationsWithEntriesView(
    viewerId: string,
    tripId: string,
    page = 1,
    limit = 20,
  ) {
    const allowed = await this.canReadTrip(viewerId, tripId);
    if (!allowed) throw new NotFoundException('Trip not found');
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;
    const where = { tripId, entries: { some: {} } } as const;
    const [items, total] = await Promise.all([
      this.prisma.location.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { entries: true } },
          entries: {
            orderBy: { createdAt: 'desc' },
            include: { images: { orderBy: { order: 'asc' } } },
          },
        },
      }),
      this.prisma.location.count({ where }),
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
