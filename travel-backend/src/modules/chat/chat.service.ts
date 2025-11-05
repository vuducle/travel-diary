import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.module';
import { NotificationsService } from '../notifications/notifications.service';
import { FriendshipStatus } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async sendMessage(senderId: string, receiverId: string, content: string) {
    // Block suspended users from sending messages
    const actor = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { suspendedAt: true, suspendedReason: true },
    });
    if (actor?.suspendedAt) {
      throw new ForbiddenException(
        actor.suspendedReason ||
          'Your account is suspended and cannot send messages.',
      );
    }

    // Basic input validation to avoid Prisma errors
    if (!receiverId || typeof receiverId !== 'string') {
      throw new BadRequestException('receiverId is required');
    }
    if (typeof content !== 'string' || content.trim().length === 0) {
      throw new BadRequestException('content is required');
    }
    content = content.trim();

    // Ensure receiver exists
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });
    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }
    // Check if users are friends

    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: senderId, addresseeId: receiverId },
          { requesterId: receiverId, addresseeId: senderId },
        ],
        status: FriendshipStatus.ACCEPTED,
      },
    });

    if (!friendship) {
      throw new ForbiddenException(
        'You can only send messages to your friends',
      );
    }

    // Create message

    const message = await this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Create a notification for the receiver (persist + emit)
    void this.notifications.createAndEmit({
      userId: receiverId,
      type: 'MESSAGE',
      entityType: 'message',
      entityId: message.id,
      metadata: { byUserId: senderId },
    });

    return message;
  }

  async getConversation(userId: string, otherUserId: string, limit = 50) {
    if (!otherUserId || typeof otherUserId !== 'string') {
      throw new BadRequestException('userId is required');
    }
    // Check if users are friends

    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: otherUserId },
          { requesterId: otherUserId, addresseeId: userId },
        ],
        status: FriendshipStatus.ACCEPTED,
      },
    });

    if (!friendship) {
      throw new ForbiddenException(
        'You can only view conversations with friends',
      );
    }

    // Get messages between the two users

    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return messages;
  }

  async markAsRead(messageId: string, userId: string) {
    if (!messageId || typeof messageId !== 'string') {
      throw new BadRequestException('messageId is required');
    }
    // Find the message

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if the user is the receiver
    if (message.receiverId !== userId) {
      throw new ForbiddenException(
        'You can only mark your own messages as read',
      );
    }

    // Update message

    const updatedMessage = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return updatedMessage;
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });

    return { unreadCount: count };
  }

  async getConversationsList(userId: string) {
    // Get all friends

    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [{ requesterId: userId }, { addresseeId: userId }],
        status: FriendshipStatus.ACCEPTED,
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
        addressee: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    // For each friend, get the last message and unread count
    const conversations = await Promise.all(
      friendships.map(async (friendship) => {
        const friend =
          friendship.requesterId === userId
            ? friendship.addressee
            : friendship.requester;

        const lastMessage = await this.prisma.message.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: friend.id },
              { senderId: friend.id, receiverId: userId },
            ],
          },
          orderBy: { createdAt: 'desc' },
        });

        const unreadCount = await this.prisma.message.count({
          where: {
            senderId: friend.id,
            receiverId: userId,
            isRead: false,
          },
        });

        return {
          friend,
          lastMessage,
          unreadCount,
        };
      }),
    );

    // Sort by last message time
    conversations.sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return (
        new Date(b.lastMessage.createdAt).getTime() -
        new Date(a.lastMessage.createdAt).getTime()
      );
    });

    return conversations;
  }
}
