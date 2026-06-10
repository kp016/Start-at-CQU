'use client';

import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { CalendarDays, Sun, Moon, LogOut, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const MOBILE_NAV = [
  { href: '/', icon: CalendarDays, label: 'Calendar' },
  { href: '/earnings', icon: CalendarDays, label: 'Earnings' },
  { href: '/jobs', icon: Briefcase, label: 'Jobs' },
];

export default function Navbar() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  return (
    <>
      {/* Top bar — mobile only */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-indigo-600 p-1">
            <CalendarDays className="h-4.5 w-4.5 text-white" size={18} />
          </div>
          <span className="font-bold text-base tracking-tight">Shift Tracker</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-xl p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {session?.user?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt="" className="h-7 w-7 rounded-full" />
          )}
          <button
            onClick={() => signOut()}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Bottom tab bar — mobile only */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 flex border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
        {MOBILE_NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors',
                active
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400'
              )}
            >
              <Icon size={20} className={active ? 'text-indigo-600 dark:text-indigo-400' : ''} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
