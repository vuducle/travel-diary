import {
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
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { NotSuspendedGuard } from '../../common/guards/not-suspended.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Request as ExpressRequest } from 'express';

@ApiTags('Trips - Comments')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('trips')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment to a trip' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - missing or invalid JWT',
  })
  @ApiForbiddenResponse({ description: 'Forbidden - user is suspended' })
  @ApiBody({ type: CreateCommentDto })
  @UseGuards(JwtAuthGuard, NotSuspendedGuard)
  addComment(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.addComment(req.user.id, id, dto);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'List comments for a trip with pagination' })
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
  listComments(
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const p = Math.max(1, parseInt(String(page), 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 10));
    return this.commentsService.listComments(id, p, l);
  }

  @Patch('comments/:commentId')
  @ApiOperation({ summary: 'Update own comment' })
  @ApiParam({ name: 'commentId', type: 'string' })
  @ApiBody({ type: UpdateCommentDto })
  updateComment(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.updateComment(req.user.id, commentId, dto);
  }

  @Delete('comments/:commentId')
  @ApiOperation({ summary: 'Delete own comment' })
  @ApiParam({ name: 'commentId', type: 'string' })
  deleteComment(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('commentId') commentId: string,
  ) {
    return this.commentsService.deleteComment(req.user.id, commentId);
  }
}
