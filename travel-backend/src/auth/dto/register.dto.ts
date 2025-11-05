import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ example: 'armindorri@test.de' })
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(20, { message: 'Username must be at most 20 characters long' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  @ApiProperty({ example: 'armindorri' })
  username!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'password123' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Armin Dorri' })
  name!: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'Travel enthusiast and photographer',
    required: false,
  })
  bio?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'Jakarta Java, Indonesia', required: false })
  location?: string;
}
