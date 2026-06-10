import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { loadCloudData, saveCloudData, DEFAULT_APP_DATA } from '@/lib/drive-storage';

async function getToken() {
  const session = await getServerSession(authOptions);
  return session?.accessToken;
}

export async function GET() {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await loadCloudData(token);
  return NextResponse.json({ data: data ?? DEFAULT_APP_DATA });
}

export async function PUT(req: NextRequest) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  await saveCloudData(token, { ...DEFAULT_APP_DATA, ...body, version: 2 });
  return NextResponse.json({ ok: true });
}
