'use client';

import { useEffect } from 'react';
import { differenceInMinutes, parseISO, format } from 'date-fns';
import type { AppEvent } from '@/types';
import { wasNotified, markNotified, getLastJobReminder, setLastJobReminder } from '@/lib/storage';

const SHIFT_REMINDER_MIN = 60;
const JOB_SLOTS = [9, 17];

export default function NotificationManager({
  events,
  jobHuntEnabled,
}: {
  events: AppEvent[];
  jobHuntEnabled: boolean;
}) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'default') Notification.requestPermission();

    const check = () => {
      if (Notification.permission !== 'granted') return;
      const now = new Date();

      for (const e of events) {
        if (e.type !== 'shift') continue;
        const minsAway = differenceInMinutes(parseISO(e.start), now);
        const key = `${e.id}-${e.start.slice(0, 10)}`;
        if (minsAway > 0 && minsAway <= SHIFT_REMINDER_MIN && !wasNotified(key)) {
          new Notification(`Shift soon: ${e.title}`, {
            body: `Starts at ${format(parseISO(e.start), 'h:mmaaa')}${e.location ? ` · ${e.location}` : ''}`,
            tag: key,
          });
          markNotified(key);
        }
      }

      if (jobHuntEnabled) {
        const hour = now.getHours();
        const slot = JOB_SLOTS.filter((h) => hour >= h).pop();
        if (slot != null) {
          const slotTime = new Date(now);
          slotTime.setHours(slot, 0, 0, 0);
          if (getLastJobReminder() < slotTime.getTime()) {
            new Notification('Job hunt time! ☕🍺', {
              body: 'Open the Job Hunt tab to copy a post template — takes 30 seconds.',
              tag: `jobhunt-${slot}`,
            });
            setLastJobReminder(now.getTime());
          }
        }
      }
    };

    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [events, jobHuntEnabled]);

  return null;
}
