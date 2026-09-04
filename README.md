# AI Study Planner

> A contextual, real-time, AI-powered study companion that turns learning goals into executable daily routines.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-dhaaa--ai--study--planner.vercel.app-1a88ff?style=for-the-badge)](https://dhaaa-ai-study-planner.vercel.app)

**The application is live:** [https://dhaaa-ai-study-planner.vercel.app](https://dhaaa-ai-study-planner.vercel.app)

AI Study Planner combines contextual Gemini-powered schedule generation, Supabase-backed personal data, real-world time awareness, and an Apple-inspired Glassmorphism interface. The experience is designed to reduce the friction between deciding to study and actually starting a focused session.

## Overview

The application gives each authenticated learner a personal workspace where they can:

- Describe a learning goal through an interactive chat.
- Generate or revise a multi-day Pomodoro schedule with natural language.
- Continue the conversation while preserving context from previous messages.
- Handle real-life interruptions, such as meetings or unavailable time windows.
- Browse schedules by day and focus on the current day.
- Follow a real-time timer synchronized with scheduled sessions.
- Receive browser notifications when a scheduled session ends.
- Store schedules and chat history securely in Supabase PostgreSQL.

## Technical Highlights

### Contextual Memory and Bilingual AI

The schedule API accepts `durasi`, `chat_history`, and `input_baru`. Previous conversation messages are passed back to Gemini as conversational context, allowing users to revise an existing plan instead of starting from scratch.

The system prompt instructs Gemini to detect the primary language of the latest user input. The generated `balasan_chat` and schedule activity names follow that language. Indonesian requests receive formal Indonesian, while English requests receive English responses.

Chat history and schedule data are persisted as JSONB in the `user_schedules` table, allowing the dashboard to restore the latest learning state after authentication or a page reload.

### Guardrails and Time-Aware Scheduling

The schedule generator is deliberately constrained to study planning. Requests unrelated to learning or scheduling, such as recipes, coding tasks, or casual conversation, are politely rejected.

The backend is aware of Jakarta time (`Asia/Jakarta`) and applies scheduling rules including:

- Weekday and weekend start-time defaults.
- A daily study boundary at 20:00 WIB.
- A late-night rule: after 21:30 WIB, the first generated day is shifted to the following day.
- Avoidance of past time slots for the current day.
- Schedule adjustments when users report interruptions or conflicts.
- Structured JSON output for predictable frontend rendering.

These rules reduce implausible schedules and help prevent the planner from producing sessions that have already elapsed.

### Resilient Gemini Waterfall

The `/api/generate-schedule` Route Handler uses a model waterfall. It attempts configured Gemini models sequentially and continues to the next model when a model is unavailable, rate-limited, or returns invalid output. This gives the application a graceful degradation path instead of depending on a single model endpoint.

The response is validated before persistence. The expected shape is:

```json
{
  "balasan_chat": "Your concise confirmation",
  "jadwal_harian": {
    "hari_1": [
      {
        "waktu": "19:00 - 19:25",
        "kegiatan": "Review core concepts",
        "tipe": "fokus"
      }
    ]
  }
}
```

### Server Streaming Progress

The schedule endpoint returns a `ReadableStream` from a Next.js Route Handler. Progress events are sent as newline-delimited JSON while the request is running, including states such as:

- Reading the user's instructions and chat history.
- Contacting Gemini.
- Saving the resulting schedule to Supabase.
- Returning the final schedule.

The client consumes these events through the Fetch Streams API and updates Sonner toasts dynamically, giving the user feedback during model generation and database persistence.

### Apple-Inspired Squircle Pomodoro

The `PomodoroTimer` component is integrated with the active day's schedule rather than functioning as an isolated stopwatch. It compares the computer's current time with scheduled ranges and displays:

- A countdown until the next session.
- Remaining time during an active session.
- A completed state after the day's sessions have ended.
- A progress bar based on the active schedule item.

The widget uses a Cupertino-inspired Squircle container, Glassmorphism surfaces, a digital clock font, and responsive styling. Browser notification permission is requested on mount, and a session completion can trigger both an operating-system notification and a Sonner toast.

## Architecture

```text
Browser
  |
  | Next.js App Router pages
  v
Landing Page (/)
  |
  +--> Login / Signup (/login)
  |       |
  |       +--> Supabase Auth
  |       +--> displayname browser cookie
  |       +--> Orientation schedule for new users
  |
  +--> Protected Dashboard (/belajar)
          |
          +--> Server page fetches the latest user_schedules row
          +--> Client dashboard manages chat, day tabs, and UI state
          +--> POST /api/generate-schedule
                  |
                  +--> Gemini model waterfall
                  +--> ReadableStream progress events
                  +--> Update latest Supabase schedule row
```

### Application Layers

- `app/page.tsx`: Public landing page with product introduction, usage steps, and FAQ.
- `app/login/page.tsx`: Server wrapper with a Suspense boundary for the interactive login UI.
- `app/login/LoginUI.tsx`: Client-side login and signup form, cookie persistence, and orientation schedule initialization.
- `app/belajar/page.tsx`: Authenticated server page that verifies the user and loads the latest schedule.
- `app/belajar/ClientPage.tsx`: Interactive chat dashboard, schedule navigation, logout, reset flow, and streaming response handling.
- `app/api/generate-schedule/route.ts`: Authenticated Gemini schedule generation endpoint with guardrails, streaming progress, and persistence.
- `components/ui/PomodoroTimer.tsx`: Real-time schedule-aware timer and notifications.
- `components/ui/TimelineView.tsx`: Timeline renderer for daily schedule items.
- `lib/supabase/client.ts`: Browser Supabase client using `createBrowserClient`.
- `lib/supabase/server.ts`: Server Supabase client using Next.js cookie integration.
- `proxy.ts`: Request-time session verification and route protection for `/belajar` and `/login`.

## Tech Stack

### Frontend

- **Next.js 16.3.3** with the App Router and Route Handlers.
- **React 19.2.8** with TypeScript.
- **Tailwind CSS 4** for utility-first styling.
- **shadcn/ui** and Base UI primitives for reusable controls.
- **Lucide React** and React Icons for interface icons.
- **Sonner** for loading, success, and error toasts.
- **next-themes** for Light/Dark mode support.
- **Motion** and custom CSS animations for visual polish.

### Backend and Data

- **Google Generative AI SDK** (`@google/generative-ai`) for Gemini-powered schedule generation.
- **Supabase Auth** for user authentication.
- **Supabase PostgreSQL** for persistent schedule and chat storage.
- **JSONB** for flexible `jadwal_data` and `chat_history` documents.
- **Supabase SSR** (`@supabase/ssr`) for browser/server client separation and cookie-based session handling.
- **Row Level Security (RLS)** to restrict records to their owning authenticated user.

## Data Flow

1. A user signs up or signs in through Supabase Auth.
2. The application stores a short-lived `displayname` cookie for dashboard personalization.
3. A new user receives an orientation schedule if no schedule exists yet.
4. The protected dashboard fetches the user's latest `user_schedules` record, ordered by `created_at` descending.
5. The user sends a target or revision through the chat interface.
6. The API verifies the Supabase session before processing the request.
7. Gemini receives the latest instruction and contextual chat history.
8. The API streams progress events to the browser while generating the response.
9. The latest schedule row is updated with the new schedule and combined chat history.
10. The dashboard renders the AI response, day tabs, timeline, and current-day timer.

## Database Schema

Run this SQL in the Supabase SQL Editor:

```sql
CREATE TABLE user_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users NOT NULL,
    tujuan_belajar TEXT NOT NULL,
    jadwal_data JSONB NOT NULL,
    chat_history JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own schedules"
ON user_schedules FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "User can insert own schedules"
ON user_schedules FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can update own schedules"
ON user_schedules FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "User can delete own schedules"
ON user_schedules FOR DELETE
USING (auth.uid() = user_id);
```

### Stored JSON Shape

`jadwal_data` uses the following structure:

```json
{
  "tanggal_mulai": "2026-09-04",
  "jadwal_harian": {
    "hari_1": [
      {
        "waktu": "16:00 - 16:25",
        "kegiatan": "Study session",
        "tipe": "fokus"
      }
    ]
  }
}
```

`chat_history` is an array of messages:

```json
[
  { "role": "user", "content": "I want to study physics" },
  { "role": "assistant", "content": "Your schedule is ready." }
]
```

The application updates the newest schedule row for the authenticated user. It does not intentionally create a new row for every chat message.

## Getting Started

### Prerequisites

- Node.js 20 or newer is recommended.
- A Supabase project with Auth enabled.
- A Google Gemini API key.

### Installation

```bash
git clone https://github.com/StillDhaaa/ai-study-planner.git
cd ai-study-planner
npm install
```

### Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_google_gemini_api_key
```

Never commit `.env.local` or expose private API keys in client-side code.

### Database Setup

Run the schema from the [Database Schema](#database-schema) section in the Supabase SQL Editor. Confirm that Row Level Security is enabled and that the four policies are active.

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Commands

```bash
npm run lint
npm run build
npm run start
```

## Deployment on Vercel

1. Import the repository into Vercel.
2. Add the three environment variables from `.env.local` under the appropriate Vercel environment settings.
3. Deploy using the default Next.js build configuration.
4. Confirm the deployed application can authenticate with Supabase and that the browser's deployed origin is allowed in Supabase Auth URL configuration.
5. Configure the Supabase site URL and redirect URLs to include:
   - `https://dhaaa-ai-study-planner.vercel.app`
   - `https://dhaaa-ai-study-planner.vercel.app/belajar`

## Security Notes

- The dashboard and schedule API require an authenticated Supabase user.
- The server validates the user session with `supabase.auth.getUser()`.
- Supabase RLS policies restrict schedule reads, writes, updates, and deletes by `auth.uid()`.
- The Gemini API key is read only on the server route and must remain in environment variables.
- The `displayname` cookie is used for presentation only; authorization is controlled by the Supabase session.
- The reset action deletes the authenticated user's schedule records after confirmation.

## Project Status

The core experience is implemented, including authentication, contextual schedule generation, persistence, streaming progress, real-time timer behavior, notifications, and responsive Glassmorphism UI.

Potential future improvements include automated tests, server-side schema generation for stronger Supabase types, richer schedule conflict detection, and persistent notification preferences.

## Credits

Developed by [Dhaaa](https://github.com/StillDhaaa).
