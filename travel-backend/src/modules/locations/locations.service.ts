import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.module';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import type { Prisma } from '@prisma/client';

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
      select: { id: true, tripId: true },
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
        lat: typeof dto.lat === 'number' ? dto.lat : undefined,
        lng: typeof dto.lng === 'number' ? dto.lng : undefined,
        coverImage: typeof coverUrl === 'string' ? coverUrl : undefined,
        parentId:
          typeof dto.parentId === 'undefined'
            ? undefined
            : (dto.parentId ?? null),
      },
    });
    return updated;
  }

  async remove(userId: string, id: string) {
    await this.ensureLocationOwnership(userId, id);
    const childrenCount = await this.prisma.location.count({
      where: { parentId: id },
    });
    if (childrenCount > 0)
      throw new BadRequestException('Location has children; delete them first');
    const entriesCount = await this.prisma.entry.count({
      where: { locationId: id },
    });
    if (entriesCount > 0)
      throw new BadRequestException(
        'Location has entries; reassign or delete entries first',
      );
    await this.prisma.location.delete({ where: { id } });
    return { message: 'Location deleted' };
  }

  async updateCoverImage(userId: string, id: string, coverUrl: string) {
    await this.ensureLocationOwnership(userId, id);
    const updated = await this.prisma.location.update({
      where: { id },
      data: { coverImage: coverUrl },
    });
    return updated;
  }
}
