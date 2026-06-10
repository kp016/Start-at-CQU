import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateEvent, deleteEvent } from '@/lib/google-calendar';

async function getToken() {
  const session = await getServerSession(authOptions);
  return session?.accessToken;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const event = await updateEvent(token, params.id, body);
    return NextResponse.json({ event });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await deleteEvent(token, params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
