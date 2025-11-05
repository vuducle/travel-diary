import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTripDto {
  @ApiProperty({ example: 'Summer in Java island' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'Exploring beaches and culture', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: '2025-06-01', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: '2025-06-14', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: ['PRIVATE', 'FRIENDS', 'PUBLIC'] })
  @IsOptional()
  @IsIn(['PRIVATE', 'FRIENDS', 'PUBLIC'])
  visibility?: 'PRIVATE' | 'FRIENDS' | 'PUBLIC';
}
