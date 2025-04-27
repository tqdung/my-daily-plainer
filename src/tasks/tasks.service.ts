import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Task } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './dto';
import { MAX_PAGINATION_LIMIT } from 'src/constants';
import { PaginationResponse } from 'src/common/types';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  create({ userId, data }: { userId: string; data: CreateTaskDto }) {
    const { goalId, ...rest } = data;

    return this.prisma.task.create({
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
  }

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

  update(id: string, data: UpdateTaskDto) {
    return this.prisma.task.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.task.delete({ where: { id } });
  }
}
