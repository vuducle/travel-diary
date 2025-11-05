import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
  Body,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { NotSuspendedGuard } from '../../common/guards/not-suspended.guard';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { Request as ExpressRequest } from 'express';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations with friends' })
  @ApiResponse({
    status: 200,
    description: 'List of conversations with last message and unread count',
  })
  async getConversationsList(
    @Request() req: ExpressRequest & { user: { id: string } },
  ) {
    return this.chatService.getConversationsList(req.user.id);
  }

  @Get('conversation/:userId')
  @ApiOperation({ summary: 'Get message history with a specific friend' })
  @ApiParam({
    name: 'userId',
    description: 'The ID of the friend',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of messages to retrieve',
    required: false,
    example: 50,
  })
  @ApiResponse({
    status: 200,
    description: 'Message history',
  })
  @ApiResponse({
    status: 403,
    description: 'You can only view conversations with friends',
  })
  async getConversation(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.chatService.getConversation(
      req.user.id,
      userId,
      limit ? parseInt(limit.toString()) : 50,
    );
  }

  @Post('message')
  @ApiOperation({ summary: 'Send a message to a friend (REST endpoint)' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - missing or invalid JWT',
  })
  @ApiResponse({
    status: 201,
    description: 'Message sent successfully',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - not friends or user is suspended',
  })
  @UseGuards(JwtAuthGuard, NotSuspendedGuard)
  async sendMessage(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(
      req.user.id,
      sendMessageDto.receiverId,
      sendMessageDto.content,
    );
  }

  @Patch('message/:messageId/read')
  @ApiOperation({ summary: 'Mark a message as read' })
  @ApiParam({
    name: 'messageId',
    description: 'The ID of the message',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Message marked as read',
  })
  @ApiResponse({
    status: 403,
    description: 'You can only mark your own messages as read',
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found',
  })
  async markAsRead(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Param('messageId') messageId: string,
  ) {
    return this.chatService.markAsRead(messageId, req.user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get count of unread messages' })
  @ApiResponse({
    status: 200,
    description: 'Unread message count',
  })
  async getUnreadCount(
    @Request() req: ExpressRequest & { user: { id: string } },
  ) {
    return this.chatService.getUnreadCount(req.user.id);
  }
}
