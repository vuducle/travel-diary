import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    example: 'Vietnam looks great! - Julia Nguyễn',
    maxLength: 1000,
  })
  @IsString()
  @MaxLength(1000)
  content!: string;

  @ApiProperty({
    required: false,
    description: 'Parent comment id for replies',
  })
  @IsOptional()
  @IsString()
  parentId?: string;
}
