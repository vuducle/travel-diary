import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.module';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async addComment(userId: string, tripId: string, dto: CreateCommentDto) {
    // Block suspended users from creating comments
    const actor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { suspendedAt: true, suspendedReason: true },
    });
    if (actor?.suspendedAt) {
      throw new ForbiddenException(
        actor.suspendedReason ||
          'Your account is suspended and cannot create comments.',
      );
    }

    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true },
    });
    if (!trip) throw new NotFoundException('Trip not found');

    if (dto.parentId) {
      const parent = await this.prisma.tripComment.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent || parent.tripId !== tripId) {
        throw new BadRequestException('Invalid parent comment');
      }
    }

    const comment = await this.prisma.tripComment.create({
      data: {
        tripId,
        userId,
        content: dto.content,
        parentId: dto.parentId ?? null,
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
      },
    });
    // Notify trip owner about new comment; if it's a reply, also notify parent comment author
    const tripOwner = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { userId: true },
    });
    if (tripOwner && tripOwner.userId !== userId) {
      void this.notifications.createAndEmit({
        userId: tripOwner.userId,
        type: 'COMMENT',
        entityType: 'trip',
        entityId: tripId,
        metadata: { byUserId: userId, commentId: comment.id },
      });
    }
    if (dto.parentId) {
      const parent = await this.prisma.tripComment.findUnique({
        where: { id: dto.parentId },
        select: { userId: true },
      });
      if (parent && parent.userId !== userId) {
        void this.notifications.createAndEmit({
          userId: parent.userId,
          type: 'REPLY',
          entityType: 'comment',
          entityId: dto.parentId,
          metadata: { byUserId: userId, tripId },
        });
      }
    }
    return comment;
  }

  async listComments(tripId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.tripComment.findMany({
        where: { tripId },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: { id: true, name: true, username: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.tripComment.count({ where: { tripId } }),
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

  async updateComment(
    userId: string,
    commentId: string,
    dto: UpdateCommentDto,
  ) {
    const comment = await this.prisma.tripComment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId) throw new ForbiddenException('Not allowed');

    const updated = await this.prisma.tripComment.update({
      where: { id: commentId },
      data: { content: dto.content },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
      },
    });
    return updated;
  }

  async deleteComment(userId: string, commentId: string) {
    const comment = await this.prisma.tripComment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId) throw new ForbiddenException('Not allowed');

    await this.prisma.tripComment.delete({ where: { id: commentId } });
    return { message: 'Comment deleted' };
  }
}
