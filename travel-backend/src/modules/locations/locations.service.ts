import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.module';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import type { Prisma } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureTripOwnership(userId: string, tripId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, userId },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  private async ensureLocationOwnership(userId: string, locationId: string) {
    const loc = await this.prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true, tripId: true, coverImage: true },
    });
    if (!loc) throw new NotFoundException('Location not found');
    await this.ensureTripOwnership(userId, loc.tripId);
    return loc;
  }

  async create(userId: string, dto: CreateLocationDto, coverUrl?: string) {
    await this.ensureTripOwnership(userId, dto.tripId);
    if (dto.parentId) {
      const parent = await this.prisma.location.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent || parent.tripId !== dto.tripId) {
        throw new BadRequestException(
          'Parent location must belong to the same trip',
        );
      }
    }
    const loc = await this.prisma.location.create({
      data: {
        name: dto.name,
        country: dto.country,
        street: dto.street,
        lat: typeof dto.lat === 'number' ? dto.lat : undefined,
        lng: typeof dto.lng === 'number' ? dto.lng : undefined,
        tripId: dto.tripId,
        parentId: dto.parentId ?? null,
        coverImage: coverUrl ?? undefined,
      },
    });
    return loc;
  }

  async list(
    userId: string,
    tripId: string,
    opts: { parentId?: string; page: number; limit: number },
  ) {
    await this.ensureTripOwnership(userId, tripId);
    const { parentId, page, limit } = opts;
    const skip = (page - 1) * limit;
    const where: Prisma.LocationWhereInput = { tripId };
    if (typeof parentId !== 'undefined') where.parentId = parentId;

    const [items, total] = await Promise.all([
      this.prisma.location.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { children: true, entries: true } },
        },
      }),
      this.prisma.location.count({ where }),
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

  async getOne(userId: string, id: string) {
    const loc = await this.prisma.location.findUnique({
      where: { id },
      include: {
        parent: true,
        _count: { select: { children: true, entries: true } },
      },
    });
    if (!loc) throw new NotFoundException('Location not found');
    await this.ensureTripOwnership(userId, loc.tripId);
    return loc;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateLocationDto,
    coverUrl?: string,
  ) {
    const loc = await this.ensureLocationOwnership(userId, id);

    // Get the current location to access the old cover image
    const currentLocation = await this.prisma.location.findUnique({
      where: { id },
      select: { coverImage: true },
    });

    if (typeof dto.parentId !== 'undefined' && dto.parentId !== loc.id) {
      if (dto.parentId) {
        const parent = await this.prisma.location.findUnique({
          where: { id: dto.parentId },
        });
        if (!parent || parent.tripId !== loc.tripId) {
          throw new BadRequestException(
            'Parent location must belong to the same trip',
          );
        }
      }
    } else if (dto.parentId === loc.id) {
      throw new BadRequestException('A location cannot be its own parent');
    }

    const updated = await this.prisma.location.update({
      where: { id },
      data: {
        name: dto.name,
        country: dto.country,
        street: dto.street,
        lat: typeof dto.lat === 'number' ? dto.lat : undefined,
        lng: typeof dto.lng === 'number' ? dto.lng : undefined,
        coverImage: typeof coverUrl === 'string' ? coverUrl : undefined,
        parentId:
          typeof dto.parentId === 'undefined'
            ? undefined
            : (dto.parentId ?? null),
      },
    });

    // Delete old cover image if a new one was uploaded
    if (coverUrl && currentLocation?.coverImage) {
      await this.deleteCoverFileSafe(currentLocation.coverImage).catch(
        () => undefined,
      );
    }

    return updated;
  }

  async remove(userId: string, id: string) {
    const loc = await this.ensureLocationOwnership(userId, id);

    const childrenCount = await this.prisma.location.count({
      where: { parentId: id },
    });
    if (childrenCount > 0) {
      throw new BadRequestException('Location has children; delete them first');
    }

    const entries = await this.prisma.entry.findMany({
      where: { locationId: id },
      include: { images: true },
    });

    if (entries.length > 0) {
      const entryIds = entries.map((e) => e.id);
      const imagesToDelete = entries.flatMap((e) => e.images);

      if (imagesToDelete.length > 0) {
        await Promise.all(
          imagesToDelete.map((img) => this.deleteEntryFileSafe(img.url)),
        );
      }

      await this.prisma.$transaction([
        this.prisma.entryImage.deleteMany({
          where: { entryId: { in: entryIds } },
        }),
        this.prisma.entry.deleteMany({ where: { id: { in: entryIds } } }),
      ]);
    }

    if (loc.coverImage) {
      await this.deleteCoverFileSafe(loc.coverImage);
    }

    await this.prisma.location.delete({ where: { id } });

    return { message: 'Location and all its entries have been deleted' };
  }

  async updateCoverImage(userId: string, id: string, coverUrl: string) {
    await this.ensureLocationOwnership(userId, id);
    const updated = await this.prisma.location.update({
      where: { id },
      data: { coverImage: coverUrl },
    });
    return updated;
  }

  private async deleteCoverFileSafe(coverImageUrl: string) {
    try {
      const relative = coverImageUrl.replace(/^\/+/, '');
      const absolute = path.resolve(process.cwd(), relative);
      const uploadsLocationsDir = path.resolve(
        process.cwd(),
        'uploads',
        'locations',
      );
      if (!absolute.startsWith(uploadsLocationsDir)) return;
      await fs.unlink(absolute);
    } catch {
      // ignore errors
    }
  }

  private async deleteEntryFileSafe(imageUrl: string) {
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
}
