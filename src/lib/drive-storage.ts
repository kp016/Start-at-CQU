import type { PaySettings, JobApplication } from '@/types';

const DRIVE_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
const FILE_NAME = 'shifttracker-settings.json';

export interface CloudAppData {
  version: 2;
  paySettings: PaySettings;
  jobApplications: JobApplication[];
  jobRemindersEnabled: boolean;
}

export const DEFAULT_APP_DATA: CloudAppData = {
  version: 2,
  paySettings: { defaultHourlyRate: 25, taxRate: 0, currency: 'AUD' },
  jobApplications: [],
  jobRemindersEnabled: false,
};

async function gfetch(token: string, url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Drive API ${res.status}: ${text}`);
  }
  return res.status === 204 ? null : res.json();
}

async function findFile(token: string): Promise<string | null> {
  const q = encodeURIComponent(`name = '${FILE_NAME}' and trashed = false`);
  const data = await gfetch(
    token,
    `${DRIVE_BASE}/files?spaces=appDataFolder&q=${q}&fields=files(id)&pageSize=1`
  );
  return data?.files?.[0]?.id ?? null;
}

export async function loadCloudData(token: string): Promise<CloudAppData | null> {
  try {
    const id = await findFile(token);
    if (!id) return null;
    const res = await fetch(`${DRIVE_BASE}/files/${id}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.version === 2 ? (data as CloudAppData) : null;
  } catch {
    return null;
  }
}

export async function saveCloudData(token: string, data: CloudAppData): Promise<void> {
  const body = JSON.stringify(data);
  const existingId = await findFile(token);

  if (existingId) {
    await gfetch(token, `${UPLOAD_BASE}/files/${existingId}?uploadType=media`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  } else {
    const meta = JSON.stringify({
      name: FILE_NAME,
      parents: ['appDataFolder'],
    });
    const boundary = 'shifttracker_boundary';
    const multipart =
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n${meta}\r\n` +
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n` +
      `--${boundary}--`;

    await gfetch(
      token,
      `${UPLOAD_BASE}/files?uploadType=multipart&fields=id`,
      {
        method: 'POST',
        headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
        body: multipart,
      }
    );
  }
}
