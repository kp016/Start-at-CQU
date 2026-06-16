'use client';

import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { CalendarDays, Sun, Moon, LogOut, Wallet, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { View } from '@/components/Sidebar';

const MOBILE_NAV: { view: View; icon: typeof CalendarDays; label: string }[] = [
  { view: 'calendar', icon: CalendarDays, label: 'Calendar' },
  { view: 'earnings', icon: Wallet, label: 'Earnings' },
  { view: 'jobs', icon: Briefcase, label: 'Jobs' },
];

export default function Navbar({
  activeView,
  onNavigate,
}: {
  activeView: View;
  onNavigate: (v: View) => void;
}) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  return (
    <>
      {/* Top bar — mobile */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-sand-200 dark:border-[#34302a] bg-cream-50/90 dark:bg-[#211d18]/90 backdrop-blur px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 p-1.5">
            <CalendarDays className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight text-ink-900 dark:text-cream-100">Shift Tracker</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-xl p-2 text-ink-700 dark:text-cream-100/70 hover:bg-sand-100 dark:hover:bg-white/5 transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {session?.user?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt="" className="h-7 w-7 rounded-full" />
          )}
          <button
            onClick={() => signOut()}
            className="rounded-xl p-2 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Bottom tab bar — mobile */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 flex border-t border-sand-200 dark:border-[#34302a] bg-cream-50/95 dark:bg-[#211d18]/95 backdrop-blur">
        {MOBILE_NAV.map(({ view, icon: Icon, label }) => {
          const active = activeView === view;
          return (
            <button
              key={view}
              onClick={() => onNavigate(view)}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-semibold transition-colors',
                active ? 'text-violet-600 dark:text-violet-400' : 'text-ink-700/60 dark:text-cream-100/50'
              )}
            >
              <Icon size={20} />
              {label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
