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

  private async getUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async getEventByTask(taskId: string) {
    const event = await this.prisma.event.findFirst({ where: { taskId } });
    if (!event) throw new NotFoundException('Event not found for task');
    return event;
  }

  async createEventForTask(task: Task) {
    const user = await this.getUser(task.userId);

    const event = await this.prisma.event.create({
      data: {
        taskId: task.id,
        userId: task.userId,
        goalId: task.goalId,
        calendarProvider: user.calendarProvider as CalendarProvider,
      },
    });

    const externalId = await this.adapter.createEvent({ user, task });

    if (externalId) {
      await this.prisma.event.update({
        where: { id: event.id },
        data: { externalEventId: externalId },
      });
    }
  }

  async updateEventForTask(task: Task) {
    const user = await this.getUser(task.userId);
    const event = await this.getEventByTask(task.id);

    await this.adapter.updateEvent({
      user,
      task,
      externalCalendarEventId: event.externalEventId ?? '',
    });

    await this.prisma.event.update({
      where: { id: event.id },
      data: { goalId: task.goalId },
    });
  }

  async deleteEventForTask(task: Task) {
    const user = await this.getUser(task.userId);
    const event = await this.getEventByTask(task.id);

    await Promise.all([
      this.adapter.deleteEvent({
        user,
        externalCalendarEventId: event.externalEventId ?? '',
      }),
      this.prisma.event.delete({ where: { id: event.id } }),
    ]);
  }
}
