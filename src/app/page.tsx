'use client';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { format, parseISO, isAfter } from 'date-fns';
import {
  CalendarDays, Loader2, Sparkles, Wallet, ListTodo, Briefcase, Bell, Plus,
} from 'lucide-react';
import type { AppEvent } from '@/types';
import { EVENT_COLORS, EVENT_LABELS } from '@/types';
import { useEvents } from '@/hooks/useEvents';
import { useAppData } from '@/hooks/useAppData';
import Sidebar, { type View } from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import CalendarView from '@/components/CalendarView';
import SmartInput from '@/components/SmartInput';
import EventForm from '@/components/EventForm';
import EventCard from '@/components/EventCard';
import PaySummary from '@/components/PaySummary';
import TodoSidebar from '@/components/TodoSidebar';
import EarningsView from '@/components/EarningsView';
import JobHuntView from '@/components/JobHuntView';
import NotificationManager from '@/components/NotificationManager';

export default function Home() {
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }
  if (status === 'unauthenticated') return <SignInPage />;
  return <Dashboard />;
}

/* ─── Sign-in ────────────────────────────────────────────────────────────── */
function SignInPage() {
  const FEATURES = [
    { icon: Sparkles, color: 'text-violet-600', bg: 'bg-violet-100', title: 'AI smart input', desc: 'Type "shift fri 5–9pm $28/hr" — it lands on your calendar.' },
    { icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-100', title: 'Pay tracking', desc: 'Weekly & monthly totals, charts, CSV export.' },
    { icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-100', title: 'Google Calendar sync', desc: 'Phone reminders, automatically.' },
    { icon: ListTodo, color: 'text-amber-600', bg: 'bg-amber-100', title: 'Uni + to-dos', desc: 'Classes, time blocks and tasks together.' },
    { icon: Briefcase, color: 'text-rose-600', bg: 'bg-rose-100', title: 'Job hunt tracker', desc: 'Post templates + application tracker.' },
    { icon: Bell, color: 'text-teal-600', bg: 'bg-teal-100', title: 'Shift reminders', desc: 'A nudge an hour before every shift.' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-gradient-to-br from-cream-100 via-cream-200 to-sand-100">
      <div className="text-center mb-9">
        <div className="inline-flex items-center gap-3 mb-5">
          <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 p-3 shadow-warm-lg animate-floaty">
            <CalendarDays className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-ink-900 tracking-tight">Shift Tracker</h1>
        </div>
        <p className="text-lg text-ink-700/80 max-w-md mx-auto">Shifts, pay, uni & to-dos — all in one warm little hub, synced to Google Calendar.</p>
      </div>

      <div className="w-full max-w-sm mb-9">
        <div className="rounded-3xl bg-white border border-sand-200 p-8 shadow-warm-lg">
          <button
            onClick={() => signIn('google')}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 px-5 text-sm font-semibold text-white hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" opacity=".9"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" opacity=".7"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" opacity=".5"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/></svg>
            Continue with Google
          </button>
          <p className="text-center text-xs text-ink-700/50 mt-4">Syncs to your own Google Calendar</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl">
        {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
          <div key={title} className="rounded-2xl bg-white/70 border border-sand-200 p-4 hover:bg-white hover:-translate-y-0.5 transition-all shadow-warm">
            <div className={`rounded-xl ${bg} w-fit p-2 mb-2.5`}><Icon className={`h-4 w-4 ${color}`} /></div>
            <p className="text-sm font-bold text-ink-900 mb-1">{title}</p>
            <p className="text-xs text-ink-700/70 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Dashboard ──────────────────────────────────────────────────────────── */
function Dashboard() {
  const { events, loading, error, addEvent, updateEvent, deleteEvent } = useEvents();
  const appData = useAppData();

  const [view, setView] = useState<View>('calendar');
  const [selected, setSelected] = useState<AppEvent | null>(null);
  const [formInitial, setFormInitial] = useState<Partial<AppEvent> | null>(null);
  const [showForm, setShowForm] = useState(false);

  const nextShift = events
    .filter((e) => e.type === 'shift' && isAfter(parseISO(e.start), new Date()))
    .sort((a, b) => a.start.localeCompare(b.start))[0] ?? null;

  const handleSelectRange = (start: Date, end: Date, allDay: boolean) => {
    setFormInitial({ start: format(start, "yyyy-MM-dd'T'HH:mm:ss"), end: format(end, "yyyy-MM-dd'T'HH:mm:ss"), allDay, type: 'shift' });
    setShowForm(true);
  };
  const handleSave = async (event: Partial<AppEvent>) => {
    if (event.id) await updateEvent(event.id, event);
    else await addEvent(event);
  };
  const toggleJobReminders = (enabled: boolean) => {
    appData.setJobReminders(enabled);
    if (enabled && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar events={events} activeView={view} onNavigate={setView} nextShift={nextShift} />

      <div className="flex-1 min-w-0 flex flex-col">
        <Navbar activeView={view} onNavigate={setView} />
        <NotificationManager events={events} jobHuntEnabled={appData.jobRemindersEnabled} />

        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 p-3 text-sm text-rose-600 dark:text-rose-400">{error}</div>
          )}

          {view === 'earnings' && (
            <EarningsView events={events} settings={appData.paySettings} onUpdateSettings={appData.setPaySettings} />
          )}

          {view === 'jobs' && (
            <JobHuntView
              applications={appData.jobApplications}
              remindersEnabled={appData.jobRemindersEnabled}
              onUpdateApplications={appData.setJobApplications}
              onToggleReminders={toggleJobReminders}
            />
          )}

          {view === 'calendar' && (
            <div className="space-y-4">
              <SmartInput defaultRate={appData.paySettings.defaultHourlyRate} onAdd={addEvent} />

              <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
                <div className="rounded-2xl border border-sand-200 dark:border-[#34302a] bg-white dark:bg-white/5 shadow-warm p-4 min-h-[520px]">
                  {loading ? (
                    <div className="flex h-96 items-center justify-center">
                      <Loader2 className="h-7 w-7 animate-spin text-violet-500" />
                    </div>
                  ) : (
                    <CalendarView events={events} onEventClick={setSelected}
                      onEventDrop={(id, start, end) => { const ev = events.find((e) => e.id === id); if (ev) updateEvent(id, { ...ev, start, end }); }}
                      onSelectRange={handleSelectRange} />
                  )}
                  <div className="mt-3 pt-3 border-t border-sand-200 dark:border-[#34302a] flex flex-wrap gap-3">
                    {(Object.entries(EVENT_LABELS) as [keyof typeof EVENT_LABELS, string][]).map(([t, label]) => (
                      <span key={t} className="flex items-center gap-1.5 text-xs text-ink-700/60 dark:text-cream-100/40">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: EVENT_COLORS[t] }} />{label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <PaySummary events={events} settings={appData.paySettings} onUpdateSettings={appData.setPaySettings} onOpenEarnings={() => setView('earnings')} />
                  <TodoSidebar events={events} onAdd={addEvent} onToggle={(id, e) => updateEvent(id, e)} />
                  <button
                    onClick={() => { setFormInitial(null); setShowForm(true); }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 py-3 text-sm font-semibold text-white hover:shadow-warm-lg hover:-translate-y-0.5 transition-all"
                  >
                    <Plus className="h-4 w-4" /> Add manually
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {showForm && (
        <EventForm initial={formInitial} defaultRate={appData.paySettings.defaultHourlyRate} onSave={handleSave}
          onClose={() => { setShowForm(false); setFormInitial(null); }} />
      )}
      {selected && (
        <EventCard event={selected} onClose={() => setSelected(null)}
          onEdit={() => { setFormInitial(selected); setSelected(null); setShowForm(true); }}
          onDelete={() => deleteEvent(selected.id)} />
      )}
    </div>
  );
}
