import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.module';
import { Role, Prisma, $Enums } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateAdminDto } from './dto/create-admin.dto';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async createAdmin(createAdminDto: CreateAdminDto) {
    const { email, username, password, name, bio, location } = createAdminDto;

    // Check if user already exists

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('User with this email already exists');
      }
      if (existingUser.username === username) {
        throw new ConflictException('Username is already taken');
      }
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword: string = await bcrypt.hash(password, saltRounds);

    // Create admin user

    const admin = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name,
        bio,
        location,
        role: Role.ADMIN,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        location: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Admin created successfully',
      admin,
    };
  }

  async assignAdminRole(userId: string) {
    // Check if user exists

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === Role.ADMIN) {
      throw new ConflictException('User is already an admin');
    }

    // Update user role to ADMIN

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role: Role.ADMIN },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        location: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'User promoted to admin successfully',
      admin: updatedUser,
    };
  }

  async revokeAdminRole(userId: string) {
    // Check if user exists

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== Role.ADMIN) {
      throw new ConflictException('User is not an admin');
    }

    // Update user role to USER

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role: Role.USER },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        location: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Admin role revoked successfully',
      user: updatedUser,
    };
  }

  async getAllAdmins() {
    const admins = await this.prisma.user.findMany({
      where: { role: Role.ADMIN },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        location: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return admins;
  }

  // Moderation: Remove a trip (hard delete for simplicity) and log audit
  async removeTrip(actorId: string, tripId: string) {
    const existing = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true, coverImage: true, userId: true, title: true },
    });
    if (!existing) throw new NotFoundException('Trip not found');

    await this.prisma.$transaction([
      this.prisma.auditLog.create({
        data: {
          actorId,
          action: $Enums.AdminAction.DELETE_TRIP,
          entityType: 'trip',
          entityId: existing.id,
          details: {
            title: existing.title,
            ownerId: existing.userId,
          } as Prisma.InputJsonValue,
        },
      }),
      this.prisma.trip.delete({ where: { id: tripId } }),
    ]);

    if (existing.coverImage) {
      await this.deleteCoverFileSafe(existing.coverImage).catch(
        () => undefined,
      );
    }
    return { message: 'Trip removed by admin' };
  }

  // Moderation: Remove a comment (hard delete) and log audit
  async removeComment(actorId: string, commentId: string) {
    const existing = await this.prisma.tripComment.findUnique({
      where: { id: commentId },
      select: { id: true, content: true, tripId: true, userId: true },
    });
    if (!existing) throw new NotFoundException('Comment not found');

    await this.prisma.$transaction([
      this.prisma.auditLog.create({
        data: {
          actorId,
          action: $Enums.AdminAction.DELETE_COMMENT,
          entityType: 'comment',
          entityId: existing.id,
          details: {
            tripId: existing.tripId,
            authorId: existing.userId,
          } as Prisma.InputJsonValue,
        },
      }),
      this.prisma.tripComment.delete({ where: { id: commentId } }),
    ]);

    return { message: 'Comment removed by admin' };
  }

  // Moderation: Suspend a user
  async suspendUser(actorId: string, userId: string, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        suspendedAt: new Date(),
        suspendedReason: reason,
        suspendedById: actorId,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        suspendedAt: true,
        suspendedReason: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: $Enums.AdminAction.SUSPEND_USER,
        entityType: 'user',
        entityId: userId,
        details: { reason } as Prisma.InputJsonValue,
      },
    });

    return { message: 'User suspended', user: updated };
  }

  // Moderation: Unsuspend a user
  async unsuspendUser(actorId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { suspendedAt: null, suspendedReason: null, suspendedById: null },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        suspendedAt: true,
        suspendedReason: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: $Enums.AdminAction.UNSUSPEND_USER,
        entityType: 'user',
        entityId: userId,
      },
    });

    return { message: 'User unsuspended', user: updated };
  }

  async listAuditLogs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, email: true, username: true } },
        },
      }),
      this.prisma.auditLog.count(),
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
}
