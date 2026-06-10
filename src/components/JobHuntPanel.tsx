'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { X, Copy, Check, Plus, Trash2, Bell, BellOff } from 'lucide-react';
import type { JobApplication } from '@/types';
import { getJobApplications, saveJobApplications } from '@/lib/storage';

const POST_TEMPLATES = [
  {
    label: 'Facebook group post',
    text: `Hey everyone! 👋 I'm a uni student at CQU looking for casual bar or café work over the holidays. I'm reliable, a quick learner, happy to work weekends and nights, and available right away. RSA-ready and keen to get started — DM me if you know anyone hiring! ☕🍻`,
  },
  {
    label: 'Direct message to a venue',
    text: `Hi! I'm a CQU student looking for casual work over the holiday period. I'm hardworking, available weekends/nights, and can start immediately. Would you have any bar or café shifts going, or could I drop in with my resume? Thanks so much!`,
  },
  {
    label: 'Follow-up message',
    text: `Hi again! Just following up on my message from a few days ago about casual work — still very keen and available. Happy to come in for a trial shift any time. Thanks!`,
  },
];

const STATUS_OPTIONS: JobApplication['status'][] = [
  'applied',
  'followed-up',
  'interview',
  'offer',
  'rejected',
];

const STATUS_COLORS: Record<JobApplication['status'], string> = {
  applied: 'bg-slate-100 text-slate-700',
  'followed-up': 'bg-blue-100 text-blue-700',
  interview: 'bg-purple-100 text-purple-700',
  offer: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

interface Props {
  onClose: () => void;
  remindersEnabled: boolean;
  onToggleReminders: (enabled: boolean) => void;
}

export default function JobHuntPanel({ onClose, remindersEnabled, onToggleReminders }: Props) {
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [copied, setCopied] = useState<number | null>(null);
  const [business, setBusiness] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    setApps(getJobApplications());
  }, []);

  const persist = (next: JobApplication[]) => {
    setApps(next);
    saveJobApplications(next);
  };

  const copy = async (i: number) => {
    await navigator.clipboard.writeText(POST_TEMPLATES[i].text);
    setCopied(i);
    setTimeout(() => setCopied(null), 2000);
  };

  const addApp = () => {
    if (!business.trim()) return;
    persist([
      {
        id: crypto.randomUUID(),
        business: business.trim(),
        role: role.trim() || 'Casual',
        dateApplied: format(new Date(), 'yyyy-MM-dd'),
        method: 'facebook',
        status: 'applied',
      },
      ...apps,
    ]);
    setBusiness('');
    setRole('');
  };

  const updateStatus = (id: string, status: JobApplication['status']) => {
    persist(apps.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const remove = (id: string) => {
    persist(apps.filter((a) => a.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-lg overflow-y-auto bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Job Hunt — bar & café work 🍺☕</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <button
          onClick={() => onToggleReminders(!remindersEnabled)}
          className={`mb-5 flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium ${
            remindersEnabled
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-slate-50 text-slate-600'
          }`}
        >
          {remindersEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          {remindersEnabled
            ? 'Twice-daily reminders ON (9am & 5pm) — tap to turn off'
            : 'Twice-daily posting reminders OFF — tap to turn on'}
        </button>

        <h3 className="mb-2 text-sm font-semibold text-slate-700">Ready-to-copy post templates</h3>
        <p className="mb-3 text-xs text-slate-500">
          Auto-posting bots get Facebook accounts suspended, so instead: get a reminder twice a
          day, copy a template, and paste it into a local jobs group. Takes 30 seconds.
        </p>
        <div className="mb-6 space-y-3">
          {POST_TEMPLATES.map((t, i) => (
            <div key={i} className="rounded-lg border border-slate-200 p-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{t.label}</span>
                <button
                  onClick={() => copy(i)}
                  className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                >
                  {copied === i ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === i ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-sm text-slate-600">{t.text}</p>
            </div>
          ))}
        </div>

        <h3 className="mb-2 text-sm font-semibold text-slate-700">Application tracker</h3>
        <div className="mb-3 flex gap-2">
          <input
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addApp()}
            placeholder="Business name"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
          />
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addApp()}
            placeholder="Role"
            className="w-28 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
          />
          <button
            onClick={addApp}
            disabled={!business.trim()}
            className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {apps.length === 0 ? (
          <p className="text-sm text-slate-400">No applications logged yet.</p>
        ) : (
          <ul className="space-y-2">
            {apps.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{a.business}</p>
                  <p className="text-xs text-slate-500">
                    {a.role} · {a.dateApplied}
                  </p>
                </div>
                <select
                  value={a.status}
                  onChange={(e) => updateStatus(a.id, e.target.value as JobApplication['status'])}
                  className={`rounded-full border-0 px-2 py-1 text-xs font-medium ${STATUS_COLORS[a.status]}`}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => remove(a.id)}
                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
