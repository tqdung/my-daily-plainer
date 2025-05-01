import { Task, User } from '@prisma/client';

export abstract class CalendarAdapter {
  abstract createEvent(params: {
    user: User;
    task: Task;
  }): Promise<string | null>;
  abstract updateEvent(params: {
    user: User;
    task: Task;
    externalCalendarEventId: string;
  }): Promise<string | null>;
  abstract deleteEvent(params: {
    user: User;
    externalCalendarEventId: string;
  }): Promise<string | null>;
}
