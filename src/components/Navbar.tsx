'use client';

import { useSession, signOut } from 'next-auth/react';
import { CalendarDays, LogOut, Briefcase } from 'lucide-react';

export default function Navbar({
  onToggleJobHunt,
}: {
  onToggleJobHunt: () => void;
}) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5 shadow-sm">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-6 w-6 text-blue-600" />
        <h1 className="text-lg font-semibold">Shift Tracker</h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleJobHunt}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Briefcase className="h-4 w-4" />
          Job Hunt
        </button>
        {session?.user && (
          <>
            {session.user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={session.user.name ?? 'profile'}
                className="h-8 w-8 rounded-full"
              />
            )}
            <button
              onClick={() => signOut()}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
