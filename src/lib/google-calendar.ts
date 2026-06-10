import type { AppEvent, AppEventType } from '@/types';

const BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

interface GoogleEvent {
  id: string;
  summary?: string;
  location?: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  recurrence?: string[];
  extendedProperties?: { private?: Record<string, string> };
}

function toAppEvent(g: GoogleEvent): AppEvent {
  const props = g.extendedProperties?.private ?? {};
  const allDay = !g.start.dateTime;
  return {
    id: g.id,
    title: g.summary ?? '(no title)',
    start: g.start.dateTime ?? g.start.date ?? '',
    end: g.end.dateTime ?? g.end.date ?? '',
    allDay,
    type: (props.appType as AppEventType) ?? 'timeblock',
    hourlyRate: props.hourlyRate ? Number(props.hourlyRate) : undefined,
    completed: props.completed === 'true',
    location: g.location,
    notes: g.description,
    recurrence: g.recurrence,
  };
}

function toGoogleBody(event: Partial<AppEvent>) {
  const body: Record<string, unknown> = {
    summary: event.title,
    location: event.location,
    description: event.notes,
    extendedProperties: {
      private: {
        appType: event.type,
        ...(event.hourlyRate != null ? { hourlyRate: String(event.hourlyRate) } : {}),
        ...(event.completed != null ? { completed: String(event.completed) } : {}),
      },
    },
  };
  if (event.allDay) {
    body.start = { date: event.start?.slice(0, 10) };
    body.end = { date: event.end?.slice(0, 10) };
  } else {
    body.start = { dateTime: event.start, timeZone: 'Australia/Brisbane' };
    body.end = { dateTime: event.end, timeZone: 'Australia/Brisbane' };
  }
  if (event.recurrence?.length) body.recurrence = event.recurrence;
  return body;
}

async function gfetch(accessToken: string, url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Calendar API ${res.status}: ${text}`);
  }
  return res.status === 204 ? null : res.json();
}

export async function listEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<AppEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '500',
  });
  const data = await gfetch(accessToken, `${BASE}?${params}`);
  return (data.items as GoogleEvent[])
    .filter((g) => g.extendedProperties?.private?.appType)
    .map(toAppEvent);
}

export async function createEvent(
  accessToken: string,
  event: Partial<AppEvent>
): Promise<AppEvent> {
  const data = await gfetch(accessToken, BASE, {
    method: 'POST',
    body: JSON.stringify(toGoogleBody(event)),
  });
  return toAppEvent(data);
}

export async function updateEvent(
  accessToken: string,
  id: string,
  event: Partial<AppEvent>
): Promise<AppEvent> {
  const data = await gfetch(accessToken, `${BASE}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(toGoogleBody(event)),
  });
  return toAppEvent(data);
}

export async function deleteEvent(accessToken: string, id: string): Promise<void> {
  await gfetch(accessToken, `${BASE}/${id}`, { method: 'DELETE' });
}
