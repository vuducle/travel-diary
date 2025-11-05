import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { CreateTripDto } from './create-trip.dto';

export class UpdateTripDto extends PartialType(CreateTripDto) {
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    const v = String(value).toLowerCase();
    return v === 'true' || v === '1';
  })
  @IsBoolean()
  removeCover?: boolean;

  @ApiPropertyOptional({ enum: ['PRIVATE', 'FRIENDS', 'PUBLIC'] })
  @IsOptional()
  @IsIn(['PRIVATE', 'FRIENDS', 'PUBLIC'])
  visibility?: 'PRIVATE' | 'FRIENDS' | 'PUBLIC';
}
