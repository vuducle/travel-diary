import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.module';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { promises as fs } from 'fs';
import * as path from 'path';

interface User {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
  role: string;
  bio?: string | null;
  location?: string | null;
  createdAt: Date;
  updatedAt: Date;
  coverImage?: string | null;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
    avatarUrl?: string,
    coverImage?: string,
  ) {
    // Fetch existing user to get old avatar/cover URLs before updating
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true, coverImage: true },
    });

    const updateData: Partial<UpdateProfileDto> & {
      avatarUrl?: string;
      coverImage?: string;
    } = {
      ...updateProfileDto,
    };

    if (avatarUrl) {
      updateData.avatarUrl = avatarUrl;
    }
    if (coverImage) {
      updateData.coverImage = coverImage;
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        location: true,
        avatarUrl: true,
        coverImage: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Delete old files after successful DB update
    if (avatarUrl && existingUser?.avatarUrl) {
      await this.deleteImageFileSafe(existingUser.avatarUrl, 'avatars').catch(
        () => undefined,
      );
    }
    if (coverImage && existingUser?.coverImage) {
      await this.deleteImageFileSafe(existingUser.coverImage, 'covers').catch(
        () => undefined,
      );
    }

    return user;
  }

  /**
   * Safely delete an image file from the uploads directory.
   * @param imageUrl - The public URL of the image (e.g., '/uploads/avatars/file.webp')
   * @param subdir - The subdirectory within uploads (e.g., 'avatars' or 'covers')
   */
  private async deleteImageFileSafe(imageUrl: string, subdir: string) {
    try {
      // Convert public URL to absolute file path
      const relative = imageUrl.replace(/^\/+/, '');
      const absolute = path.resolve(process.cwd(), relative);

      // Ensure the file is within the expected uploads subdirectory for security
      const uploadsDir = path.resolve(process.cwd(), 'uploads', subdir);
      if (!absolute.startsWith(uploadsDir)) {
        // File is outside expected directory, skip deletion
        return;
      }

      await fs.unlink(absolute);
    } catch {
      // Ignore errors (file may not exist, or permissions issue)
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        location: true,
        avatarUrl: true,
        coverImage: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async searchByUsername(username: string) {
    const users = await this.prisma.user.findMany({
      where: {
        username: {
          contains: username,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        location: true,
        avatarUrl: true,
        coverImage: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      take: 20, // Limit to 20 results
    });

    return users;
  }

  private readonly users: User[] = [
    {
      id: '1',
      email: 'julianguyen@test.com',
      username: 'julianguyen',
      name: 'Julia Nguyen',
      avatarUrl: null,
      role: 'ADMIN',
      bio: null,
      location: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      email: 'wendyredvelvet@test.com',
      username: 'wendyameilya',
      name: 'Wendy Ameilya',
      avatarUrl: null,
      role: 'ADMIN',
      bio: null,
      location: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  findAll(): User[] {
    return this.users;
  }

  findById(id: string): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  findByEmail(email: string): User | undefined {
    return this.users.find((user) => user.email === email);
  }

  findByName(name: string): User | undefined {
    return this.users.find((user) => user.name === name);
  }
}
