'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CloudAppData } from '@/lib/drive-storage';
import { DEFAULT_APP_DATA } from '@/lib/drive-storage';
import type { PaySettings, JobApplication } from '@/types';

export function useAppData() {
  const [data, setData] = useState<CloudAppData>(DEFAULT_APP_DATA);
  const [syncing, setSyncing] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from Drive on mount
  useEffect(() => {
    fetch('/api/app-data')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.data) setData(json.data);
      })
      .finally(() => setSyncing(false));
  }, []);

  // Debounced save to Drive + localStorage fallback
  const persist = useCallback((next: CloudAppData) => {
    setData(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch('/api/app-data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      }).catch(() => {
        // silently persist to localStorage as fallback
        try {
          localStorage.setItem('shifttracker_cloud_backup', JSON.stringify(next));
        } catch { /* ignore */ }
      });
    }, 800);
  }, []);

  const setPaySettings = useCallback(
    (patch: Partial<PaySettings>) =>
      persist({ ...data, paySettings: { ...data.paySettings, ...patch } }),
    [data, persist]
  );

  const setJobApplications = useCallback(
    (apps: JobApplication[]) => persist({ ...data, jobApplications: apps }),
    [data, persist]
  );

  const setJobReminders = useCallback(
    (enabled: boolean) => persist({ ...data, jobRemindersEnabled: enabled }),
    [data, persist]
  );

  return {
    paySettings: data.paySettings,
    jobApplications: data.jobApplications,
    jobRemindersEnabled: data.jobRemindersEnabled,
    syncing,
    setPaySettings,
    setJobApplications,
    setJobReminders,
  };
}
