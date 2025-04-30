import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ default: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ default: 'password' })
  @IsString()
  password: string;
}
