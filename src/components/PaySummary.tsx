'use client';

import { useEffect, useState } from 'react';
import { Wallet, Download, Settings2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { AppEvent, PaySettings } from '@/types';
import { getWeekSummary, getMonthSummary, getShiftHours, getShiftEarnings } from '@/lib/pay-calculator';
import { getPaySettings, savePaySettings } from '@/lib/storage';
import { formatCurrency, formatHours } from '@/lib/utils';

export default function PaySummary({ events }: { events: AppEvent[] }) {
  const [settings, setSettings] = useState<PaySettings | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setSettings(getPaySettings());
  }, []);

  if (!settings) return null;

  const week = getWeekSummary(events);
  const month = getMonthSummary(events);
  const weekNet = week.gross * (1 - settings.taxRate);
  const monthNet = month.gross * (1 - settings.taxRate);

  const updateSettings = (patch: Partial<PaySettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    savePaySettings(next);
  };

  const exportCsv = () => {
    const shifts = events
      .filter((e) => e.type === 'shift')
      .sort((a, b) => a.start.localeCompare(b.start));
    const rows = [
      ['Date', 'Workplace', 'Start', 'End', 'Hours', 'Rate', 'Gross'],
      ...shifts.map((s) => [
        format(parseISO(s.start), 'yyyy-MM-dd'),
        s.title,
        format(parseISO(s.start), 'HH:mm'),
        format(parseISO(s.end), 'HH:mm'),
        getShiftHours(s).toFixed(2),
        String(s.hourlyRate ?? ''),
        getShiftEarnings(s).toFixed(2),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `shifts-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Wallet className="h-4 w-4 text-emerald-600" /> Pay
        </h2>
        <div className="flex gap-1">
          <button
            onClick={exportCsv}
            title="Export shifts to CSV"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowSettings((v) => !v)}
            title="Pay settings"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-emerald-50 p-3">
          <p className="text-xs text-emerald-700">This week</p>
          <p className="text-xl font-bold text-emerald-800">{formatCurrency(week.gross)}</p>
          <p className="text-xs text-emerald-600">
            {formatHours(week.hours)} · {week.shiftCount} shift{week.shiftCount === 1 ? '' : 's'}
          </p>
          {settings.taxRate > 0 && (
            <p className="text-xs text-emerald-600">≈ {formatCurrency(weekNet)} after tax</p>
          )}
        </div>
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-blue-700">This month</p>
          <p className="text-xl font-bold text-blue-800">{formatCurrency(month.gross)}</p>
          <p className="text-xs text-blue-600">
            {formatHours(month.hours)} · {month.shiftCount} shift{month.shiftCount === 1 ? '' : 's'}
          </p>
          {settings.taxRate > 0 && (
            <p className="text-xs text-blue-600">≈ {formatCurrency(monthNet)} after tax</p>
          )}
        </div>
      </div>

      {showSettings && (
        <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
          <label className="flex items-center justify-between gap-2">
            <span className="text-slate-600">Default rate $/hr</span>
            <input
              type="number"
              min={0}
              step={0.5}
              value={settings.defaultHourlyRate}
              onChange={(e) => updateSettings({ defaultHourlyRate: Number(e.target.value) })}
              className="w-20 rounded border border-slate-200 px-2 py-1"
            />
          </label>
          <label className="flex items-center justify-between gap-2">
            <span className="text-slate-600">Tax estimate %</span>
            <input
              type="number"
              min={0}
              max={50}
              value={Math.round(settings.taxRate * 100)}
              onChange={(e) => updateSettings({ taxRate: Number(e.target.value) / 100 })}
              className="w-20 rounded border border-slate-200 px-2 py-1"
            />
          </label>
          <p className="text-xs text-slate-400">Tax figure is a rough estimate only.</p>
        </div>
      )}
    </div>
  );
}
