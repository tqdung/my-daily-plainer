import { Module } from '@nestjs/common';
import * as winston from 'winston';
import {
  WinstonModule,
  utilities as nestWinstonModuleUtilities,
} from 'nest-winston';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { PrismaModule } from './prisma/prisma.module';
import { CalendarModule } from './calendar/calendar.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    TasksModule,
    PrismaModule,
    CalendarModule,
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            nestWinstonModuleUtilities.format.nestLike('MyPlanner', {
              prettyPrint: true,
            }),
          ),
        }),

        new winston.transports.File({
          filename: 'logs/combined.log',
          level: 'warn',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),

        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),
  ],
})
export class AppModule {}
