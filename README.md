# Shift Tracker 📅💰

A personal shift-tracking calendar app built for life at CQU — track work shifts and pay, uni classes, to-dos and time blocks, all synced straight into your **Google Calendar** (so reminders reach your phone automatically).

## Features

- **🗓 Calendar view** — week/month/day views with drag-to-reschedule and drag-to-create
- **✨ Smart text input** — just type *"shift friday 5-11pm at the pub $28/hr"* and AI (Claude) parses it into a calendar entry. Works for uni classes, todos and time blocks too
- **💵 Pay tracking** — hourly rate per shift, weekly/monthly totals, optional after-tax estimate, CSV export
- **🔔 Shift reminders** — browser notification 1 hour before each shift (plus Google Calendar's own phone notifications)
- **🎓 Uni classes** — add recurring weekly lectures/tutorials
- **✅ To-dos** — quick-add task list synced as all-day calendar events
- **⏰ Time blocking** — block out study, gym, and personal time
- **🍺☕ Job Hunt tab** — ready-to-copy Facebook post templates, an application tracker, and optional twice-daily (9am & 5pm) reminders to post in local job groups

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Google OAuth credentials** (for Calendar sync)
   - Go to [Google Cloud Console](https://console.cloud.google.com) → create a project
   - Enable the **Google Calendar API**
   - Configure the OAuth consent screen (External) and add your email as a test user
   - Create **OAuth client ID → Web application** with redirect URI:
     `http://localhost:3000/api/auth/callback/google`

3. **Anthropic API key** (for the smart text parser)
   - Get one at [console.anthropic.com](https://console.anthropic.com)

4. **Environment variables**
   ```bash
   cp .env.example .env.local
   # fill in GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET, ANTHROPIC_API_KEY
   ```

5. **Run it**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) and sign in with Google.

## How it stores data

Everything you add lives in **your own Google Calendar** (tagged with a private `appType` property so the app only shows its own events). Pay settings and the job application tracker live in browser localStorage. There is no app database — your data stays yours.

## Tech stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · FullCalendar · NextAuth (Google) · Google Calendar API · Claude API (claude-haiku-4-5) · date-fns
