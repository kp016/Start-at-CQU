import type { PaySettings, JobApplication } from '@/types';

const PAY_SETTINGS_KEY = 'shifttracker_pay_settings';
const JOB_APPS_KEY = 'shifttracker_job_applications';
const NOTIFIED_KEY = 'shifttracker_notified_events';
const JOB_REMINDER_KEY = 'shifttracker_job_reminder_last';

const DEFAULT_PAY_SETTINGS: PaySettings = {
  defaultHourlyRate: 25,
  taxRate: 0,
  currency: 'AUD',
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getPaySettings(): PaySettings {
  return { ...DEFAULT_PAY_SETTINGS, ...read<Partial<PaySettings>>(PAY_SETTINGS_KEY, {}) };
}

export function savePaySettings(settings: PaySettings) {
  write(PAY_SETTINGS_KEY, settings);
}

export function getJobApplications(): JobApplication[] {
  return read<JobApplication[]>(JOB_APPS_KEY, []);
}

export function saveJobApplications(apps: JobApplication[]) {
  write(JOB_APPS_KEY, apps);
}

export function wasNotified(eventId: string): boolean {
  return read<string[]>(NOTIFIED_KEY, []).includes(eventId);
}

export function markNotified(eventId: string) {
  const ids = read<string[]>(NOTIFIED_KEY, []);
  if (!ids.includes(eventId)) {
    // keep the list from growing forever
    write(NOTIFIED_KEY, [...ids.slice(-200), eventId]);
  }
}

export function getLastJobReminder(): number {
  return read<number>(JOB_REMINDER_KEY, 0);
}

export function setLastJobReminder(ts: number) {
  write(JOB_REMINDER_KEY, ts);
}
