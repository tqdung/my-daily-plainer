import {
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Controller,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TasksService } from './tasks.service';
import { PaginationResponse } from 'src/common/types';
import {
  CreateTaskDto,
  UpdateTaskDto,
  GetTaskQueryDto,
  TaskResponseDto,
} from './dto';
import { UserResponseDto } from 'src/users/dto/user-response.dto';
import { CurrentUser, RequireAuth } from 'src/common/decorators';
import { transformResponse } from 'src/common/utils';

@Controller('tasks')
@RequireAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: UserResponseDto,
  ) {
    const task = await this.tasksService.create({
      userId: user.id,
      data: createTaskDto,
    });

    return transformResponse(TaskResponseDto, task);
  }

  @Get()
  async findAll(
    @Query() query: GetTaskQueryDto,
    @CurrentUser() user: UserResponseDto,
  ): Promise<PaginationResponse<TaskResponseDto>> {
    const { keyword, status, dueDate, limit, page } = query;

    const where: Prisma.TaskWhereInput = {
      userId: user.id,
      status,
      dueDate,
      ...(keyword
        ? {
            OR: [
              { title: { contains: keyword, mode: 'insensitive' } },
              { description: { contains: keyword, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const { data: tasks = [], ...rest } = await this.tasksService.getTasks({
      where,
      page,
      limit,
    });

    return {
      data: tasks.map((task) => transformResponse(TaskResponseDto, task)),
      ...rest,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: UserResponseDto) {
    const task = await this.tasksService.findOne(id);
    if (!this.tasksService.hasTaskPermission(task, user.id)) {
      throw new NotFoundException();
    }

    return transformResponse(TaskResponseDto, task);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: UserResponseDto,
  ) {
    const task = await this.tasksService.findOne(id);
    if (!this.tasksService.hasTaskPermission(task, user.id)) {
      throw new NotFoundException();
    }

    const updated = await this.tasksService.update(id, updateTaskDto);
    return transformResponse(TaskResponseDto, updated);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: UserResponseDto) {
    const task = await this.tasksService.findOne(id);
    if (!this.tasksService.hasTaskPermission(task, user.id)) {
      throw new NotFoundException();
    }

    const removed = await this.tasksService.remove(id);
    return transformResponse(TaskResponseDto, removed);
  }
}
