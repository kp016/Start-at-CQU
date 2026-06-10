'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, EventDropArg, DateSelectArg } from '@fullcalendar/core';
import type { AppEvent } from '@/types';
import { EVENT_COLORS } from '@/types';

interface Props {
  events: AppEvent[];
  onEventClick: (event: AppEvent) => void;
  onEventDrop: (id: string, start: string, end: string) => void;
  onSelectRange: (start: Date, end: Date, allDay: boolean) => void;
}

export default function CalendarView({
  events,
  onEventClick,
  onEventDrop,
  onSelectRange,
}: Props) {
  const fcEvents = events.map((e) => ({
    id: e.id,
    title: e.type === 'todo' && e.completed ? `✓ ${e.title}` : e.title,
    start: e.start,
    end: e.end,
    allDay: e.allDay,
    backgroundColor: EVENT_COLORS[e.type],
    textColor: '#fff',
    extendedProps: { appEvent: e },
  }));

  const handleClick = (arg: EventClickArg) => {
    onEventClick(arg.event.extendedProps.appEvent as AppEvent);
  };

  const handleDrop = (arg: EventDropArg) => {
    const { event } = arg;
    if (!event.start || !event.end) {
      arg.revert();
      return;
    }
    onEventDrop(event.id, event.start.toISOString(), event.end.toISOString());
  };

  const handleSelect = (arg: DateSelectArg) => {
    onSelectRange(arg.start, arg.end, arg.allDay);
  };

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'timeGridWeek,dayGridMonth,timeGridDay',
      }}
      events={fcEvents}
      editable
      selectable
      selectMirror
      eventClick={handleClick}
      eventDrop={handleDrop}
      select={handleSelect}
      height="auto"
      nowIndicator
      firstDay={1}
      scrollTime="08:00:00"
      slotMinTime="05:00:00"
      slotMaxTime="24:00:00"
      allDaySlot
      allDayText="all-day"
      dayMaxEventRows={4}
    />
  );
}
