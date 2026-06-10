'use client';

import { useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { format } from 'date-fns';
import { CalendarDays, Loader2 } from 'lucide-react';
import type { AppEvent } from '@/types';
import { EVENT_COLORS, EVENT_LABELS } from '@/types';
import { useEvents } from '@/hooks/useEvents';
import Navbar from '@/components/Navbar';
import CalendarView from '@/components/CalendarView';
import SmartInput from '@/components/SmartInput';
import EventForm from '@/components/EventForm';
import EventCard from '@/components/EventCard';
import PaySummary from '@/components/PaySummary';
import TodoSidebar from '@/components/TodoSidebar';
import JobHuntPanel from '@/components/JobHuntPanel';
import NotificationManager from '@/components/NotificationManager';

const JOB_REMINDERS_KEY = 'shifttracker_job_reminders_enabled';

export default function Home() {
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-10 w-10 text-blue-600" />
          <h1 className="text-3xl font-bold">Shift Tracker</h1>
        </div>
        <p className="max-w-md text-center text-slate-600">
          Track your shifts, pay, uni classes and to-dos — everything syncs straight into your
          Google Calendar so reminders reach your phone too.
        </p>
        <button
          onClick={() => signIn('google')}
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return <Dashboard />;
}

function Dashboard() {
  const { events, loading, error, addEvent, updateEvent, deleteEvent } = useEvents();
  const [selected, setSelected] = useState<AppEvent | null>(null);
  const [formInitial, setFormInitial] = useState<Partial<AppEvent> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showJobHunt, setShowJobHunt] = useState(false);
  const [jobReminders, setJobReminders] = useState(false);

  useEffect(() => {
    setJobReminders(localStorage.getItem(JOB_REMINDERS_KEY) === 'true');
  }, []);

  const toggleJobReminders = (enabled: boolean) => {
    setJobReminders(enabled);
    localStorage.setItem(JOB_REMINDERS_KEY, String(enabled));
    if (enabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const handleSelectRange = (start: Date, end: Date, allDay: boolean) => {
    setFormInitial({
      start: format(start, "yyyy-MM-dd'T'HH:mm:ss"),
      end: format(end, "yyyy-MM-dd'T'HH:mm:ss"),
      allDay,
      type: 'shift',
    });
    setShowForm(true);
  };

  const handleEventDrop = async (id: string, start: string, end: string) => {
    const event = events.find((e) => e.id === id);
    if (event) await updateEvent(id, { ...event, start, end });
  };

  const handleSave = async (event: Partial<AppEvent>) => {
    if (event.id) {
      await updateEvent(event.id, event);
    } else {
      await addEvent(event);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar onToggleJobHunt={() => setShowJobHunt(true)} />
      <NotificationManager events={events} jobHuntEnabled={jobReminders} />

      <main className="mx-auto max-w-7xl space-y-4 p-4">
        <SmartInput onAdd={addEvent} />

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            {loading ? (
              <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <CalendarView
                events={events}
                onEventClick={setSelected}
                onEventDrop={handleEventDrop}
                onSelectRange={handleSelectRange}
              />
            )}
            <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-100 pt-3">
              {(Object.keys(EVENT_LABELS) as Array<keyof typeof EVENT_LABELS>).map((t) => (
                <span key={t} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: EVENT_COLORS[t] }}
                  />
                  {EVENT_LABELS[t]}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <PaySummary events={events} />
            <TodoSidebar
              events={events}
              onAdd={addEvent}
              onToggle={(id, e) => updateEvent(id, e)}
            />
            <button
              onClick={() => {
                setFormInitial(null);
                setShowForm(true);
              }}
              className="w-full rounded-xl border-2 border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 hover:border-blue-400 hover:text-blue-600"
            >
              + Add manually
            </button>
          </div>
        </div>
      </main>

      {showForm && (
        <EventForm
          initial={formInitial}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setFormInitial(null);
          }}
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
          onClose={() => setShowJobHunt(false)}
          remindersEnabled={jobReminders}
          onToggleReminders={toggleJobReminders}
        />
      )}
    </div>
  );
}
