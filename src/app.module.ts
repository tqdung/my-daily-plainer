import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { PrismaModule } from './prisma/prisma.module';
import { CalendarModule } from './calendar/calendar.module';

@Module({
  imports: [AuthModule, UsersModule, TasksModule, PrismaModule, CalendarModule],
})
export class AppModule {}
