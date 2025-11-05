import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateEntryDto } from './create-entry.dto';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateEntryDto extends PartialType(CreateEntryDto) {
  @ApiPropertyOptional({
    type: [String],
    description: 'IDs of images to remove',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }): string[] =>
    Array.isArray(value)
      ? value.map((v) => String(v))
      : value != null
        ? [String(value)]
        : [],
  )
  removeImageIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Final order of image IDs for this entry',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }): string[] =>
    Array.isArray(value)
      ? value.map((v) => String(v))
      : value != null
        ? [String(value)]
        : [],
  )
  reorderImageIds?: string[];
}
