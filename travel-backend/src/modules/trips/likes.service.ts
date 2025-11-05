import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.module';
import { NotificationsService } from '../notifications/notifications.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class LikesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async likeTrip(userId: string, tripId: string) {
    // Ensure trip exists
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true },
    });
    if (!trip) throw new NotFoundException('Trip not found');

    try {
      await this.prisma.tripLike.create({ data: { tripId, userId } });
    } catch (e: unknown) {
      // Unique constraint => already liked
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        return { message: 'Already liked' };
      }
      throw new BadRequestException('Failed to like');
    }
    const count = await this.prisma.tripLike.count({
      where: { tripId },
    });
    // Create notification for trip owner (if liker != owner)
    const owner = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { userId: true },
    });
    if (owner && owner.userId !== userId) {
      void this.notifications.createAndEmit({
        userId: owner.userId,
        type: 'LIKE',
        entityType: 'trip',
        entityId: tripId,
        metadata: { byUserId: userId },
      });
    }
    return { message: 'Liked', likes: count };
  }

  async unlikeTrip(userId: string, tripId: string) {
    // Delete if exists; ignore if not
    await this.prisma.tripLike.deleteMany({
      where: { userId, tripId },
    });
    const count = await this.prisma.tripLike.count({
      where: { tripId },
    });
    return { message: 'Unliked', likes: count };
  }

  async listLikes(tripId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.tripLike.findMany({
        where: { tripId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, username: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.tripLike.count({ where: { tripId } }),
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
}
