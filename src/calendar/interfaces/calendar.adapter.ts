import { Task, User } from '@prisma/client';

export abstract class CalendarAdapter {
  abstract createEvent(user: User, task: Task): Promise<string | null>;
}
