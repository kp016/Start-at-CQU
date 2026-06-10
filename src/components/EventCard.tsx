'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Pencil, Trash2, X, Loader2, MapPin, Clock, DollarSign, StickyNote } from 'lucide-react';
import type { AppEvent } from '@/types';
import { EVENT_COLORS, EVENT_LABELS } from '@/types';
import { getShiftHours, getShiftEarnings } from '@/lib/pay-calculator';
import { formatCurrency, formatHours } from '@/lib/utils';

interface Props {
  event: AppEvent;
  onEdit: () => void;
  onDelete: () => Promise<unknown>;
  onClose: () => void;
}

export default function EventCard({ event, onEdit, onDelete, onClose }: Props) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${event.title}"?`)) return;
    setDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch {
      setDeleting(false);
    }
  };

  const color = EVENT_COLORS[event.type];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 animate-scaleIn overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Colour stripe */}
        <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

        <div className="px-5 py-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span
                className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold text-white mb-1.5"
                style={{ backgroundColor: color }}
              >
                {EVENT_LABELS[event.type]}
              </span>
              <h2 className="text-lg font-bold dark:text-white leading-tight">{event.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-4.5 w-4.5" size={18} />
            </button>
          </div>

          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
              <Clock className="h-4 w-4 text-slate-400 shrink-0" />
              <span>
                {format(parseISO(event.start), 'EEEE d MMMM')}
                {!event.allDay && (
                  <>
                    {' · '}
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {format(parseISO(event.start), 'h:mmaaa')}
                      {' – '}
                      {format(parseISO(event.end), 'h:mmaaa')}
                    </span>
                  </>
                )}
              </span>
            </div>

            {event.location && (
              <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                {event.location}
              </div>
            )}

            {event.type === 'shift' && event.hourlyRate != null && (
              <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2.5">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(getShiftEarnings(event))}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500">
                    {formatHours(getShiftHours(event))} × ${event.hourlyRate}/hr
                  </p>
                </div>
              </div>
            )}

            {event.notes && (
              <div className="flex items-start gap-2.5 text-slate-600 dark:text-slate-400">
                <StickyNote className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-sm">{event.notes}</p>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={onEdit}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Pencil className="h-4 w-4" /> Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 dark:border-red-900/40 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 transition-colors"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
