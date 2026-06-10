'use client';

import { useEffect } from 'react';
import { differenceInMinutes, parseISO, format } from 'date-fns';
import type { AppEvent } from '@/types';
import {
  wasNotified,
  markNotified,
  getLastJobReminder,
  setLastJobReminder,
} from '@/lib/storage';

const SHIFT_REMINDER_MINUTES = 60;
const JOB_REMINDER_HOURS = [9, 17]; // twice a day: 9am and 5pm

// Invisible component: checks every minute for upcoming shifts and
// twice-daily job hunt reminders, fires browser notifications.
export default function NotificationManager({
  events,
  jobHuntEnabled,
}: {
  events: AppEvent[];
  jobHuntEnabled: boolean;
}) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const check = () => {
      if (Notification.permission !== 'granted') return;
      const now = new Date();

      for (const e of events) {
        if (e.type !== 'shift') continue;
        const minutesAway = differenceInMinutes(parseISO(e.start), now);
        const key = `${e.id}-${e.start.slice(0, 10)}`;
        if (minutesAway > 0 && minutesAway <= SHIFT_REMINDER_MINUTES && !wasNotified(key)) {
          new Notification(`Shift soon: ${e.title}`, {
            body: `Starts at ${format(parseISO(e.start), 'h:mmaaa')}${e.location ? ` · ${e.location}` : ''}`,
            tag: key,
          });
          markNotified(key);
        }
      }

      if (jobHuntEnabled) {
        const hour = now.getHours();
        const slot = JOB_REMINDER_HOURS.filter((h) => hour >= h).pop();
        if (slot != null) {
          const slotTime = new Date(now);
          slotTime.setHours(slot, 0, 0, 0);
          if (getLastJobReminder() < slotTime.getTime()) {
            new Notification('Job hunt time! ☕🍺', {
              body: 'Post in a local jobs group or drop a resume somewhere. Open the Job Hunt tab for ready-made post templates.',
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
