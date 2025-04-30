import { ApiProperty } from '@nestjs/swagger';
import { AuthProvider, CalendarProvider } from '@prisma/client';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class LoginSocialDto {
  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ enum: AuthProvider })
  @IsEnum(AuthProvider)
  provider: AuthProvider;

  @IsString()
  providerId: string;

  @IsOptional()
  @IsString()
  accessToken: string;

  @IsOptional()
  @IsString()
  refreshToken: string;

  @IsOptional()
  @IsEnum(CalendarProvider)
  calendarProvider?: CalendarProvider;
}
