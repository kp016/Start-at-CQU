import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { format } from 'date-fns';

const SYSTEM_PROMPT = `You parse natural-language text into calendar entries for a student's shift-tracking app.
Today's date is {{TODAY}} ({{WEEKDAY}}). Timezone: Australia/Brisbane.

Return ONLY a JSON array (no markdown, no prose). Each element:
{
  "title": string,            // workplace name for shifts, subject for uni, task text for todos
  "date": "YYYY-MM-DD",       // resolve relative dates ("tomorrow", "next friday") against today
  "startTime": "HH:mm" | null, // 24h. null for all-day todos
  "endTime": "HH:mm" | null,
  "hourlyRate": number | null, // only if pay is mentioned
  "location": string | null,
  "type": "shift" | "uni" | "todo" | "timeblock",
  "recurringWeekly": boolean,  // true for things like "every tuesday"
  "notes": string | null
}

Rules:
- "shift" = paid work. "uni" = classes/lectures/tutorials. "todo" = tasks/reminders. "timeblock" = study/gym/personal time.
- A bare day name ("Monday") means the NEXT occurrence of that day.
- "arvo" = afternoon (default 13:00), "til close" with no time = 22:00 unless stated.
- Multiple entries in one message → multiple array elements.
- If you truly cannot parse anything, return [].`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured' },
      { status: 500 }
    );
  }

  const { text } = await req.json();
  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  const now = new Date();
  const system = SYSTEM_PROMPT.replace('{{TODAY}}', format(now, 'yyyy-MM-dd')).replace(
    '{{WEEKDAY}}',
    format(now, 'EEEE')
  );

  try {
    const anthropic = new Anthropic();
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: text }],
    });

    const raw = msg.content[0].type === 'text' ? msg.content[0].text : '[]';
    const jsonStart = raw.indexOf('[');
    const jsonEnd = raw.lastIndexOf(']');
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));

    return NextResponse.json({ entries: parsed });
  } catch (e) {
    return NextResponse.json(
      { error: `Could not parse: ${(e as Error).message}` },
      { status: 502 }
    );
  }
}
