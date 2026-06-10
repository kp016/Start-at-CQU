'use client';

import { useCallback, useEffect, useState } from 'react';
import { addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import type { AppEvent } from '@/types';

export function useEvents() {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const timeMin = startOfMonth(subMonths(now, 1)).toISOString();
      const timeMax = endOfMonth(addMonths(now, 2)).toISOString();
      const res = await fetch(
        `/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load events');
      setEvents(data.events);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addEvent = useCallback(
    async (event: Partial<AppEvent>) => {
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create event');
      await refresh();
      return data.event as AppEvent;
    },
    [refresh]
  );

  const updateEvent = useCallback(
    async (id: string, event: Partial<AppEvent>) => {
      const res = await fetch(`/api/calendar/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to update event');
      await refresh();
    },
    [refresh]
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/calendar/events/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to delete event');
      }
      await refresh();
    },
    [refresh]
  );

  return { events, loading, error, refresh, addEvent, updateEvent, deleteEvent };
}
