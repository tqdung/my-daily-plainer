import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, Min, Max } from 'class-validator';
import { MAX_PAGINATION_LIMIT } from 'src/constants';

export class PaginationDto {
  @ApiProperty({ type: 'number', required: false, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    type: 'number',
    required: false,
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @Min(1)
  @Max(MAX_PAGINATION_LIMIT)
  limit?: number = 10;
}
