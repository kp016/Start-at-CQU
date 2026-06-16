'use client';

import { TrendingUp, ArrowRight } from 'lucide-react';
import type { AppEvent, PaySettings } from '@/types';
import { getWeekSummary, getMonthSummary } from '@/lib/pay-calculator';
import { formatCurrency, formatHours } from '@/lib/utils';

interface Props {
  events: AppEvent[];
  settings: PaySettings;
  onUpdateSettings: (patch: Partial<PaySettings>) => void;
  onOpenEarnings: () => void;
}

export default function PaySummary({ events, onOpenEarnings }: Props) {
  const week = getWeekSummary(events);
  const month = getMonthSummary(events);

  return (
    <div className="rounded-2xl border border-sand-200 dark:border-[#34302a] bg-white dark:bg-white/5 shadow-warm overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900 dark:text-cream-100">
          <TrendingUp className="h-4 w-4 text-emerald-500" /> Pay summary
        </h3>
        <button onClick={onOpenEarnings} className="flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:gap-1.5 transition-all">
          Details <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-3">
          <p className="text-xs font-medium text-white/80">This week</p>
          <p className="text-2xl font-bold text-white mt-0.5">{formatCurrency(week.gross)}</p>
          <p className="text-xs text-white/75 mt-0.5">{formatHours(week.hours)} · {week.shiftCount} shift{week.shiftCount === 1 ? '' : 's'}</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 p-3">
          <p className="text-xs font-medium text-white/80">This month</p>
          <p className="text-2xl font-bold text-white mt-0.5">{formatCurrency(month.gross)}</p>
          <p className="text-xs text-white/75 mt-0.5">{formatHours(month.hours)} · {month.shiftCount} shift{month.shiftCount === 1 ? '' : 's'}</p>
        </div>
      </div>
    </div>
  );
}
