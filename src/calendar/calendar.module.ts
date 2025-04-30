import { Module } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CalendarAdapter } from './interfaces/calendar.adapter';
import { GoogleCalendarAdapter } from './google-calendar.adapter';

@Module({
  providers: [
    CalendarService,
    { provide: CalendarAdapter, useClass: GoogleCalendarAdapter },
  ],
  exports: [CalendarService],
})
export class CalendarModule {}
