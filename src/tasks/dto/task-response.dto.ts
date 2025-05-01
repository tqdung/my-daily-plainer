import { AuthProvider, TaskRepeat, TaskStatus } from '@prisma/client';
import { Expose } from 'class-transformer';

export class TaskResponseDto {
  @Expose()
  id: string;

  @Expose()
  goalId: string;

  @Expose()
  externalEventId: string;

  @Expose()
  title: string;

  @Expose()
  description?: string;

  @Expose()
  startDate?: string;

  @Expose()
  dueDate?: string;

  @Expose()
  repeat?: TaskRepeat;

  @Expose()
  repeatDays?: string[];

  @Expose()
  status?: TaskStatus;

  @Expose()
  createdAt?: string;

  @Expose()
  updatedAt?: string;
}
