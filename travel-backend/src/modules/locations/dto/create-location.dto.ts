import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateLocationDto {
  @ApiProperty({ example: 'Ho Chi Minh City' })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ example: 'Vietnam', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiProperty({ example: 10.7769, required: false })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === null || typeof value === 'undefined'
      ? undefined
      : Number(value),
  )
  @IsNumber()
  lat?: number;

  @ApiProperty({ example: 106.7009, required: false })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === null || typeof value === 'undefined'
      ? undefined
      : Number(value),
  )
  @IsNumber()
  lng?: number;

  @ApiProperty({
    description: 'The trip this location belongs to',
    example: 'uuid-trip-id',
  })
  @IsString()
  tripId!: string;

  @ApiProperty({
    description: 'Optional parent location id (for hierarchy)',
    required: false,
  })
  @IsOptional()
  @IsString()
  parentId?: string;
}
