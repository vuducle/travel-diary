import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TripsService } from './trips.service';
import type { Request as ExpressRequest } from 'express';

@ApiTags('Trips')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersTripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get(':userId/trips')
  @ApiOperation({
    summary: 'List trips of a user visible to the current viewer',
  })
  async listVisibleTrips(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tripsService.findVisibleTripsForUser(
      req.user.id,
      userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
  }
}
