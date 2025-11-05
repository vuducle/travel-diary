import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.module';
import { NotificationsGateway } from './notifications.gateway';
import { Prisma, Notification } from '@prisma/client';

export type CreateNotificationInput = {
  userId: string;
  type:
    | 'LIKE'
    | 'COMMENT'
    | 'REPLY'
    | 'FRIEND_REQUEST'
    | 'FRIEND_ACCEPTED'
    | 'MESSAGE'
    | 'TRIP_VISIBILITY_CHANGED'
    | 'SYSTEM';
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async list(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const items: Notification[] = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
    const total: number = await this.prisma.notification.count({
      where: { userId },
    });
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

  async markRead(userId: string, id: string) {
    const updated: Prisma.BatchPayload =
      await this.prisma.notification.updateMany({
        where: { id, userId, readAt: null },
        data: { readAt: new Date() },
      });
    return { updated: updated.count };
  }

  async markAllRead(userId: string) {
    const updated: Prisma.BatchPayload =
      await this.prisma.notification.updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() },
      });
    return { updated: updated.count };
  }

  async createAndEmit(input: CreateNotificationInput) {
    const metadataValue: Prisma.InputJsonValue | undefined =
      input.metadata === undefined
        ? undefined
        : input.metadata === null
          ? (Prisma.DbNull as unknown as Prisma.InputJsonValue)
          : (input.metadata as Prisma.InputJsonValue);

    const created: Notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        metadata: metadataValue,
      },
    });
    try {
      this.gateway.emitToUser(created.userId, 'notification', created);
    } catch {
      this.logger.debug(`Emit failed (user offline?): ${created.userId}`);
    }

    return created;
  }
}
