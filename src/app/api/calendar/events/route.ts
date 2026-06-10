import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listEvents, createEvent } from '@/lib/google-calendar';

async function getToken() {
  const session = await getServerSession(authOptions);
  return session?.accessToken;
}

export async function GET(req: NextRequest) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const timeMin = searchParams.get('timeMin');
  const timeMax = searchParams.get('timeMax');
  if (!timeMin || !timeMax) {
    return NextResponse.json({ error: 'timeMin and timeMax required' }, { status: 400 });
  }

  try {
    const events = await listEvents(token, timeMin, timeMax);
    return NextResponse.json({ events });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const event = await createEvent(token, body);
    return NextResponse.json({ event }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
