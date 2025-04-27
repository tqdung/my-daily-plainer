import { ApiProperty } from '@nestjs/swagger';
import { TaskRepeat, TaskStatus } from '@prisma/client';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';

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
  dueDate?: string;

  @ApiProperty({ enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiProperty({ enum: TaskRepeat })
  @IsOptional()
  @IsEnum(TaskRepeat)
  repeat?: TaskRepeat;

  @ApiProperty()
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedTime?: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  goalId?: string;
}
