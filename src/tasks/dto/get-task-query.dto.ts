import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { TaskStatus } from '@prisma/client';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ApiProperty } from '@nestjs/swagger';

export class GetTaskQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
