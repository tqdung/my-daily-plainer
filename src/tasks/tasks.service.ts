import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Task } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './dto';
import { MAX_PAGINATION_LIMIT } from 'src/constants';
import { PaginationResponse } from 'src/common/types';
import { CalendarService } from 'src/calendar/calendar.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private calendarService: CalendarService,
  ) {}

  async getTasks({
    where,
    page = 1,
    limit = 10,
  }: {
    where: Prisma.TaskWhereInput;
    page?: number;
    limit?: number;
  }): Promise<PaginationResponse<Task>> {
    const safeLimit = Math.min(limit, MAX_PAGINATION_LIMIT);
    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip: (page - 1) * safeLimit,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.task.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async create({ userId, data }: { userId: string; data: CreateTaskDto }) {
    const { goalId, ...rest } = data;

    const task = await this.prisma.task.create({
      data: {
        ...rest,
        user: {
          connect: { id: userId },
        },
        goal: goalId
          ? {
              connect: { id: goalId },
            }
          : undefined,
      },
      include: {
        user: true,
        goal: !!goalId,
      },
    });

    if (task.startDate && task.dueDate) {
      await this.calendarService.createEventForTask(task);
    }

    return task;
  }

  async update(id: string, data: UpdateTaskDto) {
    const updatedTask = await this.prisma.task.update({ where: { id }, data });

    const hasTime = updatedTask.startDate && updatedTask.dueDate;
    const existingEvent = await this.prisma.event.findFirst({
      where: {
        taskId: updatedTask.id,
      },
    });

    const shouldCreateEvent = !existingEvent && hasTime;
    const shouldUpdateEvent = !!existingEvent && hasTime;
    const shouldDeleteEvent = !!existingEvent && !hasTime;

    if (shouldCreateEvent) {
      await this.calendarService.createEventForTask(updatedTask);
    }

    if (shouldUpdateEvent) {
      await this.calendarService.updateEventForTask(updatedTask);
    }

    if (shouldDeleteEvent) {
      await this.calendarService.deleteEventForTask(updatedTask);
    }

    return updatedTask;
  }

  async remove(id: string) {
    const task = await this.findOne(id);
    const existingEvent = await this.prisma.event.findFirst({
      where: {
        taskId: id,
      },
    });

    if (task && existingEvent) {
      await this.calendarService.deleteEventForTask(task);
    }
    return this.prisma.task.delete({ where: { id } });
  }

  hasTaskPermission(task: Task, userId: string) {
    return task && userId && userId === task.userId;
  }
}
