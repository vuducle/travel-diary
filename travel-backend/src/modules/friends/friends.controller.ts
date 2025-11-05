import {
  Controller,
  Post,
  Patch,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FriendsService } from './friends.service';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { RespondToFriendRequestDto } from './dto/respond-friend-request.dto';

@ApiTags('Friends')
@Controller('friends')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  private getUserId(req: unknown): string {
    return (req as { user: { id: string } }).user.id;
  }

  @Post('request')
  @ApiOperation({ summary: 'Send a friend request to another user' })
  @ApiResponse({
    status: 201,
    description: 'Friend request sent successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot send friend request to yourself',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Friend request already exists or users are already friends',
  })
  async sendFriendRequest(
    @Request() req: any,
    @Body() sendFriendRequestDto: SendFriendRequestDto,
  ) {
    const userId = this.getUserId(req);
    return this.friendsService.sendFriendRequest(
      userId,
      sendFriendRequestDto.addresseeId,
    );
  }

  @Patch('request/respond')
  @ApiOperation({ summary: 'Accept or reject a friend request' })
  @ApiResponse({
    status: 200,
    description: 'Friend request responded to successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Friend request has already been responded to',
  })
  @ApiResponse({
    status: 403,
    description: 'You can only respond to friend requests sent to you',
  })
  @ApiResponse({
    status: 404,
    description: 'Friend request not found',
  })
  async respondToFriendRequest(
    @Request() req: any,
    @Body() respondToFriendRequestDto: RespondToFriendRequestDto,
  ) {
    const userId = this.getUserId(req);
    return this.friendsService.respondToFriendRequest(
      userId,
      respondToFriendRequestDto.friendshipId,
      respondToFriendRequestDto.action,
    );
  }

  @Delete('request/:friendshipId')
  @ApiOperation({ summary: 'Cancel a pending friend request you sent' })
  @ApiParam({
    name: 'friendshipId',
    description: 'The ID of the friend request to cancel',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Friend request cancelled successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Can only cancel pending friend requests',
  })
  @ApiResponse({
    status: 403,
    description: 'You can only cancel requests you sent',
  })
  @ApiResponse({
    status: 404,
    description: 'Friend request not found',
  })
  async cancelFriendRequest(
    @Request() req: any,
    @Param('friendshipId') friendshipId: string,
  ) {
    const userId = this.getUserId(req);
    return this.friendsService.cancelFriendRequest(userId, friendshipId);
  }

  @Delete(':friendId')
  @ApiOperation({ summary: 'Remove a friend from your friends list' })
  @ApiParam({
    name: 'friendId',
    description: 'The ID of the friend to remove',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Friend removed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Friendship not found',
  })
  async removeFriend(@Request() req: any, @Param('friendId') friendId: string) {
    const userId = this.getUserId(req);
    return this.friendsService.removeFriend(userId, friendId);
  }

  @Get('list')
  @ApiOperation({ summary: 'Get your friends list' })
  @ApiResponse({
    status: 200,
    description: 'List of all your friends',
  })
  async getFriendsList(@Request() req: any) {
    const userId = this.getUserId(req);
    return this.friendsService.getFriendsList(userId);
  }

  @Get('requests/pending')
  @ApiOperation({ summary: 'Get friend requests sent to you' })
  @ApiResponse({
    status: 200,
    description: 'List of pending friend requests you received',
  })
  async getPendingRequests(@Request() req: any) {
    const userId = this.getUserId(req);
    return this.friendsService.getPendingRequests(userId);
  }

  @Get('requests/sent')
  @ApiOperation({ summary: 'Get friend requests you sent' })
  @ApiResponse({
    status: 200,
    description: 'List of friend requests you sent that are still pending',
  })
  async getSentRequests(@Request() req: any) {
    const userId = this.getUserId(req);
    return this.friendsService.getSentRequests(userId);
  }
}
