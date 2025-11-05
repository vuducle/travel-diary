import {
  Body,
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Post,
  Patch,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Request,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { EntriesService } from './entries.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { entryImageUploadConfig } from '../../common/helpers/multer.helper';
import * as path from 'path';
import { optimizeEntryImage } from '../../common/helpers/image.helper';
import { Request as ExpressRequest } from 'express';

@ApiTags('Entries')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('entries')
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Get()
  @ApiOperation({
    summary: 'List entries for current user (filter by trip/location)',
  })
  @ApiBody({ required: false })
  async list(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Query('tripId') tripId?: string,
    @Query('locationId') locationId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.entriesService.findManyForUser(req.user.id, {
      tripId: tripId || undefined,
      locationId: locationId || undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('trip/:tripId/by-location')
  @ApiOperation({
    summary:
      'List locations in a trip that have entries, including those entries',
  })
  async listGroupedByLocation(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('tripId') tripId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.entriesService.findTripLocationsWithEntries(
      req.user.id,
      tripId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one entry by id' })
  async getOne(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.entriesService.findOneForUser(req.user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create an entry with multiple images' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          example: 'Nguyen Hue street coffee date <3 UwU.',
        },
        content: {
          type: 'string',
          example: 'This is the content of my first entry',
          nullable: true,
        },
        date: {
          type: 'string',
          example: '2024-06-15T08:30:00Z',
          description: 'ISO timestamp',
          nullable: true,
        },
        tripId: { type: 'string', example: 'uuid-trip-id' },
        locationId: {
          type: 'string',
          example: 'uuid-location-id',
          nullable: true,
        },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'One or more images',
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('images', 10, entryImageUploadConfig))
  async create(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() dto: CreateEntryDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const imageUrls: string[] = [];
    if (files && files.length) {
      for (const f of files) {
        const abs = f.path || path.resolve(f.destination, f.filename);
        const { publicUrl } = await optimizeEntryImage(abs);
        imageUrls.push(publicUrl);
      }
    }
    return this.entriesService.create(req.user.id, dto, imageUrls);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an entry; add/remove/reorder images' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', nullable: true },
        content: { type: 'string', nullable: true },
        date: { type: 'string', nullable: true },
        locationId: { type: 'string', nullable: true },
        removeImageIds: {
          type: 'array',
          items: { type: 'string' },
          nullable: true,
        },
        reorderImageIds: {
          type: 'array',
          items: { type: 'string' },
          nullable: true,
        },
        addImages: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          nullable: true,
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('addImages', 10, entryImageUploadConfig))
  async update(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEntryDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const addUrls: string[] = [];
    if (files && files.length) {
      for (const f of files) {
        const abs = f.path || path.resolve(f.destination, f.filename);
        const { publicUrl } = await optimizeEntryImage(abs);
        addUrls.push(publicUrl);
      }
    }
    return this.entriesService.updateForUser(req.user.id, id, dto, addUrls);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an entry and its images' })
  async remove(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.entriesService.removeForUser(req.user.id, id);
  }

  @Patch(':id/json')
  @ApiOperation({
    summary: 'JSON-only metadata update for an entry (no files)',
  })
  async updateJson(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEntryDto,
  ) {
    return this.entriesService.updateForUser(req.user.id, id, dto, []);
  }
}
