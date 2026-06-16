'use client';

import { useState } from 'react';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { Wallet, Download, Clock, TrendingUp, CalendarClock, Building2, Settings2 } from 'lucide-react';
import type { AppEvent, PaySettings } from '@/types';
import {
  getWeekSummary, getMonthSummary, getWeeklyBreakdown, getWorkplaceBreakdown,
  getShiftHours, getShiftEarnings,
} from '@/lib/pay-calculator';
import { formatCurrency, formatHours } from '@/lib/utils';

interface Props {
  events: AppEvent[];
  settings: PaySettings;
  onUpdateSettings: (patch: Partial<PaySettings>) => void;
}

export default function EarningsView({ events, settings, onUpdateSettings }: Props) {
  const [showSettings, setShowSettings] = useState(false);

  const week = getWeekSummary(events);
  const month = getMonthSummary(events);
  const bars = getWeeklyBreakdown(events, 6);
  const workplaces = getWorkplaceBreakdown(events);
  const maxBar = Math.max(...bars.map((b) => b.gross), 1);

  const allShifts = events.filter((e) => e.type === 'shift');
  const allTime = allShifts.reduce((s, e) => s + getShiftEarnings(e), 0);
  const upcoming = allShifts
    .filter((s) => isAfter(parseISO(s.start), new Date()))
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 5);
  const recent = allShifts
    .filter((s) => isBefore(parseISO(s.start), new Date()))
    .sort((a, b) => b.start.localeCompare(a.start))
    .slice(0, 5);

  const exportCsv = () => {
    const rows = [
      ['Date', 'Workplace', 'Start', 'End', 'Hours', 'Rate', 'Gross'],
      ...allShifts
        .sort((a, b) => a.start.localeCompare(b.start))
        .map((s) => [
          format(parseISO(s.start), 'yyyy-MM-dd'), s.title,
          s.allDay ? '' : format(parseISO(s.start), 'HH:mm'),
          s.allDay ? '' : format(parseISO(s.end), 'HH:mm'),
          getShiftHours(s).toFixed(2), String(s.hourlyRate ?? ''), getShiftEarnings(s).toFixed(2),
        ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `shifts-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-5 animate-fadeIn max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-cream-100 flex items-center gap-2">
            <Wallet className="h-6 w-6 text-emerald-500" /> Earnings
          </h1>
          <p className="text-sm text-ink-700/70 dark:text-cream-100/50">Track what you&apos;re making</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSettings((v) => !v)} className="flex items-center gap-1.5 rounded-xl border border-sand-200 dark:border-[#34302a] bg-white dark:bg-white/5 px-3 py-2 text-sm font-medium text-ink-700 dark:text-cream-100/70 hover:bg-cream-100 transition-colors">
            <Settings2 className="h-4 w-4" /> Rate
          </button>
          <button onClick={exportCsv} className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors">
            <Download className="h-4 w-4" /> CSV
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="rounded-2xl bg-white dark:bg-white/5 border border-sand-200 dark:border-[#34302a] p-4 flex flex-wrap gap-5 animate-fadeIn">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-ink-700 dark:text-cream-100/70">Default $/hr</span>
            <input type="number" min={0} step={0.5} value={settings.defaultHourlyRate}
              onChange={(e) => onUpdateSettings({ defaultHourlyRate: Number(e.target.value) })}
              className="w-24 rounded-xl border border-sand-200 dark:border-[#34302a] bg-cream-50 dark:bg-white/5 px-3 py-1.5 text-center dark:text-cream-100" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-ink-700 dark:text-cream-100/70">Tax estimate %</span>
            <input type="number" min={0} max={50} value={Math.round(settings.taxRate * 100)}
              onChange={(e) => onUpdateSettings({ taxRate: Number(e.target.value) / 100 })}
              className="w-24 rounded-xl border border-sand-200 dark:border-[#34302a] bg-cream-50 dark:bg-white/5 px-3 py-1.5 text-center dark:text-cream-100" />
          </label>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <BigStat label="This week" value={formatCurrency(week.gross)} sub={`${formatHours(week.hours)} · ${week.shiftCount} shifts`} gradient="from-emerald-500 to-teal-600" icon={TrendingUp} />
        <BigStat label="This month" value={formatCurrency(month.gross)} sub={`${formatHours(month.hours)} · ${month.shiftCount} shifts`} gradient="from-violet-500 to-indigo-600" icon={CalendarClock} />
        <BigStat label="All time" value={formatCurrency(allTime)} sub={`${allShifts.length} shifts logged`} gradient="from-amber-500 to-orange-600" icon={Wallet} />
        <BigStat label="After tax (month)" value={formatCurrency(month.gross * (1 - settings.taxRate))} sub={settings.taxRate > 0 ? `${Math.round(settings.taxRate * 100)}% est. tax` : 'set tax in Rate'} gradient="from-rose-500 to-pink-600" icon={Clock} />
      </div>

      {/* Chart */}
      <div className="rounded-2xl bg-white dark:bg-white/5 border border-sand-200 dark:border-[#34302a] p-5 shadow-warm">
        <h2 className="text-sm font-bold text-ink-900 dark:text-cream-100 mb-4">Last 6 weeks</h2>
        <div className="flex items-end justify-between gap-2 sm:gap-4 h-48">
          {bars.map((b, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
              <span className="text-xs font-semibold text-ink-700 dark:text-cream-100/70 opacity-0 group-hover:opacity-100 transition-opacity">
                {formatCurrency(b.gross)}
              </span>
              <div className="w-full flex items-end justify-center flex-1">
                <div
                  className={`w-full max-w-[48px] rounded-t-xl transition-all ${b.isCurrent ? 'bg-gradient-to-t from-emerald-500 to-teal-400' : 'bg-gradient-to-t from-violet-400 to-indigo-300'} hover:opacity-80`}
                  style={{ height: `${Math.max((b.gross / maxBar) * 100, 3)}%` }}
                />
              </div>
              <span className="text-xs text-ink-700/60 dark:text-cream-100/40">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Workplaces */}
      {workplaces.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-white/5 border border-sand-200 dark:border-[#34302a] p-5 shadow-warm">
          <h2 className="text-sm font-bold text-ink-900 dark:text-cream-100 mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-violet-500" /> By workplace
          </h2>
          <div className="space-y-2">
            {workplaces.map((w) => (
              <div key={w.name} className="flex items-center gap-3">
                <span className="text-sm font-semibold text-ink-900 dark:text-cream-100 w-32 truncate">{w.name}</span>
                <div className="flex-1 h-2.5 rounded-full bg-cream-200 dark:bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400" style={{ width: `${(w.gross / workplaces[0].gross) * 100}%` }} />
                </div>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 w-20 text-right">{formatCurrency(w.gross)}</span>
                <span className="text-xs text-ink-700/60 dark:text-cream-100/40 w-16 text-right">{formatHours(w.hours)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming + recent */}
      <div className="grid md:grid-cols-2 gap-4">
        <ShiftList title="Upcoming shifts" empty="No shifts coming up" shifts={upcoming} />
        <ShiftList title="Recent shifts" empty="No past shifts yet" shifts={recent} />
      </div>
    </div>
  );
}

function BigStat({ label, value, sub, gradient, icon: Icon }: {
  label: string; value: string; sub: string; gradient: string; icon: typeof Wallet;
}) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${gradient} p-4 shadow-warm relative overflow-hidden`}>
      <Icon className="absolute -right-2 -bottom-2 h-16 w-16 text-white/10" />
      <p className="text-xs font-medium text-white/80">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      <p className="text-xs text-white/75 mt-0.5">{sub}</p>
    </div>
  );
}

function ShiftList({ title, shifts, empty }: { title: string; shifts: AppEvent[]; empty: string }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-white/5 border border-sand-200 dark:border-[#34302a] p-5 shadow-warm">
      <h2 className="text-sm font-bold text-ink-900 dark:text-cream-100 mb-3">{title}</h2>
      {shifts.length === 0 ? (
        <p className="text-sm text-ink-700/50 dark:text-cream-100/40">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {shifts.map((s) => (
            <li key={s.id} className="flex items-center gap-3 rounded-xl bg-cream-50 dark:bg-white/5 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-900 dark:text-cream-100 truncate">{s.title}</p>
                <p className="text-xs text-ink-700/60 dark:text-cream-100/40">
                  {format(parseISO(s.start), 'EEE d MMM')} · {format(parseISO(s.start), 'h:mmaaa')}–{format(parseISO(s.end), 'h:mmaaa')}
                </p>
              </div>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 shrink-0">{formatCurrency(getShiftEarnings(s))}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
