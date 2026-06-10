'use client';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { format, parseISO, isAfter } from 'date-fns';
import {
  CalendarDays, Loader2, Sparkles, Wallet, ListTodo,
  Briefcase, Bell, Plus,
} from 'lucide-react';
import type { AppEvent } from '@/types';
import { EVENT_COLORS, EVENT_LABELS } from '@/types';
import { useEvents } from '@/hooks/useEvents';
import { useAppData } from '@/hooks/useAppData';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import CalendarView from '@/components/CalendarView';
import SmartInput from '@/components/SmartInput';
import EventForm from '@/components/EventForm';
import EventCard from '@/components/EventCard';
import PaySummary from '@/components/PaySummary';
import TodoSidebar from '@/components/TodoSidebar';
import JobHuntPanel from '@/components/JobHuntPanel';
import NotificationManager from '@/components/NotificationManager';

export default function Home() {
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (status === 'unauthenticated') return <SignInPage />;

  return <Dashboard />;
}

/* ─── Sign-in page ─────────────────────────────────────────────────────────── */
function SignInPage() {
  const FEATURES = [
    {
      icon: Sparkles,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50 dark:bg-indigo-950/50',
      title: 'AI smart input',
      desc: 'Just type "shift friday 5–9pm at the pub $28/hr" and it\'s on your calendar.',
    },
    {
      icon: Wallet,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      title: 'Pay tracking',
      desc: 'Hourly totals, weekly and monthly summaries, CSV export.',
    },
    {
      icon: CalendarDays,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/50',
      title: 'Google Calendar sync',
      desc: 'Everything lives in your real Google Calendar — reminders on your phone automatically.',
    },
    {
      icon: ListTodo,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      title: 'Uni + to-dos',
      desc: 'Add recurring lectures, time blocks, and quick to-dos alongside your shifts.',
    },
    {
      icon: Briefcase,
      color: 'text-rose-500',
      bg: 'bg-rose-50 dark:bg-rose-950/50',
      title: 'Job hunt tracker',
      desc: 'Ready-to-copy Facebook post templates and an application tracker.',
    },
    {
      icon: Bell,
      color: 'text-violet-500',
      bg: 'bg-violet-50 dark:bg-violet-950/50',
      title: 'Shift reminders',
      desc: 'Browser notification 1 hour before every shift so you\'re never late.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col items-center justify-center px-4 py-16">
      {/* Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
      </div>

      {/* Hero */}
      <div className="relative z-10 text-center mb-10">
        <div className="inline-flex items-center gap-3 mb-6">
          <div className="rounded-2xl bg-indigo-600 p-3 shadow-lg shadow-indigo-900/50">
            <CalendarDays className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Shift Tracker</h1>
        </div>
        <p className="text-lg text-slate-400 max-w-md mx-auto leading-relaxed">
          Your personal calendar for shifts, pay, uni classes and to-dos — synced to Google Calendar.
        </p>
      </div>

      {/* Sign-in card */}
      <div className="relative z-10 w-full max-w-sm mb-10">
        <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm p-8 shadow-2xl">
          <button
            onClick={() => signIn('google')}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-3.5 px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          <p className="text-center text-xs text-slate-500 mt-4">
            Needs calendar access to sync your events
          </p>
        </div>
      </div>

      {/* Feature grid */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl">
        {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
          <div
            key={title}
            className="rounded-2xl bg-white/4 border border-white/8 p-4 hover:bg-white/6 transition-colors"
          >
            <div className={`rounded-xl ${bg} w-fit p-2 mb-2.5`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="text-sm font-semibold text-white mb-1">{title}</p>
            <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Dashboard ─────────────────────────────────────────────────────────────── */
function Dashboard() {
  const { events, loading, error, addEvent, updateEvent, deleteEvent } = useEvents();
  const appData = useAppData();

  const [selected, setSelected] = useState<AppEvent | null>(null);
  const [formInitial, setFormInitial] = useState<Partial<AppEvent> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showJobHunt, setShowJobHunt] = useState(false);

  const nextShift = events
    .filter((e) => e.type === 'shift' && isAfter(parseISO(e.start), new Date()))
    .sort((a, b) => a.start.localeCompare(b.start))[0] ?? null;

  const handleSelectRange = (start: Date, end: Date, allDay: boolean) => {
    setFormInitial({
      start: format(start, "yyyy-MM-dd'T'HH:mm:ss"),
      end: format(end, "yyyy-MM-dd'T'HH:mm:ss"),
      allDay,
      type: 'shift',
    });
    setShowForm(true);
  };

  const handleSave = async (event: Partial<AppEvent>) => {
    if (event.id) await updateEvent(event.id, event);
    else await addEvent(event);
  };

  const toggleJobReminders = (enabled: boolean) => {
    appData.setJobReminders(enabled);
    if (enabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar events={events} nextShift={nextShift} />

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <Navbar />
        <NotificationManager events={events} jobHuntEnabled={appData.jobRemindersEnabled} />

        <main className="flex-1 p-4 lg:p-5 pb-20 lg:pb-5 space-y-4">
          {/* Smart input */}
          <SmartInput
            defaultRate={appData.paySettings.defaultHourlyRate}
            onAdd={addEvent}
          />

          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
            {/* Calendar panel */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-sm p-4 min-h-[500px]">
              {loading ? (
                <div className="flex h-96 items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
                </div>
              ) : (
                <CalendarView
                  events={events}
                  onEventClick={setSelected}
                  onEventDrop={(id, start, end) => {
                    const ev = events.find((e) => e.id === id);
                    if (ev) updateEvent(id, { ...ev, start, end });
                  }}
                  onSelectRange={handleSelectRange}
                />
              )}
              {/* Legend */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/40 flex flex-wrap gap-3">
                {(Object.entries(EVENT_LABELS) as [keyof typeof EVENT_LABELS, string][]).map(([t, label]) => (
                  <span key={t} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-500">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: EVENT_COLORS[t] }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Right panel */}
            <div className="space-y-4">
              <PaySummary
                events={events}
                settings={appData.paySettings}
                onUpdateSettings={appData.setPaySettings}
              />

              <TodoSidebar
                events={events}
                onAdd={addEvent}
                onToggle={(id, e) => updateEvent(id, e)}
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setFormInitial(null); setShowForm(true); }}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 py-3 text-sm font-medium text-slate-500 dark:text-slate-500 hover:border-indigo-400 hover:text-indigo-600 dark:hover:border-indigo-600 dark:hover:text-indigo-400 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Add manually
                </button>
                <button
                  onClick={() => setShowJobHunt(true)}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 py-3 text-sm font-medium text-slate-500 dark:text-slate-500 hover:border-rose-400 hover:text-rose-600 dark:hover:border-rose-600 dark:hover:text-rose-400 transition-all"
                >
                  <Briefcase className="h-4 w-4" />
                  Job hunt
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      {showForm && (
        <EventForm
          initial={formInitial}
          defaultRate={appData.paySettings.defaultHourlyRate}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setFormInitial(null); }}
        />
      )}

      {selected && (
        <EventCard
          event={selected}
          onClose={() => setSelected(null)}
          onEdit={() => {
            setFormInitial(selected);
            setSelected(null);
            setShowForm(true);
          }}
          onDelete={() => deleteEvent(selected.id)}
        />
      )}

      {showJobHunt && (
        <JobHuntPanel
          applications={appData.jobApplications}
          remindersEnabled={appData.jobRemindersEnabled}
          onUpdateApplications={appData.setJobApplications}
          onToggleReminders={toggleJobReminders}
          onClose={() => setShowJobHunt(false)}
        />
      )}
    </div>
  );
}
