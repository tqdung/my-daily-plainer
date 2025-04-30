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
import { Prisma, Task } from '@prisma/client';
import { TasksService } from './tasks.service';
import { PaginationResponse } from 'src/common/types';
import { CreateTaskDto, UpdateTaskDto, GetTaskQueryDto } from './dto';
import { UserResponseDto } from 'src/users/dto/user-response.dto';
import { CurrentUser, RequireAuth } from 'src/common/decorators';

@Controller('tasks')
@RequireAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: UserResponseDto,
  ) {
    return this.tasksService.create({ userId: user.id, data: createTaskDto });
  }

  @Get()
  async findAll(
    @Query() query: GetTaskQueryDto,
    @CurrentUser() user: UserResponseDto,
  ): Promise<PaginationResponse<Task>> {
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
    return this.tasksService.getTasks({
      where,
      page,
      limit,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: UserResponseDto) {
    const task = await this.tasksService.findOne(id);
    if (!this.tasksService.hasTaskPermission(task, user.id)) {
      throw new NotFoundException();
    }

    return task;
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

    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: UserResponseDto) {
    const task = await this.tasksService.findOne(id);
    if (!this.tasksService.hasTaskPermission(task, user.id)) {
      throw new NotFoundException();
    }

    return this.tasksService.remove(id);
  }
}
