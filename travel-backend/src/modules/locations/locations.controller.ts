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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import type { Request as ExpressRequest } from 'express';

@ApiTags('Locations')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a location (city or place) for a trip' })
  @ApiBody({ type: CreateLocationDto })
  async create(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() dto: CreateLocationDto,
  ) {
    // Ensure user owns the trip and optional parent belongs to same trip
    return this.locationsService.create(req.user.id, dto);
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
  @ApiOperation({ summary: 'Update a location (name/country/lat/lng/parent)' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiBody({ type: UpdateLocationDto })
  async update(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.locationsService.update(req.user.id, id, dto);
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
}
