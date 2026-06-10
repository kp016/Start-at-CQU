import { differenceInMinutes, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import type { AppEvent } from '@/types';

export function getShiftHours(shift: AppEvent): number {
  return differenceInMinutes(parseISO(shift.end), parseISO(shift.start)) / 60;
}

export function getShiftEarnings(shift: AppEvent): number {
  if (!shift.hourlyRate) return 0;
  return getShiftHours(shift) * shift.hourlyRate;
}

export interface PeriodSummary {
  hours: number;
  gross: number;
  shiftCount: number;
}

function summarise(shifts: AppEvent[]): PeriodSummary {
  return shifts.reduce(
    (acc, s) => ({
      hours: acc.hours + getShiftHours(s),
      gross: acc.gross + getShiftEarnings(s),
      shiftCount: acc.shiftCount + 1,
    }),
    { hours: 0, gross: 0, shiftCount: 0 }
  );
}

export function getWeekSummary(events: AppEvent[], reference = new Date()): PeriodSummary {
  const interval = {
    start: startOfWeek(reference, { weekStartsOn: 1 }),
    end: endOfWeek(reference, { weekStartsOn: 1 }),
  };
  return summarise(
    events.filter((e) => e.type === 'shift' && isWithinInterval(parseISO(e.start), interval))
  );
}

export function getMonthSummary(events: AppEvent[], reference = new Date()): PeriodSummary {
  const interval = { start: startOfMonth(reference), end: endOfMonth(reference) };
  return summarise(
    events.filter((e) => e.type === 'shift' && isWithinInterval(parseISO(e.start), interval))
  );
}
