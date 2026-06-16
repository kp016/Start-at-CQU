'use client';

import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import {
  CalendarDays, Wallet, Briefcase, Sun, Moon, LogOut, Clock, Sparkles,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import type { AppEvent } from '@/types';
import { getWeekSummary } from '@/lib/pay-calculator';
import { format, parseISO } from 'date-fns';

export type View = 'calendar' | 'earnings' | 'jobs';

const NAV: { view: View; icon: typeof CalendarDays; label: string; tint: string }[] = [
  { view: 'calendar', icon: CalendarDays, label: 'Calendar', tint: 'from-violet-500 to-indigo-500' },
  { view: 'earnings', icon: Wallet, label: 'Earnings', tint: 'from-emerald-500 to-teal-500' },
  { view: 'jobs', icon: Briefcase, label: 'Job Hunt', tint: 'from-rose-500 to-orange-500' },
];

interface Props {
  events: AppEvent[];
  activeView: View;
  onNavigate: (v: View) => void;
  nextShift?: AppEvent | null;
}

export default function Sidebar({ events, activeView, onNavigate, nextShift }: Props) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const week = getWeekSummary(events);

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-cream-50 dark:bg-[#211d18] border-r border-sand-200 dark:border-[#34302a] min-h-screen">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5">
        <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 p-2 shadow-lg shadow-violet-500/30">
          <CalendarDays className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-ink-900 dark:text-cream-100 text-base tracking-tight block leading-none">Shift Tracker</span>
          <span className="text-[11px] text-ink-700/60 dark:text-cream-100/40">your uni + work hub</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 space-y-1 mt-2">
        {NAV.map(({ view, icon: Icon, label, tint }) => {
          const active = activeView === view;
          return (
            <button
              key={view}
              onClick={() => onNavigate(view)}
              className={cn(
                'flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
                active
                  ? `bg-gradient-to-r ${tint} text-white shadow-md`
                  : 'text-ink-700 dark:text-cream-100/70 hover:bg-sand-100 dark:hover:bg-white/5'
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="mx-4 my-4 border-t border-sand-200 dark:border-[#34302a]" />

      {/* Stats */}
      <div className="px-4 space-y-3">
        <button
          onClick={() => onNavigate('earnings')}
          className="w-full text-left rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-4 shadow-warm hover:shadow-warm-lg transition-all hover:-translate-y-0.5"
        >
          <p className="text-xs text-white/80 mb-0.5 flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> This week
          </p>
          <p className="text-2xl font-bold text-white">{formatCurrency(week.gross)}</p>
          <p className="text-xs text-white/75 mt-0.5">
            {week.hours.toFixed(1)}h · {week.shiftCount} shift{week.shiftCount === 1 ? '' : 's'}
          </p>
        </button>

        {nextShift && (
          <div className="rounded-2xl bg-white dark:bg-white/5 border border-sand-200 dark:border-[#34302a] p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="h-3.5 w-3.5 text-violet-500" />
              <p className="text-xs text-violet-500 font-semibold">Next shift</p>
            </div>
            <p className="text-sm font-bold text-ink-900 dark:text-cream-100 truncate">{nextShift.title}</p>
            <p className="text-xs text-ink-700/70 dark:text-cream-100/50 mt-0.5">
              {format(parseISO(nextShift.start), 'EEE d MMM · h:mmaaa')}
            </p>
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* Bottom */}
      <div className="px-3 pb-5 space-y-1">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-700 dark:text-cream-100/70 hover:bg-sand-100 dark:hover:bg-white/5 transition-all"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>

        {session?.user && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sand-100 dark:hover:bg-white/5 group transition-all">
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" className="h-8 w-8 rounded-full ring-2 ring-sand-300" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                {session.user.name?.[0] ?? '?'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-ink-900 dark:text-cream-100 truncate">{session.user.name}</p>
              <p className="text-[11px] text-ink-700/60 dark:text-cream-100/40 truncate">{session.user.email}</p>
            </div>
            <button
              onClick={() => signOut()}
              title="Sign out"
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all"
            >
              <LogOut className="h-3.5 w-3.5 text-rose-500" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
