import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { LikesService } from './likes.service';
import type { Request as ExpressRequest } from 'express';

@ApiTags('Trips - Likes')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('trips')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post(':id/like')
  @ApiOperation({ summary: 'Like a trip' })
  @ApiParam({ name: 'id', type: 'string' })
  likeTrip(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.likesService.likeTrip(req.user.id, id);
  }

  @Delete(':id/like')
  @ApiOperation({ summary: 'Unlike a trip' })
  @ApiParam({ name: 'id', type: 'string' })
  unlikeTrip(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.likesService.unlikeTrip(req.user.id, id);
  }

  @Get(':id/likes')
  @ApiOperation({ summary: 'List likes for a trip with pagination' })
  @ApiParam({ name: 'id', type: 'string' })
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
    description: 'Limit (default 10, max 100)',
  })
  listLikes(
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const p = Math.max(1, parseInt(String(page), 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 10));
    return this.likesService.listLikes(id, p, l);
  }
}
