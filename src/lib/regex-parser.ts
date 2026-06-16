import { addDays, format, nextDay, type Day } from 'date-fns';
import type { ParsedEvent, AppEventType } from '@/types';

/**
 * Free, offline natural-language parser for shift/event text.
 * No API key required. Used as the default parser, and as a fallback
 * when ANTHROPIC_API_KEY is not configured or the API call fails.
 */

const WEEKDAYS: Record<string, Day> = {
  sun: 0, sunday: 0, mon: 1, monday: 1, tue: 2, tues: 2, tuesday: 2,
  wed: 3, weds: 3, wednesday: 3, thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5, sat: 6, saturday: 6,
};

const MONTHS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
];

function parseTime(raw: string): string | null {
  const m = raw.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  const ap = m[3]?.toLowerCase();
  if (ap === 'pm' && h < 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function resolveDate(lower: string, now: Date): { date: string; recurring: boolean } {
  const recurring = /\b(every|each|weekly)\b/.test(lower);

  if (/\btomorrow\b/.test(lower)) {
    return { date: format(addDays(now, 1), 'yyyy-MM-dd'), recurring };
  }
  if (/\b(today|tonight)\b/.test(lower)) {
    return { date: format(now, 'yyyy-MM-dd'), recurring };
  }

  // numeric date: 15/6, 15-6-2026
  const dm = lower.match(/\b(\d{1,2})[/\-](\d{1,2})(?:[/\-](\d{2,4}))?\b/);
  if (dm) {
    const day = Number(dm[1]);
    const month = Number(dm[2]) - 1;
    let year = dm[3] ? Number(dm[3]) : now.getFullYear();
    if (year < 100) year += 2000;
    return { date: format(new Date(year, month, day), 'yyyy-MM-dd'), recurring };
  }

  // "june 15" or "15 june"
  for (let i = 0; i < 12; i++) {
    const mo = MONTHS[i];
    const a = lower.match(new RegExp(`\\b${mo}[a-z]*\\s+(\\d{1,2})\\b`));
    const b = lower.match(new RegExp(`\\b(\\d{1,2})\\s+${mo}[a-z]*\\b`));
    const m = a ?? b;
    if (m) {
      const day = Number(m[1]);
      return { date: format(new Date(now.getFullYear(), i, day), 'yyyy-MM-dd'), recurring };
    }
  }

  // weekday name
  for (const [name, dow] of Object.entries(WEEKDAYS)) {
    if (new RegExp(`\\b${name}\\b`).test(lower)) {
      const todayDow = now.getDay();
      let target: Date;
      if (/\bnext\b/.test(lower)) {
        target = todayDow === dow ? addDays(now, 7) : nextDay(now, dow);
      } else {
        target = todayDow === dow ? now : nextDay(now, dow);
      }
      return { date: format(target, 'yyyy-MM-dd'), recurring };
    }
  }

  return { date: format(now, 'yyyy-MM-dd'), recurring };
}

function resolveTimes(lower: string): { start?: string; end?: string } {
  const range = lower.match(
    /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|–|—|to|till|til|until|through)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i
  );
  if (range) {
    const startHasAp = /am|pm/i.test(range[1]);
    const endHasAp = /am|pm/i.test(range[2]);
    let start = parseTime(range[1]);
    const end = parseTime(range[2]);
    // "5-11pm" → infer the start meridiem from the end
    if (!startHasAp && endHasAp && start && end) {
      const ap = /pm/i.test(range[2]) ? 'pm' : 'am';
      const inferred = parseTime(range[1].trim() + ap);
      if (inferred && inferred <= end) start = inferred;
    }
    return { start: start ?? undefined, end: end ?? undefined };
  }

  const single = lower.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i);
  if (single) {
    const t = parseTime(single[1]);
    return { start: t ?? undefined };
  }
  return {};
}

function parsePay(text: string): number | undefined {
  const dollar = text.match(/\$\s*(\d+(?:\.\d{1,2})?)/);
  if (dollar) return parseFloat(dollar[1]);
  const worded = text.match(/(\d+(?:\.\d{1,2})?)\s*(?:dollars?|bucks?)/i);
  if (worded) return parseFloat(worded[1]);
  return undefined;
}

function detectType(lower: string): AppEventType {
  if (/\b(lecture|tutorial|tute|tutes|class|classes|uni|seminar|workshop|exam|lab|prac)\b/.test(lower)) return 'uni';
  if (/\b(remind|reminder|todo|to-do|task|buy|email|submit|pay\s+bill|pick\s+up|don'?t\s+forget)\b/.test(lower)) return 'todo';
  if (/\b(gym|study|studying|break|rest|workout|work\s*out|run|reading|read|block|meditate|nap)\b/.test(lower)) return 'timeblock';
  return 'shift';
}

function extractLocation(text: string): string | undefined {
  const m = text.match(/\bat\s+(?:the\s+)?([A-Za-z][A-Za-z0-9'&.\- ]*?)(?=\s*(?:\$|\bfor\b|\bevery\b|\bon\b|\bfrom\b|\d|$))/i);
  if (m) {
    const loc = m[1].trim().replace(/\s+(every|today|tomorrow|tonight)$/i, '').trim();
    return loc || undefined;
  }
  return undefined;
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function cleanTitle(text: string, type: AppEventType): string {
  let t = ` ${text} `;
  // pay
  t = t.replace(/\$\s*\d+(?:\.\d{1,2})?\s*(?:\/\s*h(?:r|our)?|ph|p\/h|an?\s*hour|per\s*hour)?/gi, ' ');
  t = t.replace(/\d+(?:\.\d{1,2})?\s*(?:dollars?|bucks?)(?:\s*(?:\/\s*h|ph|an?\s*hour|per\s*hour))?/gi, ' ');
  // times
  t = t.replace(/\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*(?:-|–|—|to|till|til|until|through)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?/gi, ' ');
  t = t.replace(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi, ' ');
  t = t.replace(/\b\d{1,2}[/\-]\d{1,2}(?:[/\-]\d{2,4})?\b/g, ' ');
  // dates / days
  t = t.replace(/\b(every|each|weekly|next|this|on|from|tomorrow|today|tonight)\b/gi, ' ');
  t = t.replace(/\b(sun|sunday|mon|monday|tue|tues|tuesday|wed|weds|wednesday|thu|thur|thurs|thursday|fri|friday|sat|saturday)\b/gi, ' ');
  t = t.replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/gi, ' ');
  // connective filler
  t = t.replace(/\b(at|the|for|a|an)\b/gi, ' ');
  if (type === 'shift') t = t.replace(/\b(shift|working)\b/gi, ' ');
  if (type === 'todo') t = t.replace(/\b(remind\s+me\s+to|remind\s+me|reminder\s+to|reminder|todo|to-do|task|don'?t\s+forget\s+to)\b/gi, ' ');
  return t.replace(/\s+/g, ' ').trim();
}

function parseOne(text: string, now: Date): ParsedEvent | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();

  const type = detectType(lower);
  const { date, recurring } = resolveDate(lower, now);
  const { start, end } = type === 'todo' ? {} : resolveTimes(lower);
  const hourlyRate = type === 'shift' ? parsePay(trimmed) : undefined;
  const location = extractLocation(trimmed);

  let title = cleanTitle(trimmed, type);
  if (!title && location) title = location;
  if (!title) {
    title = { shift: 'Shift', uni: 'Class', todo: 'Reminder', timeblock: 'Time block' }[type];
  }

  return {
    title: titleCase(title),
    date,
    startTime: start,
    endTime: end,
    hourlyRate,
    location: location ? titleCase(location) : undefined,
    type,
    recurringWeekly: recurring,
  };
}

export function parseShiftText(text: string, now: Date = new Date()): ParsedEvent[] {
  // split on newlines and semicolons; keep it simple and predictable
  const chunks = text
    .split(/[\n;]+/)
    .map((c) => c.trim())
    .filter(Boolean);

  const entries = (chunks.length ? chunks : [text])
    .map((c) => parseOne(c, now))
    .filter((e): e is ParsedEvent => e !== null);

  return entries;
}
