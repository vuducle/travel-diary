import {
  Controller,
  Get,
  Patch,
  UseGuards,
  Request,
  Body,
  UseInterceptors,
  UploadedFiles,
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { profileUploadsMulterConfig } from '../../common/helpers/multer.helper';
import * as path from 'path';
import {
  optimizeAvatar,
  optimizeCoverImage,
} from '../../common/helpers/image.helper';
import type { Request as ExpressRequest } from 'express';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: ExpressRequest & { user: { id: string } }) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Update user profile with optional avatar upload' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Linh Chi Nguyễn' },
        bio: { type: 'string', example: 'Travel enthusiast' },
        location: { type: 'string', example: 'Nam Định, Việt Nam' },
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Avatar image (jpg, jpeg, png, max 5MB)',
        },
        coverImage: {
          type: 'string',
          format: 'binary',
          description: 'Cover image (jpg, jpeg, png, max 5MB)',
        },
      },
    },
  })
  // Accept both 'avatar' and 'coverImage' files in one request
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'avatar', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 },
      ],
      profileUploadsMulterConfig(),
    ),
  )
  async updateProfile(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() updateProfileDto: UpdateProfileDto,
    @UploadedFiles()
    files?: {
      avatar?: Express.Multer.File[];
      coverImage?: Express.Multer.File[];
    },
  ) {
    let avatarUrl: string | undefined = undefined;
    let coverUrl: string | undefined = undefined;

    const avatarFile = files?.avatar?.[0];
    if (avatarFile) {
      const abs =
        avatarFile.path ||
        path.resolve(avatarFile.destination, avatarFile.filename);
      const { publicUrl } = await optimizeAvatar(abs);
      avatarUrl = publicUrl;
    }

    const coverFile = files?.coverImage?.[0];
    if (coverFile) {
      const abs =
        coverFile.path ||
        path.resolve(coverFile.destination, coverFile.filename);
      const { publicUrl } = await optimizeCoverImage(abs);
      coverUrl = publicUrl;
    }

    return this.usersService.updateProfile(
      req.user.id,
      updateProfileDto,
      avatarUrl,
      coverUrl,
    );
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Search users by username' })
  @ApiQuery({
    name: 'username',
    required: true,
    description: 'Username to search for (case-insensitive partial match)',
    example: 'armin',
  })
  async searchUsers(@Query('username') username: string) {
    if (!username || username.trim().length === 0) {
      throw new BadRequestException('Username query parameter is required');
    }
    return this.usersService.searchByUsername(username);
  }
}
