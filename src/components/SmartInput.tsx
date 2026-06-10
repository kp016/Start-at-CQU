'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Check, X, ArrowRight } from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import type { ParsedEvent, AppEvent } from '@/types';
import { EVENT_LABELS, EVENT_COLORS } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface Props {
  defaultRate: number;
  onAdd: (event: Partial<AppEvent>) => Promise<unknown>;
}

function parsedToAppEvent(p: ParsedEvent, defaultRate: number): Partial<AppEvent> {
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
    hourlyRate: p.type === 'shift' ? (p.hourlyRate ?? defaultRate) : undefined,
    location: p.location ?? undefined,
    notes: p.notes ?? undefined,
    recurrence: p.recurringWeekly ? ['RRULE:FREQ=WEEKLY'] : undefined,
    completed: p.type === 'todo' ? false : undefined,
  };
}

const EXAMPLES = [
  'shift friday 5–11pm at the pub $28/hr',
  'uni lecture every tuesday 9–11am',
  'gym session thursday 7am',
  'remind me to call work saturday',
];

export default function SmartInput({ defaultRate, onAdd }: Props) {
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState<ParsedEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exampleIdx] = useState(() => Math.floor(Math.random() * EXAMPLES.length));

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
        setError("Couldn't read that — try something like \"Friday 5–9pm at Maccas $25/hr\"");
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
        await onAdd(parsedToAppEvent(p, defaultRate));
      }
      setPending(null);
      setText('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const dismiss = (i: number) => {
    const next = pending!.filter((_, idx) => idx !== i);
    if (next.length === 0) setPending(null);
    else setPending(next);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      {/* Input bar */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Sparkles className="h-4 w-4 text-indigo-500 shrink-0" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !parsing && parse()}
            placeholder={`e.g. "${EXAMPLES[exampleIdx]}"`}
            className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 dark:text-slate-100"
          />
        </div>
        <button
          onClick={parse}
          disabled={parsing || !text.trim()}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 transition-all"
        >
          {parsing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ArrowRight className="h-3.5 w-3.5" />
          )}
          Add
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 pb-3 text-xs text-red-500 dark:text-red-400">{error}</div>
      )}

      {/* Preview cards */}
      {pending && (
        <div className="border-t border-slate-100 dark:border-slate-700/60 px-4 py-3 space-y-2 animate-fadeIn">
          {pending.map((p, i) => {
            const rate = p.hourlyRate ?? (p.type === 'shift' ? defaultRate : null);
            let pay: string | null = null;
            if (p.type === 'shift' && rate && p.startTime && p.endTime) {
              const [sh, sm] = p.startTime.split(':').map(Number);
              const [eh, em] = p.endTime.split(':').map(Number);
              const hours = eh + em / 60 - (sh + sm / 60);
              if (hours > 0) pay = `${hours}h = ${formatCurrency(hours * rate)}`;
            }
            return (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm"
              >
                <span
                  className="rounded-lg px-2 py-0.5 text-xs font-semibold text-white shrink-0"
                  style={{ backgroundColor: EVENT_COLORS[p.type] }}
                >
                  {EVENT_LABELS[p.type]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate dark:text-white">{p.title}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">
                    {format(parseISO(p.date), 'EEE d MMM')}
                    {p.startTime && ` · ${p.startTime}–${p.endTime ?? '?'}`}
                    {p.recurringWeekly && ' · every week'}
                    {p.location && ` · ${p.location}`}
                  </p>
                </div>
                {pay && (
                  <span className="shrink-0 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {pay}
                  </span>
                )}
                <button
                  onClick={() => dismiss(i)}
                  className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
          <div className="flex gap-2 pt-1">
            <button
              onClick={confirmAll}
              disabled={adding}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-all"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Add {pending.length > 1 ? `all ${pending.length}` : ''} to calendar
            </button>
            <button
              onClick={() => setPending(null)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
