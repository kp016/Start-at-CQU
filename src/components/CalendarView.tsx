'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, EventDropArg, DateSelectArg } from '@fullcalendar/core';
import type { AppEvent } from '@/types';
import { EVENT_COLORS } from '@/types';
import { useTheme } from 'next-themes';

interface Props {
  events: AppEvent[];
  onEventClick: (event: AppEvent) => void;
  onEventDrop: (id: string, start: string, end: string) => void;
  onSelectRange: (start: Date, end: Date, allDay: boolean) => void;
}

export default function CalendarView({ events, onEventClick, onEventDrop, onSelectRange }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const fcEvents = events.map((e) => ({
    id: e.id,
    title: e.type === 'todo' ? (e.completed ? `✓ ${e.title}` : `· ${e.title}`) : e.title,
    start: e.start,
    end: e.end,
    allDay: e.allDay,
    backgroundColor: EVENT_COLORS[e.type],
    borderColor: 'transparent',
    textColor: '#fff',
    opacity: e.type === 'todo' && e.completed ? '0.5' : '1',
    extendedProps: { appEvent: e },
  }));

  return (
    <div
      className="fc-wrapper"
      style={
        isDark
          ? ({
              '--fc-border-color': '#1e293b',
              '--fc-today-bg-color': '#1e293b',
              '--fc-neutral-bg-color': '#0f172a',
              '--fc-list-event-hover-bg-color': '#1e293b',
              '--fc-page-bg-color': 'transparent',
              '--fc-neutral-text-color': '#94a3b8',
              '--fc-event-text-color': '#fff',
            } as React.CSSProperties)
          : undefined
      }
    >
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridDay,timeGridWeek,dayGridMonth',
        }}
        events={fcEvents}
        editable
        selectable
        selectMirror
        eventClick={(arg: EventClickArg) =>
          onEventClick(arg.event.extendedProps.appEvent as AppEvent)
        }
        eventDrop={(arg: EventDropArg) => {
          if (!arg.event.start || !arg.event.end) { arg.revert(); return; }
          onEventDrop(arg.event.id, arg.event.start.toISOString(), arg.event.end.toISOString());
        }}
        select={(arg: DateSelectArg) => onSelectRange(arg.start, arg.end, arg.allDay)}
        height="auto"
        nowIndicator
        firstDay={1}
        scrollTime="07:30:00"
        slotMinTime="05:00:00"
        slotMaxTime="24:00:00"
        allDaySlot
        allDayText="all-day"
        dayMaxEventRows={3}
        eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
        slotLabelFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
      />
    </div>
  );
}
