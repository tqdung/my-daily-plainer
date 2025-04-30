// src/calendar/google-calendar.adapter.ts
import { Injectable } from '@nestjs/common';
import { Task, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CalendarAdapter } from './interfaces/calendar.adapter';
import { decrypt } from 'src/common/utils';

type GoogleCalendarEventBody = {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  recurrence?: string[];
};

@Injectable()
export class GoogleCalendarAdapter implements CalendarAdapter {
  constructor(private prisma: PrismaService) {}

  async createEvent(user: User, task: Task): Promise<string | null> {
    const eventBody: GoogleCalendarEventBody = {
      summary: task.title,
      description: task.description ?? '',
      start: {
        dateTime: task.startDate?.toISOString() ?? '',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: task.dueDate?.toISOString() ?? '',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      recurrence: task.repeat
        ? [
            `RRULE:FREQ=${task.repeat.toUpperCase()}${
              task.repeatDays?.length
                ? ';BYDAY=' + task.repeatDays.join(',')
                : ''
            }`,
          ]
        : undefined,
    };

    try {
      const accessToken = decrypt(user.providerAccessToken ?? '');
      let response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventBody),
        },
      );

      if (response.status === 401) {
        const newToken = await this.refreshAccessToken(user);
        if (newToken) {
          response = await this.sendEventRequest(newToken, eventBody);
        }
      }

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Google Calendar error:', error);
        return null;
      }

      const result = await response.json();
      return result.id;
    } catch (err: any) {
      console.error(
        '❌ Failed to call Google Calendar API:',
        err?.message || err,
      );
      return null;
    }
  }

  private async sendEventRequest(token: string, body: GoogleCalendarEventBody) {
    return fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );
  }

  private async refreshAccessToken(user: User): Promise<string | null> {
    if (!user.providerRefreshToken) return null;

    const decryptedRefreshToken = decrypt(user.providerRefreshToken);

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: decryptedRefreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      console.error('❌ Failed to refresh Google access token');
      return null;
    }

    const data = await response.json();
    const newAccessToken = data.access_token;

    // Lưu access token mới vào DB
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        providerAccessToken: newAccessToken,
      },
    });

    return newAccessToken;
  }
}
