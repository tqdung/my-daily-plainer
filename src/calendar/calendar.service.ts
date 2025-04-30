import { Injectable } from '@nestjs/common';
import { Task } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CalendarAdapter } from './interfaces/calendar.adapter';

@Injectable()
export class CalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adapter: CalendarAdapter,
  ) {}

  async createEventForTask(task: Task) {
    const user = await this.prisma.user.findUnique({
      where: { id: task.userId },
    });

    if (!user?.providerAccessToken || user.calendarProvider !== 'GOOGLE')
      return;

    const event = await this.prisma.event.create({
      data: {
        taskId: task.id,
        userId: task.userId,
        goalId: task.goalId ?? undefined,
      },
    });

    const externalId = await this.adapter.createEvent(user, task);

    if (externalId) {
      await this.prisma.event.update({
        where: { id: event.id },
        data: {
          calendarProvider: 'GOOGLE',
          externalCalendarEventId: externalId,
        },
      });
    }
  }
}
