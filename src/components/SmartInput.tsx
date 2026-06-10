'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Check, X } from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import type { ParsedEvent, AppEvent } from '@/types';
import { EVENT_LABELS, EVENT_COLORS } from '@/types';
import { getPaySettings } from '@/lib/storage';
import { formatCurrency } from '@/lib/utils';

interface Props {
  onAdd: (event: Partial<AppEvent>) => Promise<unknown>;
}

function parsedToAppEvent(p: ParsedEvent): Partial<AppEvent> {
  const allDay = !p.startTime;
  const start = allDay ? `${p.date}T00:00:00` : `${p.date}T${p.startTime}:00`;
  const end = allDay
    ? `${format(addDays(parseISO(p.date), 1), 'yyyy-MM-dd')}T00:00:00`
    : `${p.date}T${p.endTime ?? p.startTime}:00`;
  return {
    title: p.title,
    start,
    end,
    allDay,
    type: p.type,
    hourlyRate:
      p.type === 'shift'
        ? p.hourlyRate ?? getPaySettings().defaultHourlyRate
        : undefined,
    location: p.location ?? undefined,
    notes: p.notes ?? undefined,
    recurrence: p.recurringWeekly ? ['RRULE:FREQ=WEEKLY'] : undefined,
    completed: p.type === 'todo' ? false : undefined,
  };
}

export default function SmartInput({ onAdd }: Props) {
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState<ParsedEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parse = async () => {
    if (!text.trim()) return;
    setParsing(true);
    setError(null);
    setPending(null);
    try {
      const res = await fetch('/api/parse-shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (!data.entries?.length) {
        setError("Couldn't understand that — try something like \"Thursday 4pm-9pm at Maccas $25/hr\"");
        return;
      }
      setPending(data.entries);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setParsing(false);
    }
  };

  const confirmAll = async () => {
    if (!pending) return;
    setAdding(true);
    setError(null);
    try {
      for (const p of pending) {
        await onAdd(parsedToAppEvent(p));
      }
      setPending(null);
      setText('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && parse()}
            placeholder='Just type it... "shift friday 5-11pm at the pub $28/hr" or "uni lecture every tuesday 9-11am"'
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <button
          onClick={parse}
          disabled={parsing || !text.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Parse
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {pending && (
        <div className="mt-3 space-y-2">
          {pending.map((p, i) => {
            const rate = p.hourlyRate ?? (p.type === 'shift' ? getPaySettings().defaultHourlyRate : null);
            let pay: string | null = null;
            if (p.type === 'shift' && rate && p.startTime && p.endTime) {
              const [sh, sm] = p.startTime.split(':').map(Number);
              const [eh, em] = p.endTime.split(':').map(Number);
              const hours = eh + em / 60 - (sh + sm / 60);
              if (hours > 0) pay = `${hours}h × $${rate} = ${formatCurrency(hours * rate)}`;
            }
            return (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
              >
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                  style={{ backgroundColor: EVENT_COLORS[p.type] }}
                >
                  {EVENT_LABELS[p.type]}
                </span>
                <span className="font-medium">{p.title}</span>
                <span className="text-slate-500">
                  {format(parseISO(p.date), 'EEE d MMM')}
                  {p.startTime && ` · ${p.startTime}–${p.endTime ?? '?'}`}
                  {p.recurringWeekly && ' · weekly'}
                </span>
                {pay && <span className="ml-auto font-semibold text-emerald-600">{pay}</span>}
              </div>
            );
          })}
          <div className="flex gap-2">
            <button
              onClick={confirmAll}
              disabled={adding}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Add to calendar
            </button>
            <button
              onClick={() => setPending(null)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
