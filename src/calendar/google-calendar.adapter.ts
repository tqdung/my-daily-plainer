import { Injectable, Logger } from '@nestjs/common';
import { Task, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CalendarAdapter } from './interfaces/calendar.adapter';
import { GoogleCalendarEvent } from './interfaces/google-calendar-event';
import { decrypt } from 'src/common/utils';

type Method = 'POST' | 'PATCH' | 'DELETE';

@Injectable()
export class GoogleCalendarAdapter implements CalendarAdapter {
  private readonly logger: Logger = new Logger(GoogleCalendarAdapter.name);
  constructor(private prisma: PrismaService) {}

  private buildEventPayload(task: Task): GoogleCalendarEvent {
    return {
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
      id: '', // Placeholder, Google will generate this
    };
  }

  private async refreshAccessToken(user: User): Promise<string | null> {
    if (!user.providerRefreshToken) return null;

    const decryptedRefreshToken = decrypt(user.providerRefreshToken);
    const body = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      refresh_token: decryptedRefreshToken ?? '',
      grant_type: 'refresh_token',
    });

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!res.ok) {
      this.logger.error('❌ Failed to refresh access token', await res.text());
      return null;
    }

    const data = await res.json();
    await this.prisma.user.update({
      where: { id: user.id },
      data: { providerAccessToken: data.access_token },
    });

    return data.access_token;
  }

  private async callGoogleAPI({
    user,
    method,
    task,
    externalCalendarEventId,
  }: {
    user: User;
    method: Method;
    task?: Task;
    externalCalendarEventId?: string;
  }): Promise<string | null> {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      user.email,
    )}/events${externalCalendarEventId ? `/${externalCalendarEventId}` : ''}`;

    const headers = {
      Authorization: `Bearer ${user.providerAccessToken}`,
      'Content-Type': 'application/json',
    };

    const body = task
      ? JSON.stringify(this.buildEventPayload(task))
      : undefined;
    let res = await fetch(url, { method, headers, body });

    if (res.status === 401) {
      const newToken = await this.refreshAccessToken(user);
      if (!newToken) return null;

      res = await fetch(url, {
        method,
        headers: {
          ...headers,
          Authorization: `Bearer ${newToken}`,
        },
        body,
      });
    }

    if (!res.ok) {
      this.logger.error(
        `❌ Google Calendar ${method} failed (${res.status}):`,
        await res.text(),
      );
      return null;
    }

    if (res.status === 204) return externalCalendarEventId ?? null;

    const data: GoogleCalendarEvent = await res.json();
    return data.id;
  }

  async createEvent({ user, task }: { user: User; task: Task }) {
    return this.callGoogleAPI({ user, task, method: 'POST' });
  }

  async updateEvent({
    user,
    task,
    externalCalendarEventId,
  }: {
    user: User;
    task: Task;
    externalCalendarEventId: string;
  }) {
    return this.callGoogleAPI({
      user,
      task,
      method: 'PATCH',
      externalCalendarEventId,
    });
  }

  async deleteEvent({
    user,
    externalCalendarEventId,
  }: {
    user: User;
    externalCalendarEventId: string;
  }) {
    return this.callGoogleAPI({
      user,
      method: 'DELETE',
      externalCalendarEventId,
    });
  }
}
