'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Pencil, Trash2, X, Loader2, MapPin, Clock, DollarSign } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <div>
            <span
              className="mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: EVENT_COLORS[event.type] }}
            >
              {EVENT_LABELS[event.type]}
            </span>
            <h2 className="text-lg font-semibold">{event.title}</h2>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2 text-sm text-slate-600">
          <p className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            {format(parseISO(event.start), 'EEE d MMM')}
            {!event.allDay &&
              ` · ${format(parseISO(event.start), 'h:mmaaa')}–${format(parseISO(event.end), 'h:mmaaa')}`}
          </p>
          {event.location && (
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-400" />
              {event.location}
            </p>
          )}
          {event.type === 'shift' && event.hourlyRate != null && (
            <p className="flex items-center gap-2 font-medium text-emerald-700">
              <DollarSign className="h-4 w-4" />
              {formatHours(getShiftHours(event))} × ${event.hourlyRate}/hr ={' '}
              {formatCurrency(getShiftEarnings(event))}
            </p>
          )}
          {event.notes && <p className="rounded-lg bg-slate-50 p-2">{event.notes}</p>}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={onEdit}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
