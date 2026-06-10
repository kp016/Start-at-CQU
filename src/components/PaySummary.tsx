'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Download, Settings2, TrendingUp } from 'lucide-react';
import type { AppEvent, PaySettings } from '@/types';
import { getWeekSummary, getMonthSummary, getShiftHours, getShiftEarnings } from '@/lib/pay-calculator';
import { formatCurrency, formatHours, cn } from '@/lib/utils';

interface Props {
  events: AppEvent[];
  settings: PaySettings;
  onUpdateSettings: (patch: Partial<PaySettings>) => void;
}

export default function PaySummary({ events, settings, onUpdateSettings }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const week = getWeekSummary(events);
  const month = getMonthSummary(events);
  const weekNet = week.gross * (1 - settings.taxRate);
  const monthNet = month.gross * (1 - settings.taxRate);

  const exportCsv = () => {
    const shifts = events
      .filter((e) => e.type === 'shift')
      .sort((a, b) => a.start.localeCompare(b.start));
    const rows = [
      ['Date', 'Workplace', 'Start', 'End', 'Hours', 'Rate', 'Gross'],
      ...shifts.map((s) => [
        format(parseISO(s.start), 'yyyy-MM-dd'),
        s.title,
        s.allDay ? '' : format(parseISO(s.start), 'HH:mm'),
        s.allDay ? '' : format(parseISO(s.end), 'HH:mm'),
        getShiftHours(s).toFixed(2),
        String(s.hourlyRate ?? ''),
        getShiftEarnings(s).toFixed(2),
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
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 overflow-hidden">
      {/* Title row */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold dark:text-white">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          Pay summary
        </h3>
        <div className="flex gap-1">
          <button
            onClick={exportCsv}
            title="Export CSV"
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            className={cn(
              'rounded-xl p-1.5 transition-colors',
              settingsOpen
                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'
            )}
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        <StatCard
          label="This week"
          amount={week.gross}
          net={settings.taxRate > 0 ? weekNet : undefined}
          hours={week.hours}
          count={week.shiftCount}
          color="emerald"
        />
        <StatCard
          label="This month"
          amount={month.gross}
          net={settings.taxRate > 0 ? monthNet : undefined}
          hours={month.hours}
          count={month.shiftCount}
          color="indigo"
        />
      </div>

      {/* Settings accordion */}
      {settingsOpen && (
        <div className="border-t border-slate-100 dark:border-slate-700/60 px-4 py-3 space-y-3 animate-fadeIn">
          <SettingRow label="Default rate ($/hr)">
            <input
              type="number"
              min={0}
              step={0.5}
              value={settings.defaultHourlyRate}
              onChange={(e) => onUpdateSettings({ defaultHourlyRate: Number(e.target.value) })}
              className="w-20 rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent px-2.5 py-1.5 text-sm text-center dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </SettingRow>
          <SettingRow label="Tax estimate (%)">
            <input
              type="number"
              min={0}
              max={50}
              value={Math.round(settings.taxRate * 100)}
              onChange={(e) => onUpdateSettings({ taxRate: Number(e.target.value) / 100 })}
              className="w-20 rounded-xl border border-slate-200 dark:border-slate-600 bg-transparent px-2.5 py-1.5 text-sm text-center dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </SettingRow>
          <p className="text-xs text-slate-400">Estimate only — always check with a tax professional.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label, amount, net, hours, count, color,
}: {
  label: string;
  amount: number;
  net?: number;
  hours: number;
  count: number;
  color: 'emerald' | 'indigo';
}) {
  const bg = color === 'emerald'
    ? 'bg-emerald-50 dark:bg-emerald-950/30'
    : 'bg-indigo-50 dark:bg-indigo-950/30';
  const text = color === 'emerald'
    ? 'text-emerald-800 dark:text-emerald-300'
    : 'text-indigo-800 dark:text-indigo-300';
  const sub = color === 'emerald'
    ? 'text-emerald-600 dark:text-emerald-500'
    : 'text-indigo-600 dark:text-indigo-500';

  return (
    <div className={`rounded-xl p-3 ${bg}`}>
      <p className={`text-xs font-medium ${sub}`}>{label}</p>
      <p className={`text-2xl font-bold tracking-tight mt-0.5 ${text}`}>
        {formatCurrency(amount)}
      </p>
      <p className={`text-xs mt-0.5 ${sub}`}>
        {formatHours(hours)} · {count} shift{count === 1 ? '' : 's'}
      </p>
      {net != null && (
        <p className={`text-xs ${sub}`}>≈ {formatCurrency(net)} after tax</p>
      )}
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      {children}
    </div>
  );
}
