import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import type { Request as ExpressRequest } from 'express';
import type { Location as PrismaLocation } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { locationCoverImageUploadConfig } from '../../common/helpers/multer.helper';
import { optimizeCoverImage } from '../../common/helpers/image.helper';
import * as path from 'path';

@ApiTags('Locations')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a location (city or place) for a trip' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Ho Chi Minh City' },
        country: { type: 'string', example: 'Vietnam' },
        lat: { type: 'number', example: 10.7769 },
        lng: { type: 'number', example: 106.7009 },
        tripId: { type: 'string', example: 'uuid-trip-id' },
        parentId: {
          type: 'string',
          example: 'uuid-parent-location-id',
          nullable: true,
        },
        coverImage: {
          type: 'string',
          format: 'binary',
          description: 'Optional cover image (jpg, jpeg, png, webp, max 10MB)',
        },
      },
      required: ['name', 'tripId'],
    },
  })
  @UseInterceptors(
    FileInterceptor('coverImage', locationCoverImageUploadConfig),
  )
  async create(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() dto: CreateLocationDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Optional cover upload
    let coverUrl: string | undefined;
    if (file) {
      const abs = file.path || path.resolve(file.destination, file.filename);
      const { publicUrl } = await optimizeCoverImage(abs);
      coverUrl = publicUrl;
    }
    return this.locationsService.create(req.user.id, dto, coverUrl);
  }

  @Get()
  @ApiOperation({
    summary: 'List locations by trip (optionally filter by parentId)',
  })
  @ApiQuery({ name: 'tripId', required: true, description: 'Trip id' })
  @ApiQuery({
    name: 'parentId',
    required: false,
    description: 'Parent location id to list children',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page (default 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limit (default 20, max 100)',
  })
  async list(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Query('tripId') tripId: string,
    @Query('parentId') parentId?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    if (!tripId) throw new BadRequestException('tripId is required');
    const p = Math.max(1, parseInt(String(page), 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
    return this.locationsService.list(req.user.id, tripId, {
      parentId,
      page: p,
      limit: l,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single location by id' })
  @ApiParam({ name: 'id', type: 'string' })
  async getOne(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.locationsService.getOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a location (name/country/lat/lng/parent/coverImage)',
  })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Ho Chi Minh City' },
        country: { type: 'string', example: 'Vietnam' },
        lat: { type: 'number', example: 10.7769 },
        lng: { type: 'number', example: 106.7009 },
        parentId: {
          type: 'string',
          example: 'uuid-parent-location-id',
          nullable: true,
        },
        coverImage: {
          type: 'string',
          format: 'binary',
          description: 'Optional cover image (jpg, jpeg, png, webp, max 10MB)',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('coverImage', locationCoverImageUploadConfig),
  )
  async update(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let coverUrl: string | undefined;
    if (file) {
      const abs = file.path || path.resolve(file.destination, file.filename);
      const { publicUrl } = await optimizeCoverImage(abs);
      coverUrl = publicUrl;
    }
    return this.locationsService.update(req.user.id, id, dto, coverUrl);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a location (only if no children and no entries)',
  })
  @ApiParam({ name: 'id', type: 'string' })
  async remove(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.locationsService.remove(req.user.id, id);
  }

  @Patch(':id/cover')
  @ApiOperation({ summary: 'Upload or replace the cover image for a location' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        coverImage: {
          type: 'string',
          format: 'binary',
          description: 'Location cover image (jpg, jpeg, png, webp, max 10MB)',
        },
      },
      required: ['coverImage'],
    },
  })
  @UseInterceptors(
    FileInterceptor('coverImage', locationCoverImageUploadConfig),
  )
  async uploadCover(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<PrismaLocation> {
    if (!file) {
      throw new BadRequestException('coverImage file is required');
    }
    const abs = file.path || path.resolve(file.destination, file.filename);
    const { publicUrl } = await optimizeCoverImage(abs);
    const updated = await this.locationsService.updateCoverImage(
      req.user.id,
      id,
      publicUrl,
    );
    return updated;
  }
}
