'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Loader2, X } from 'lucide-react';
import type { AppEvent, AppEventType } from '@/types';
import { EVENT_LABELS, EVENT_COLORS } from '@/types';

interface Props {
  initial?: Partial<AppEvent> | null;
  defaultRate: number;
  onSave: (event: Partial<AppEvent>) => Promise<unknown>;
  onClose: () => void;
}

export default function EventForm({ initial, defaultRate, onSave, onClose }: Props) {
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
  const [hourlyRate, setHourlyRate] = useState(initial?.hourlyRate ?? defaultRate);
  const [location, setLocation] = useState(initial?.location ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [weekly, setWeekly] = useState(Boolean(initial?.recurrence?.length));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (type === 'todo') setAllDay(true);
  }, [type]);

  // Pay preview
  let payPreview: string | null = null;
  if (type === 'shift' && !allDay && hourlyRate > 0) {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const hrs = eh + em / 60 - (sh + sm / 60);
    if (hrs > 0) payPreview = `${hrs}h × $${hourlyRate} = $${(hrs * hourlyRate).toFixed(2)}`;
  }

  const submit = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
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
      completed: type === 'todo' ? (initial?.completed ?? false) : undefined,
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 animate-scaleIn overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700/60">
          <h2 className="font-semibold text-base dark:text-white">
            {editing ? 'Edit' : 'Add'} entry
          </h2>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4.5 w-4.5" size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Type pills */}
          <div className="flex gap-1.5 flex-wrap">
            {(Object.keys(EVENT_LABELS) as AppEventType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className="rounded-full px-3 py-1 text-xs font-semibold transition-all"
                style={
                  type === t
                    ? { backgroundColor: EVENT_COLORS[t], color: '#fff' }
                    : { backgroundColor: 'transparent', border: `1.5px solid ${EVENT_COLORS[t]}`, color: EVENT_COLORS[t] }
                }
              >
                {EVENT_LABELS[t]}
              </button>
            ))}
          </div>

          {/* Title */}
          <div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'shift' ? 'Workplace name' : type === 'uni' ? 'Subject / class name' : 'What is it?'}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:text-white transition-all placeholder:text-slate-400"
              autoFocus
            />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-3 gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="col-span-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent px-3 py-2 text-sm dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
            />
            {!allDay && (
              <>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="col-span-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent px-3 py-2 text-sm dark:text-white focus:border-indigo-500 outline-none transition-all"
                />
                <span className="flex items-center justify-center text-slate-400 text-sm">to</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="col-span-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent px-3 py-2 text-sm dark:text-white focus:border-indigo-500 outline-none transition-all"
                />
              </>
            )}
          </div>

          {/* Checkboxes */}
          <div className="flex gap-5 text-sm text-slate-600 dark:text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="rounded accent-indigo-600"
              />
              All-day
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={weekly}
                onChange={(e) => setWeekly(e.target.checked)}
                className="rounded accent-indigo-600"
              />
              Repeats weekly
            </label>
          </div>

          {/* Pay rate */}
          {type === 'shift' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400 shrink-0">$/hr</span>
              <input
                type="number"
                min={0}
                step={0.5}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-24 rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent px-3 py-2 text-sm dark:text-white focus:border-indigo-500 outline-none"
              />
              {payPreview && (
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 ml-1">
                  = {payPreview.split('= ')[1]}
                </span>
              )}
            </div>
          )}

          {/* Location + Notes */}
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (optional)"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 dark:text-white transition-all placeholder:text-slate-400"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 dark:text-white transition-all placeholder:text-slate-400 resize-none"
          />

          {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

          <button
            onClick={submit}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? 'Save changes' : 'Add to calendar'}
          </button>
        </div>
      </div>
    </div>
  );
}
