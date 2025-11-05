import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { EntriesService } from './entries.service';

@ApiTags('Entries')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('trips')
export class TripsEntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Get(':tripId/entries')
  @ApiOperation({ summary: 'List entries for a trip (flat) with pagination' })
  async listEntriesForTrip(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('tripId') tripId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.entriesService.listEntriesForTripView(
      req.user.id,
      tripId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
  }

  @Get(':tripId/locations-with-entries')
  @ApiOperation({
    summary:
      'List locations with entries for a trip (grouped), with pagination over locations',
  })
  async listLocationsWithEntries(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('tripId') tripId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.entriesService.findTripLocationsWithEntriesView(
      req.user.id,
      tripId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }
}
