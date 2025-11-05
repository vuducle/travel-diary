import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Notifications')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications (paginated)' })
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
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - missing or invalid JWT',
  })
  async list(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 10));
    return this.notifications.list(req.user.id, p, l);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - missing or invalid JWT',
  })
  async markRead(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.notifications.markRead(req.user.id, id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - missing or invalid JWT',
  })
  async markAllRead(@Request() req: ExpressRequest & { user: { id: string } }) {
    return this.notifications.markAllRead(req.user.id);
  }
}
