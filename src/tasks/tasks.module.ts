import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { CalendarModule } from 'src/calendar/calendar.module';

@Module({
  imports: [CalendarModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
