'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Loader2, X } from 'lucide-react';
import type { AppEvent, AppEventType } from '@/types';
import { EVENT_LABELS } from '@/types';
import { getPaySettings } from '@/lib/storage';

interface Props {
  initial?: Partial<AppEvent> | null; // existing event = edit mode; partial = prefill
  onSave: (event: Partial<AppEvent>) => Promise<unknown>;
  onClose: () => void;
}

export default function EventForm({ initial, onSave, onClose }: Props) {
  const editing = Boolean(initial?.id);
  const [type, setType] = useState<AppEventType>(initial?.type ?? 'shift');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [date, setDate] = useState(
    initial?.start ? initial.start.slice(0, 10) : format(new Date(), 'yyyy-MM-dd')
  );
  const [startTime, setStartTime] = useState(
    initial?.start && !initial.allDay ? initial.start.slice(11, 16) : '09:00'
  );
  const [endTime, setEndTime] = useState(
    initial?.end && !initial.allDay ? initial.end.slice(11, 16) : '17:00'
  );
  const [allDay, setAllDay] = useState(initial?.allDay ?? false);
  const [hourlyRate, setHourlyRate] = useState(
    initial?.hourlyRate ?? getPaySettings().defaultHourlyRate
  );
  const [location, setLocation] = useState(initial?.location ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [weekly, setWeekly] = useState(Boolean(initial?.recurrence?.length));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (type === 'todo') setAllDay(true);
  }, [type]);

  const submit = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    setError(null);
    const event: Partial<AppEvent> = {
      ...(initial?.id ? { id: initial.id } : {}),
      title: title.trim(),
      type,
      allDay,
      start: allDay ? `${date}T00:00:00` : `${date}T${startTime}:00`,
      end: allDay ? `${date}T23:59:59` : `${date}T${endTime}:00`,
      hourlyRate: type === 'shift' ? hourlyRate : undefined,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      recurrence: weekly ? ['RRULE:FREQ=WEEKLY'] : undefined,
      completed: type === 'todo' ? initial?.completed ?? false : undefined,
    };
    try {
      await onSave(event);
      onClose();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{editing ? 'Edit' : 'Add'} entry</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex gap-1.5">
            {(Object.keys(EVENT_LABELS) as AppEventType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  type === t
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {EVENT_LABELS[t]}
              </button>
            ))}
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === 'shift' ? 'Workplace, e.g. Woolworths' : 'Title'}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
          />

          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            {!allDay && (
              <>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
                />
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="rounded-lg border border-slate-200 px-2 py-2 text-sm"
                />
              </>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-600">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
              All-day
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={weekly} onChange={(e) => setWeekly(e.target.checked)} />
              Repeats weekly
            </label>
          </div>

          {type === 'shift' && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-600">Hourly rate $</span>
              <input
                type="number"
                min={0}
                step={0.5}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          )}

          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (optional)"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={submit}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? 'Save changes' : 'Add to calendar'}
          </button>
        </div>
      </div>
    </div>
  );
}
