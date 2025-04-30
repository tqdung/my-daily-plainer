import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsInt,
  IsUUID,
  IsArray,
  Min,
} from 'class-validator';
import { TaskStatus, TaskRepeat } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ enum: TaskRepeat })
  @IsOptional()
  @IsEnum(TaskRepeat)
  repeat?: TaskRepeat;

  @ApiProperty({ type: [String], example: ['MO', 'FR'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  repeatDays?: string[];

  @ApiProperty({ enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiProperty()
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedTime?: number;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  goalId?: string;
}
