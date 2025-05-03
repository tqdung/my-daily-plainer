export interface GoogleCalendarEvent {
  id: string;
  summary?: string;
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
  status?: string;
  created?: string;
  updated?: string;
  htmlLink?: string;
  organizer?: { email: string };
  creator?: { email: string };
  location?: string;
  visibility?: string;
}
