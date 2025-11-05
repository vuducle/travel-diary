import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

export enum FriendRequestAction {
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT',
}

export class RespondToFriendRequestDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The ID of the friendship/friend request',
  })
  @IsString()
  @IsNotEmpty()
  friendshipId!: string;

  @ApiProperty({
    example: 'ACCEPT',
    description: 'Action to take on the friend request',
    enum: FriendRequestAction,
  })
  @IsEnum(FriendRequestAction)
  @IsNotEmpty()
  action!: FriendRequestAction;
}
