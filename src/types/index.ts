export type AppEventType = 'shift' | 'uni' | 'todo' | 'timeblock';

export interface AppEvent {
  id: string;
  title: string;
  start: string; // ISO string
  end: string; // ISO string
  allDay: boolean;
  type: AppEventType;
  hourlyRate?: number;
  location?: string;
  notes?: string;
  completed?: boolean; // todos only
  recurrence?: string[]; // RRULE strings, uni classes
}

export interface ParsedEvent {
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  hourlyRate?: number;
  location?: string;
  type: AppEventType;
  recurringWeekly?: boolean;
  notes?: string;
}

export interface PaySettings {
  defaultHourlyRate: number;
  taxRate: number; // 0–1, rough estimate
  currency: string;
}

export interface JobApplication {
  id: string;
  business: string;
  role: string;
  dateApplied: string; // YYYY-MM-DD
  method: string; // 'in person' | 'online' | 'facebook' | etc.
  status: 'applied' | 'followed-up' | 'interview' | 'offer' | 'rejected';
  notes?: string;
}

export const EVENT_COLORS: Record<AppEventType, string> = {
  shift: '#3B82F6',
  uni: '#8B5CF6',
  timeblock: '#10B981',
  todo: '#F59E0B',
};

export const EVENT_LABELS: Record<AppEventType, string> = {
  shift: 'Work shift',
  uni: 'Uni class',
  timeblock: 'Time block',
  todo: 'To-do',
};
