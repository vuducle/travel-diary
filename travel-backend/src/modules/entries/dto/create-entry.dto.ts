import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateEntryDto {
  @ApiProperty({ example: 'Nguyen Hue street coffee date <3 UwU.' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    example: 'Coffee date with a cute viet-german guy I met online',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string;

  @ApiProperty({ example: '2024-10-01T19:30:00Z', required: false })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ example: 'uuid-trip-id' })
  @IsString()
  tripId!: string;

  @ApiProperty({ example: 'uuid-location-id', required: false })
  @IsOptional()
  @IsString()
  locationId?: string;
}
