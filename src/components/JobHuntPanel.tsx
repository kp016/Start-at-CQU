'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { X, Copy, Check, Plus, Trash2, Bell, BellOff, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import type { JobApplication } from '@/types';
import { cn } from '@/lib/utils';

const POST_TEMPLATES = [
  {
    label: 'Facebook group post',
    emoji: '📣',
    text: `Hey everyone! 👋 I'm a uni student at CQU looking for casual bar or café work over the holidays. I'm reliable, a quick learner, happy to work weekends and nights, and available right away. RSA-ready and keen to get started — DM me if you know anyone hiring! ☕🍻`,
  },
  {
    label: 'Direct message to a venue',
    emoji: '📩',
    text: `Hi! I'm a CQU student looking for casual work over the holiday period. I'm hardworking, available weekends/nights, and can start immediately. Would you have any bar or café shifts going, or could I drop in with my resume? Thanks so much!`,
  },
  {
    label: 'Follow-up message',
    emoji: '🔁',
    text: `Hi again! Just following up on my message from a few days ago about casual work — still very keen and available. Happy to come in for a trial shift any time. Thanks!`,
  },
];

const STATUS_META: Record<JobApplication['status'], { label: string; color: string }> = {
  applied: { label: 'Applied', color: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' },
  'followed-up': { label: 'Followed up', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
  interview: { label: 'Interview', color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' },
  offer: { label: 'Offer! 🎉', color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' },
  rejected: { label: 'No luck', color: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' },
};

interface Props {
  applications: JobApplication[];
  remindersEnabled: boolean;
  onUpdateApplications: (apps: JobApplication[]) => void;
  onToggleReminders: (enabled: boolean) => void;
  onClose: () => void;
}

export default function JobHuntPanel({
  applications,
  remindersEnabled,
  onUpdateApplications,
  onToggleReminders,
  onClose,
}: Props) {
  const [copied, setCopied] = useState<number | null>(null);
  const [business, setBusiness] = useState('');
  const [role, setRole] = useState('');
  const [expandedTemplate, setExpandedTemplate] = useState<number | null>(0);

  const copy = async (i: number) => {
    await navigator.clipboard.writeText(POST_TEMPLATES[i].text);
    setCopied(i);
    setTimeout(() => setCopied(null), 2000);
  };

  const addApp = () => {
    if (!business.trim()) return;
    const next = [
      {
        id: crypto.randomUUID(),
        business: business.trim(),
        role: role.trim() || 'Casual',
        dateApplied: format(new Date(), 'yyyy-MM-dd'),
        method: 'facebook',
        status: 'applied' as const,
      },
      ...applications,
    ];
    onUpdateApplications(next);
    setBusiness('');
    setRole('');
  };

  const updateStatus = (id: string, status: JobApplication['status']) => {
    onUpdateApplications(applications.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const remove = (id: string) => {
    onUpdateApplications(applications.filter((a) => a.id !== id));
  };

  const offers = applications.filter((a) => a.status === 'offer').length;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-lg overflow-y-auto bg-white dark:bg-slate-900 shadow-2xl animate-slideIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
          <div>
            <h2 className="font-bold text-base dark:text-white">Job Hunt 🍺☕</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {applications.length} applied
              {offers > 0 && ` · ${offers} offer${offers > 1 ? 's' : ''}! 🎉`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4.5 w-4.5" size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-6">
          {/* Reminders toggle */}
          <button
            onClick={() => onToggleReminders(!remindersEnabled)}
            className={cn(
              'flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-all',
              remindersEnabled
                ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400'
            )}
          >
            {remindersEnabled
              ? <Bell className="h-4 w-4 shrink-0" />
              : <BellOff className="h-4 w-4 shrink-0" />}
            <span className="flex-1 text-left">
              {remindersEnabled
                ? 'Reminders on — 9am & 5pm daily'
                : 'Enable twice-daily posting reminders'}
            </span>
            {remindersEnabled && (
              <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full px-2 py-0.5">ON</span>
            )}
          </button>

          {/* Templates */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <h3 className="text-sm font-semibold dark:text-white">Copy & paste templates</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Auto-posting gets accounts banned — these take 30 seconds to paste into a local jobs Facebook group.
            </p>
            <div className="space-y-2">
              {POST_TEMPLATES.map((t, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedTemplate(expandedTemplate === i ? null : i)}
                    className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span>{t.emoji}</span>
                      <span className="dark:text-slate-200">{t.label}</span>
                    </span>
                    {expandedTemplate === i
                      ? <ChevronUp className="h-4 w-4 text-slate-400" />
                      : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </button>
                  {expandedTemplate === i && (
                    <div className="border-t border-slate-100 dark:border-slate-700/40 bg-slate-50 dark:bg-slate-800/30 px-4 py-3 animate-fadeIn">
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">{t.text}</p>
                      <button
                        onClick={() => copy(i)}
                        className={cn(
                          'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
                          copied === i
                            ? 'bg-emerald-600 text-white'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        )}
                      >
                        {copied === i
                          ? <><Check className="h-3.5 w-3.5" /> Copied!</>
                          : <><Copy className="h-3.5 w-3.5" /> Copy text</>}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tracker */}
          <div>
            <h3 className="text-sm font-semibold mb-3 dark:text-white">Application tracker</h3>
            <div className="flex gap-2 mb-3">
              <input
                value={business}
                onChange={(e) => setBusiness(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addApp()}
                placeholder="Business name"
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent px-3 py-2 text-sm dark:text-white placeholder:text-slate-400 focus:border-indigo-500 outline-none transition-all"
              />
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addApp()}
                placeholder="Role"
                className="w-28 rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent px-3 py-2 text-sm dark:text-white placeholder:text-slate-400 focus:border-indigo-500 outline-none transition-all"
              />
              <button
                onClick={addApp}
                disabled={!business.trim()}
                className="rounded-xl bg-indigo-600 p-2 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {applications.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-600">No applications yet — start applying!</p>
            ) : (
              <ul className="space-y-2">
                {applications.map((a) => {
                  const meta = STATUS_META[a.status];
                  return (
                    <li
                      key={a.id}
                      className="flex items-center gap-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40 px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate dark:text-white">{a.business}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {a.role} · {a.dateApplied}
                        </p>
                      </div>
                      <select
                        value={a.status}
                        onChange={(e) => updateStatus(a.id, e.target.value as JobApplication['status'])}
                        className={cn(
                          'rounded-full border-0 px-2.5 py-1 text-xs font-semibold cursor-pointer',
                          meta.color
                        )}
                      >
                        {(Object.entries(STATUS_META) as [JobApplication['status'], { label: string }][]).map(
                          ([val, { label }]) => (
                            <option key={val} value={val}>{label}</option>
                          )
                        )}
                      </select>
                      <button
                        onClick={() => remove(a.id)}
                        className="rounded-lg p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
