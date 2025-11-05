import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.module';
import { FriendshipStatus } from '@prisma/client';
import { FriendRequestAction } from './dto/respond-friend-request.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FriendsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async sendFriendRequest(requesterId: string, addresseeId: string) {
    // Check if trying to send request to self
    if (requesterId === addresseeId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    // Check if addressee exists

    const addressee = await this.prisma.user.findUnique({
      where: { id: addresseeId },
    });

    if (!addressee) {
      throw new NotFoundException('User not found');
    }

    // Check if friendship already exists (in either direction)

    const existingFriendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId },
          { requesterId: addresseeId, addresseeId: requesterId },
        ],
      },
    });

    if (existingFriendship) {
      if (existingFriendship.status === FriendshipStatus.ACCEPTED) {
        throw new ConflictException({
          message: 'Users are already friends',
          code: 'ALREADY_FRIENDS',
          friendshipId: existingFriendship.id,
        });
      }
      if (existingFriendship.status === FriendshipStatus.PENDING) {
        const direction =
          existingFriendship.requesterId === requesterId
            ? 'outgoing'
            : 'incoming';
        throw new ConflictException({
          message: 'Friend request already pending',
          code: 'FRIEND_REQUEST_PENDING',
          direction,
          friendshipId: existingFriendship.id,
        });
      }
      if (existingFriendship.status === FriendshipStatus.REJECTED) {
        // Clean up rejected record then allow creating a fresh request
        await this.prisma.friendship.delete({
          where: { id: existingFriendship.id },
        });
      }
    }

    // Create friend request

    const friendRequest = await this.prisma.friendship.create({
      data: {
        requesterId,
        addresseeId,
        status: FriendshipStatus.PENDING,
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        addressee: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Notify addressee about the friend request
    if (friendRequest.addresseeId !== requesterId) {
      void this.notifications.createAndEmit({
        userId: friendRequest.addresseeId,
        type: 'FRIEND_REQUEST',
        entityType: 'friendship',
        entityId: friendRequest.id,
        metadata: { byUserId: requesterId },
      });
    }

    return {
      message: 'Friend request sent successfully',
      friendRequest,
    };
  }

  // upsertFriendRequest removed: prefer explicit send + respond flows

  async respondToFriendRequest(
    userId: string,
    friendshipId: string,
    action: FriendRequestAction,
  ) {
    // Find the friend request

    const friendRequest = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendRequest) {
      throw new NotFoundException('Friend request not found');
    }

    // Check if the user is the addressee
    if (friendRequest.addresseeId !== userId) {
      throw new ForbiddenException(
        'You can only respond to friend requests sent to you',
      );
    }

    // Check if request is still pending
    if (friendRequest.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException(
        'Friend request has already been responded to',
      );
    }

    const newStatus =
      action === FriendRequestAction.ACCEPT
        ? FriendshipStatus.ACCEPTED
        : FriendshipStatus.REJECTED;

    // Update friendship status

    const updatedFriendship = await this.prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: newStatus },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        addressee: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    // If accepted, notify requester
    if (newStatus === FriendshipStatus.ACCEPTED) {
      if (updatedFriendship.requesterId !== userId) {
        void this.notifications.createAndEmit({
          userId: updatedFriendship.requesterId,
          type: 'FRIEND_ACCEPTED',
          entityType: 'friendship',
          entityId: updatedFriendship.id,
          metadata: { byUserId: userId },
        });
      }
    }

    return {
      message:
        action === FriendRequestAction.ACCEPT
          ? 'Friend request accepted'
          : 'Friend request rejected',
      friendship: updatedFriendship,
    };
  }

  async removeFriend(userId: string, friendId: string) {
    // Find the friendship (in either direction)

    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: friendId },
          { requesterId: friendId, addresseeId: userId },
        ],
        status: FriendshipStatus.ACCEPTED,
      },
    });

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    // Delete the friendship

    await this.prisma.friendship.delete({
      where: { id: friendship.id },
    });

    return {
      message: 'Friend removed successfully',
    };
  }

  async getPendingRequests(userId: string) {
    // Get friend requests sent to the user

    const pendingRequests = await this.prisma.friendship.findMany({
      where: {
        addresseeId: userId,
        status: FriendshipStatus.PENDING,
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            avatarUrl: true,
            bio: true,
            location: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return pendingRequests;
  }

  async getSentRequests(userId: string) {
    // Get friend requests sent by the user

    const sentRequests = await this.prisma.friendship.findMany({
      where: {
        requesterId: userId,
        status: FriendshipStatus.PENDING,
      },
      include: {
        addressee: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            avatarUrl: true,
            bio: true,
            location: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sentRequests;
  }

  async getFriendsList(userId: string) {
    // Get all accepted friendships (in either direction)

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
            email: true,
            avatarUrl: true,
            bio: true,
            location: true,
          },
        },
        addressee: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            avatarUrl: true,
            bio: true,
            location: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map to return only the friend (not the current user)
    const friends = friendships.map((friendship) => {
      const friend =
        friendship.requesterId === userId
          ? friendship.addressee
          : friendship.requester;
      return {
        friendshipId: friendship.id,
        friend,
        friendsSince: friendship.createdAt,
      };
    });

    return friends;
  }

  async cancelFriendRequest(userId: string, friendshipId: string) {
    // Find the friend request

    const friendRequest = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendRequest) {
      throw new NotFoundException('Friend request not found');
    }

    // Check if the user is the requester
    if (friendRequest.requesterId !== userId) {
      throw new ForbiddenException('You can only cancel requests you sent');
    }

    // Check if request is still pending
    if (friendRequest.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('Can only cancel pending friend requests');
    }

    // Delete the friend request

    await this.prisma.friendship.delete({
      where: { id: friendshipId },
    });

    return {
      message: 'Friend request cancelled successfully',
    };
  }
}
