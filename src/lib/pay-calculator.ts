import { differenceInMinutes, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, subWeeks, format } from 'date-fns';
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

export interface WeekBar {
  label: string;
  gross: number;
  hours: number;
  isCurrent: boolean;
}

/** Earnings for each of the last `weeks` weeks (oldest → newest). */
export function getWeeklyBreakdown(events: AppEvent[], weeks = 6, reference = new Date()): WeekBar[] {
  const shifts = events.filter((e) => e.type === 'shift');
  const bars: WeekBar[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const ref = subWeeks(reference, i);
    const interval = {
      start: startOfWeek(ref, { weekStartsOn: 1 }),
      end: endOfWeek(ref, { weekStartsOn: 1 }),
    };
    const inWeek = shifts.filter((s) => isWithinInterval(parseISO(s.start), interval));
    const { gross, hours } = summarise(inWeek);
    bars.push({ label: format(interval.start, 'd MMM'), gross, hours, isCurrent: i === 0 });
  }
  return bars;
}

export interface WorkplaceRow {
  name: string;
  gross: number;
  hours: number;
  shifts: number;
}

/** Totals grouped by workplace name (all shifts). */
export function getWorkplaceBreakdown(events: AppEvent[]): WorkplaceRow[] {
  const map = new Map<string, WorkplaceRow>();
  for (const s of events) {
    if (s.type !== 'shift') continue;
    const key = s.title || 'Unnamed';
    const row = map.get(key) ?? { name: key, gross: 0, hours: 0, shifts: 0 };
    row.gross += getShiftEarnings(s);
    row.hours += getShiftHours(s);
    row.shifts += 1;
    map.set(key, row);
  }
  return Array.from(map.values()).sort((a, b) => b.gross - a.gross);
}
