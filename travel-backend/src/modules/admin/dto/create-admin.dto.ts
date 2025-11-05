import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

export class CreateAdminDto {
  @ApiProperty({
    example: 'abdullahyildirim@example.com',
    description: 'The email of the admin',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'abdullahyildirim',
    description: 'The username of the admin (alphanumeric, 3-20 characters)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username!: string;

  @ApiProperty({
    example: 'admin123!',
    description: 'The password for the admin (minimum 6 characters)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @ApiProperty({
    example: 'Abdullah Yildirim',
    description: 'The name of the admin',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    example: 'Meow meow! I am an admin.',
    description: 'A short bio about the admin',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  bio?: string;

  @ApiProperty({
    example: 'Samsung, Turkey',
    description: 'The location of the admin',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  location?: string;
}
