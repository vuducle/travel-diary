import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class LoginDto {
  @IsEmail()
  @ApiProperty({ example: 'wendyredvelvet@test.com' })
  email!: string;

  @IsString()
  @MinLength(6)
  @ApiProperty({ example: 'password123' })
  password!: string;
}
