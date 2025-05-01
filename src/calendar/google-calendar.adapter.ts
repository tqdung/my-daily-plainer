// src/calendar/google-calendar.adapter.ts
import { Injectable } from '@nestjs/common';
import { Task, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CalendarAdapter } from './interfaces/calendar.adapter';
import { decrypt } from 'src/common/utils';

// Reference: https://developers.google.com/workspace/calendar/api/v3/reference/events
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

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        providerAccessToken: newAccessToken,
      },
    });

    return newAccessToken;
  }

  private async syncTaskToGoogleCalendar({
    user,
    task,
    method,
    externalCalendarEventId,
  }: {
    user: User;
    task?: Task;
    method: 'POST' | 'PATCH' | 'DELETE';
    externalCalendarEventId?: string;
  }): Promise<string | null> {
    const event: GoogleCalendarEventBody = {
      summary: task?.title ?? '',
      description: task?.description ?? '',
      start: {
        dateTime: task?.startDate?.toISOString() ?? '',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: task?.dueDate?.toISOString() ?? '',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      recurrence: task?.repeat
        ? [
            `RRULE:FREQ=${task.repeat.toUpperCase()}${
              task.repeatDays?.length
                ? ';BYDAY=' + task.repeatDays.join(',')
                : ''
            }`,
          ]
        : undefined,
    };
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events${
      externalCalendarEventId ? `/${externalCalendarEventId}` : ''
    }`;

    let res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${user.providerAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    // Retry if 401
    if (res.status === 401) {
      const newToken = await this.refreshAccessToken(user);
      if (newToken) {
        res = await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${newToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        });
      }
    }

    if (!res.ok) {
      const error = await res.json();
      console.error(`❌ Google Calendar ${method} failed:`, error);
      return null;
    }

    if (res.status === 204) {
      return `${externalCalendarEventId}`;
    }

    const data = await res.json();
    return data?.id;
  }

  async createEvent({
    user,
    task,
  }: {
    user: User;
    task: Task;
  }): Promise<string | null> {
    return this.syncTaskToGoogleCalendar({ user, task, method: 'POST' });
  }

  async updateEvent({
    user,
    task,
    externalCalendarEventId,
  }: {
    user: User;
    task: Task;
    externalCalendarEventId: string;
  }): Promise<string | null> {
    if (!externalCalendarEventId) return null;

    return this.syncTaskToGoogleCalendar({ user, task, method: 'PATCH' });
  }

  async deleteEvent({
    user,
    externalCalendarEventId,
  }: {
    user: User;
    externalCalendarEventId: string;
  }): Promise<string | null> {
    if (!externalCalendarEventId) return null;

    return this.syncTaskToGoogleCalendar({
      user,
      method: 'DELETE',
      externalCalendarEventId,
    });
  }
}
