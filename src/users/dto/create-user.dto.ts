import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AuthProvider, CalendarProvider } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ required: false, enum: AuthProvider })
  @IsOptional()
  provider?: AuthProvider;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  providerId?: string;

  @ApiProperty({ required: false, enum: CalendarProvider })
  @IsOptional()
  calendarProvider?: CalendarProvider;

  @IsOptional()
  @IsString()
  providerAccessToken?: string;

  @IsOptional()
  @IsString()
  providerRefreshToken?: string;
}
