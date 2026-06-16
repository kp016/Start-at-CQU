'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Copy, Check, Plus, Trash2, Bell, BellOff, Briefcase, Sparkles } from 'lucide-react';
import type { JobApplication } from '@/types';
import { cn } from '@/lib/utils';

const POST_TEMPLATES = [
  { label: 'Facebook group post', emoji: '📣', text: `Hey everyone! 👋 I'm a uni student at CQU looking for casual bar or café work over the holidays. I'm reliable, a quick learner, happy to work weekends and nights, and available right away. RSA-ready and keen to get started — DM me if you know anyone hiring! ☕🍻` },
  { label: 'Direct message to a venue', emoji: '📩', text: `Hi! I'm a CQU student looking for casual work over the holiday period. I'm hardworking, available weekends/nights, and can start immediately. Would you have any bar or café shifts going, or could I drop in with my resume? Thanks so much!` },
  { label: 'Follow-up message', emoji: '🔁', text: `Hi again! Just following up on my message from a few days ago about casual work — still very keen and available. Happy to come in for a trial shift any time. Thanks!` },
];

const STATUS_META: Record<JobApplication['status'], { label: string; color: string }> = {
  applied: { label: 'Applied', color: 'bg-sand-100 dark:bg-white/10 text-ink-700 dark:text-cream-100/70' },
  'followed-up': { label: 'Followed up', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
  interview: { label: 'Interview', color: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300' },
  offer: { label: 'Offer! 🎉', color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' },
  rejected: { label: 'No luck', color: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400' },
};

interface Props {
  applications: JobApplication[];
  remindersEnabled: boolean;
  onUpdateApplications: (apps: JobApplication[]) => void;
  onToggleReminders: (enabled: boolean) => void;
}

export default function JobHuntView({ applications, remindersEnabled, onUpdateApplications, onToggleReminders }: Props) {
  const [copied, setCopied] = useState<number | null>(null);
  const [business, setBusiness] = useState('');
  const [role, setRole] = useState('');

  const copy = async (i: number) => {
    await navigator.clipboard.writeText(POST_TEMPLATES[i].text);
    setCopied(i);
    setTimeout(() => setCopied(null), 2000);
  };

  const addApp = () => {
    if (!business.trim()) return;
    onUpdateApplications([
      { id: crypto.randomUUID(), business: business.trim(), role: role.trim() || 'Casual', dateApplied: format(new Date(), 'yyyy-MM-dd'), method: 'facebook', status: 'applied' },
      ...applications,
    ]);
    setBusiness('');
    setRole('');
  };

  const updateStatus = (id: string, status: JobApplication['status']) =>
    onUpdateApplications(applications.map((a) => (a.id === id ? { ...a, status } : a)));
  const remove = (id: string) => onUpdateApplications(applications.filter((a) => a.id !== id));

  const offers = applications.filter((a) => a.status === 'offer').length;

  return (
    <div className="space-y-5 animate-fadeIn max-w-4xl">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 p-6 shadow-warm relative overflow-hidden">
        <Briefcase className="absolute -right-3 -bottom-3 h-28 w-28 text-white/10" />
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">Job Hunt 🍺☕</h1>
        <p className="text-sm text-white/85 mt-1">
          Land a bar or café gig for the holidays · {applications.length} applied
          {offers > 0 && ` · ${offers} offer${offers > 1 ? 's' : ''}! 🎉`}
        </p>
      </div>

      {/* Reminders */}
      <button
        onClick={() => onToggleReminders(!remindersEnabled)}
        className={cn(
          'flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm font-semibold transition-all',
          remindersEnabled
            ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
            : 'border-sand-200 dark:border-[#34302a] bg-white dark:bg-white/5 text-ink-700 dark:text-cream-100/70'
        )}
      >
        {remindersEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
        <span className="flex-1 text-left">
          {remindersEnabled ? 'Reminders ON — 9am & 5pm daily nudges to post' : 'Turn on twice-daily posting reminders'}
        </span>
        {remindersEnabled && <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 rounded-full px-2 py-0.5">ON</span>}
      </button>

      {/* Templates */}
      <div>
        <h2 className="text-sm font-bold text-ink-900 dark:text-cream-100 mb-1 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-500" /> Copy &amp; paste templates
        </h2>
        <p className="text-xs text-ink-700/60 dark:text-cream-100/40 mb-3">Paste into a local jobs Facebook group — takes 30 seconds, no bots needed.</p>
        <div className="grid md:grid-cols-3 gap-3">
          {POST_TEMPLATES.map((t, i) => (
            <div key={i} className="rounded-2xl bg-white dark:bg-white/5 border border-sand-200 dark:border-[#34302a] p-4 flex flex-col shadow-warm">
              <p className="text-sm font-semibold text-ink-900 dark:text-cream-100 mb-2">{t.emoji} {t.label}</p>
              <p className="text-xs text-ink-700/80 dark:text-cream-100/60 leading-relaxed flex-1 mb-3">{t.text}</p>
              <button
                onClick={() => copy(i)}
                className={cn('flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all',
                  copied === i ? 'bg-emerald-500 text-white' : 'bg-violet-500 text-white hover:bg-violet-600')}
              >
                {copied === i ? <><Check className="h-3.5 w-3.5" /> Copied!</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tracker */}
      <div className="rounded-2xl bg-white dark:bg-white/5 border border-sand-200 dark:border-[#34302a] p-5 shadow-warm">
        <h2 className="text-sm font-bold text-ink-900 dark:text-cream-100 mb-3">Application tracker</h2>
        <div className="flex gap-2 mb-3">
          <input value={business} onChange={(e) => setBusiness(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addApp()} placeholder="Business name"
            className="flex-1 rounded-xl border border-sand-200 dark:border-[#34302a] bg-cream-50 dark:bg-white/5 px-3 py-2 text-sm dark:text-cream-100 placeholder:text-ink-700/40 focus:border-violet-400 outline-none transition-all" />
          <input value={role} onChange={(e) => setRole(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addApp()} placeholder="Role"
            className="w-32 rounded-xl border border-sand-200 dark:border-[#34302a] bg-cream-50 dark:bg-white/5 px-3 py-2 text-sm dark:text-cream-100 placeholder:text-ink-700/40 focus:border-violet-400 outline-none transition-all" />
          <button onClick={addApp} disabled={!business.trim()} className="rounded-xl bg-violet-500 p-2.5 text-white hover:bg-violet-600 disabled:opacity-40 transition-colors">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {applications.length === 0 ? (
          <p className="text-sm text-ink-700/50 dark:text-cream-100/40">No applications yet — copy a template above and start applying!</p>
        ) : (
          <ul className="space-y-2">
            {applications.map((a) => {
              const meta = STATUS_META[a.status];
              return (
                <li key={a.id} className="flex items-center gap-3 rounded-xl bg-cream-50 dark:bg-white/5 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-900 dark:text-cream-100 truncate">{a.business}</p>
                    <p className="text-xs text-ink-700/60 dark:text-cream-100/40">{a.role} · {a.dateApplied}</p>
                  </div>
                  <select value={a.status} onChange={(e) => updateStatus(a.id, e.target.value as JobApplication['status'])}
                    className={cn('rounded-full border-0 px-2.5 py-1 text-xs font-semibold cursor-pointer', meta.color)}>
                    {(Object.entries(STATUS_META) as [JobApplication['status'], { label: string }][]).map(([val, { label }]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                  <button onClick={() => remove(a.id)} className="rounded-lg p-1.5 text-ink-700/40 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
