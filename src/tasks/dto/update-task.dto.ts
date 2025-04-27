import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';
import { ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels(CreateTaskDto)
export class UpdateTaskDto extends PartialType(CreateTaskDto) {}
