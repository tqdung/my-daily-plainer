import { Injectable, NotFoundException } from '@nestjs/common';
import { CalendarProvider, Task } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CalendarAdapter } from './interfaces/calendar.adapter';

@Injectable()
export class CalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adapter: CalendarAdapter,
  ) {}

  async findTaskEvent(taskId: string) {
    return this.prisma.event.findFirst({
      where: {
        taskId,
      },
    });
  }

  async createEventForTask(task: Task) {
    const user = await this.prisma.user.findUnique({
      where: { id: task.userId },
    });

    if (!user) {
      throw new NotFoundException();
    }

    const event = await this.prisma.event.create({
      data: {
        taskId: task.id,
        userId: task.userId,
        goalId: task.goalId ?? undefined,
        calendarProvider: user?.calendarProvider as CalendarProvider,
      },
    });

    const externalId = await this.adapter.createEvent({ user, task });

    if (externalId) {
      await this.prisma.event.update({
        where: { id: event.id },
        data: {
          externalEventId: externalId,
        },
      });
    }
  }

  async updateEventForTask(task: Task) {
    const user = await this.prisma.user.findUnique({
      where: { id: task.userId },
    });

    if (!user) {
      throw new NotFoundException();
    }

    const existingEvent = await this.findTaskEvent(task.id);

    if (!existingEvent) {
      throw new NotFoundException();
    }

    await Promise.all([
      this.prisma.event.update({
        where: { id: existingEvent.id },
        data: {
          goalId: task.goalId,
        },
      }),
      this.adapter.updateEvent({
        user,
        task,
        externalCalendarEventId: existingEvent.externalEventId ?? '',
      }),
    ]);
  }

  async deleteEventForTask(task: Task) {
    const user = await this.prisma.user.findUnique({
      where: { id: task.userId },
    });

    if (!user) {
      throw new NotFoundException();
    }

    const existingEvent = await this.findTaskEvent(task.id);

    if (!existingEvent) {
      throw new NotFoundException();
    }

    await Promise.all([
      this.prisma.event.delete({ where: { id: existingEvent.id } }),
      this.adapter.deleteEvent({
        user,
        externalCalendarEventId: existingEvent.externalEventId ?? '',
      }),
    ]);
  }
}
