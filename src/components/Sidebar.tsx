'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import {
  CalendarDays, Wallet, Briefcase, Sun, Moon, LogOut,
  ChevronRight, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import type { AppEvent } from '@/types';
import { getWeekSummary } from '@/lib/pay-calculator';
import { format, parseISO } from 'date-fns';

const NAV = [
  { href: '/', icon: CalendarDays, label: 'Calendar' },
  { href: '/earnings', icon: Wallet, label: 'Earnings' },
  { href: '/jobs', icon: Briefcase, label: 'Job Hunt' },
];

interface Props {
  events: AppEvent[];
  nextShift?: AppEvent | null;
}

export default function Sidebar({ events, nextShift }: Props) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  const week = getWeekSummary(events);

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-sidebar text-slate-300 min-h-screen">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5">
        <div className="rounded-xl bg-indigo-600 p-1.5">
          <CalendarDays className="h-5 w-5 text-white" />
        </div>
        <span className="font-bold text-white text-base tracking-tight">Shift Tracker</span>
      </div>

      {/* Navigation */}
      <nav className="px-3 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" size={18} />
              {label}
              {active && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 my-4 border-t border-white/8" />

      {/* Quick stats */}
      <div className="px-4 space-y-2.5">
        <div className="rounded-xl bg-white/5 p-3.5">
          <p className="text-xs text-slate-500 mb-0.5">This week</p>
          <p className="text-2xl font-bold text-white">{formatCurrency(week.gross)}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {week.hours.toFixed(1)}h · {week.shiftCount} shift{week.shiftCount === 1 ? '' : 's'}
          </p>
        </div>

        {nextShift && (
          <div className="rounded-xl bg-indigo-900/40 border border-indigo-700/30 p-3.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              <p className="text-xs text-indigo-400 font-medium">Next shift</p>
            </div>
            <p className="text-sm font-semibold text-white truncate">{nextShift.title}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {format(parseISO(nextShift.start), 'EEE d MMM · h:mmaaa')}
            </p>
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom bar */}
      <div className="px-3 pb-5 space-y-1">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-all"
        >
          {theme === 'dark'
            ? <Sun className="h-4 w-4" />
            : <Moon className="h-4 w-4" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>

        {session?.user && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 group transition-all">
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" className="h-7 w-7 rounded-full ring-2 ring-white/10" />
            ) : (
              <div className="h-7 w-7 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-bold text-white">
                {session.user.name?.[0] ?? '?'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white truncate">{session.user.name}</p>
              <p className="text-xs text-slate-500 truncate">{session.user.email}</p>
            </div>
            <button
              onClick={() => signOut()}
              title="Sign out"
              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-white/10 transition-all"
            >
              <LogOut className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
