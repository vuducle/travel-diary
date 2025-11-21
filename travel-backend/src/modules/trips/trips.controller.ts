import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  UploadedFile,
  UseInterceptors,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { NotSuspendedGuard } from '../../common/guards/not-suspended.guard';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { tripCoverUploadConfig } from '../../common/helpers/multer.helper';
import * as path from 'path';
import { optimizeTripCover } from '../../common/helpers/image.helper';
import { Request as ExpressRequest } from 'express';

@ApiTags('Trips')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new trip (with optional cover image upload)',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - missing or invalid JWT',
  })
  @ApiForbiddenResponse({ description: 'Forbidden - user is suspended' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Summer in Java island' },
        description: {
          type: 'string',
          example: 'Exploring beaches and culture',
        },
        startDate: {
          type: 'string',
          example: '2025-06-01',
          description: 'ISO date string',
        },
        endDate: {
          type: 'string',
          example: '2025-06-14',
          description: 'ISO date string',
        },
        cover: {
          type: 'string',
          format: 'binary',
          description: 'Cover image (jpg, jpeg, png, webp), max 10MB',
        },
        visibility: { type: 'string', enum: ['PRIVATE', 'FRIENDS', 'PUBLIC'] },
      },
    },
  })
  @UseInterceptors(FileInterceptor('cover', tripCoverUploadConfig))
  @UseGuards(JwtAuthGuard, NotSuspendedGuard)
  async create(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() createTripDto: CreateTripDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let coverUrl: string | undefined = undefined;
    // Optimize cover image if uploaded
    if (file) {
      const abs = file.path || path.resolve(file.destination, file.filename);
      const { publicUrl } = await optimizeTripCover(abs);
      coverUrl = publicUrl;
    }
    return this.tripsService.create(req.user.id, createTripDto, coverUrl);
  }

  @Get()
  @ApiOperation({ summary: 'Get all trips of the current user' })
  findAll(@Request() req: ExpressRequest & { user: { id: string } }) {
    return this.tripsService.findAllForUser(req.user.id);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all trips with pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default 10, max 100)',
  })
  findAllPaginated(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Request() req?: ExpressRequest & { user?: { id: string } },
  ) {
    const p = Math.max(1, parseInt(String(page), 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 10));
    const userId = req?.user?.id;
    return this.tripsService.findAllPaginated(p, l, userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a single trip by id (public view if allowed by visibility)',
  })
  @ApiParam({ name: 'id', type: 'string' })
  findOne(
    @Request() req: ExpressRequest & { user?: { id: string } },
    @Param('id') id: string,
  ) {
    const viewerId = req?.user?.id || '';
    return this.tripsService.findOneForView(viewerId, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Update a trip by id (owned by current user); also supports updating or removing cover image',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Summer in Bali' },
        description: {
          type: 'string',
          example: 'Exploring beaches and culture',
        },
        startDate: {
          type: 'string',
          example: '2025-06-01',
          description: 'ISO date string',
        },
        endDate: {
          type: 'string',
          example: '2025-06-14',
          description: 'ISO date string',
        },
        cover: {
          type: 'string',
          format: 'binary',
          description: 'New cover image (optional)',
        },
        removeCover: {
          type: 'boolean',
          description:
            'Set true to remove existing cover image without uploading a new one',
        },
        visibility: { type: 'string', enum: ['PRIVATE', 'FRIENDS', 'PUBLIC'] },
      },
    },
  })
  @UseInterceptors(FileInterceptor('cover', tripCoverUploadConfig))
  @ApiParam({ name: 'id', type: 'string' })
  async update(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('id') id: string,
    @Body() updateTripDto: UpdateTripDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let coverUrl: string | undefined = undefined;
    if (file) {
      const abs = file.path || path.resolve(file.destination, file.filename);
      const { publicUrl } = await optimizeTripCover(abs);
      coverUrl = publicUrl;
    }
    const removeCover = updateTripDto.removeCover === true;
    return this.tripsService.updateForUser(
      req.user.id,
      id,
      updateTripDto,
      coverUrl,
      removeCover,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a trip by id (owned by current user)' })
  @ApiParam({ name: 'id', type: 'string' })
  remove(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.tripsService.removeForUser(req.user.id, id);
  }

  @Delete(':id/cover')
  @ApiOperation({
    summary: 'Remove the cover image for a trip (owned by current user)',
  })
  @ApiParam({ name: 'id', type: 'string' })
  clearCover(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.tripsService.clearCover(req.user.id, id);
  }
}
