import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiProperty({ example: 'John Doe', required: false })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @ApiProperty({
    example: 'Travel enthusiast and photographer',
    required: false,
  })
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiProperty({ example: 'Jakarta, Indonesia', required: false })
  location?: string;
}
