# Alaqay

> A calm, game-like PWA that turns tooth brushing into a daily ritual people actually want to keep.

Alaqay is a mobile-first habit app built around one simple emotional loop: light your morning and evening Sparks. Instead of treating oral care like a chore, Alaqay makes it feel visual, social, and gently rewarding. The app combines a polished onboarding flow, real Supabase-backed routines, a guided brushing session, PWA reminders, and a roadmap toward AR-assisted brushing.

The goal is not to make another noisy wellness tracker. Alaqay is designed to feel quiet, premium, playful, and instantly understandable.

## The Product

Every day has two Sparks:

- Morning Spark
- Evening Spark

When a user brushes, the Spark lights up. When they miss it, the routine loses momentum. Over time, the dashboard becomes a small visual record of discipline, care, and consistency.

Alaqay is built for families, kids, adults, and anyone who wants a tiny moment of motivation around a habit that usually gets ignored.

## Why It Feels Different

Most brushing apps either feel medical, childish, or overloaded. Alaqay is different by design:

- Minimal interface with a strong lime-first visual identity.
- Fast brushing entry from dashboard, bottom navigation, or reminder link.
- Guided two-minute session with zone progress.
- Daily Sparks that make consistency visible.
- Friendly onboarding that feels closer to a native app than a form.
- Social direction through Family Battle and shared Spark status.
- PWA foundation for installability, reminders, and mobile use.

## Current MVP

The current app already includes:

- Supabase email/password auth.
- Google sign-in entry point.
- Onboarding with age and morning/evening schedule setup.
- Real profile persistence in Supabase.
- Real daily Sparks generation for morning and evening.
- Dashboard reading real profile and Spark data.
- Brush Session MVP with timer, zones, pause/resume, completion, and instant dashboard refresh.
- `/brush` reminder entry screen with two actions: brush together or confirm already brushed.
- Profile and Settings screen with correct sign out.
- Notification preferences saved to Supabase.
- PWA service worker click action that opens `/brush`.
- Local reminder runtime for active/alive PWA sessions.
- Modular API, hook, screen, component, and style structure.

## Experience Flow

```txt
Auth
  -> Onboarding
    -> Age
    -> Morning and evening Spark schedule
    -> Routine explanation
    -> Permission setup
  -> Dashboard
    -> Start brush
    -> Light Spark
    -> Dashboard updates immediately
```

Reminder flow:

```txt
Spark time arrives
  -> Notification appears
  -> User taps notification
  -> /brush opens
  -> Brush together or mark already brushed
  -> Spark is completed
```

## Tech Stack

Frontend:

- React
- Vite
- TypeScript
- Tailwind CSS v4
- shadcn-style UI primitives
- Hugeicons
- vite-plugin-pwa
- Supabase JS

Backend and data:

- Supabase Auth
- Supabase Postgres
- Supabase RLS policies
- FastAPI planned for advanced logic, ML/AR processing, and server-side push scheduling

Future AR layer:

- MediaPipe Face Landmarker via `@mediapipe/tasks-vision`
- Brush zone detection and guided mirror mode

## Architecture

The frontend is intentionally split by responsibility:

```txt
frontend/src/api        Supabase-facing data access
frontend/src/hooks      App state, auth, dashboard, brushing, reminders
frontend/src/screens    Page-level experiences
frontend/src/components Reusable UI and product components
frontend/src/lib        Supabase client, notifications, utilities
frontend/src/styles     Screen and domain-level styling
frontend/src/types      Shared TypeScript types
frontend/src/data       Mock data kept isolated for fallback/demo content
```

Important files:

```txt
frontend/src/hooks/useAuth.tsx
frontend/src/hooks/useDashboardData.ts
frontend/src/hooks/useBrushSession.ts
frontend/src/hooks/useSparkReminderScheduler.ts
frontend/src/api/profileApi.ts
frontend/src/api/sparksApi.ts
frontend/src/api/brushApi.ts
frontend/src/lib/notifications.ts
frontend/src/lib/supabase-schema.sql
frontend/public/notification-sw.js
frontend/vite.config.ts
```

## Design Direction

Alaqay should feel:

- calm
- minimal
- mobile-native
- premium
- clear at a glance
- lightly game-like

The visual language is lime-first, soft, and focused. Screens should avoid clutter, heavy gradients, and generic dashboard patterns. The app should make the next action obvious without explaining too much.

## Getting Started

Install dependencies:

```bash
cd frontend
npm install
```

Create environment variables:

```bash
cp .env.example .env
```

Fill in:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Run locally:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Type-check:

```bash
node_modules/.bin/tsc -b
```

## Supabase Setup

The project schema lives here:

```txt
frontend/src/lib/supabase-schema.sql
```

If your Supabase project already has the main tables, use targeted migrations instead of recreating everything. For notification preferences, this safe migration is enough:

```sql
alter table public.profiles
  add column if not exists notifications_enabled boolean not null default false,
  add column if not exists notification_permission text default 'default';

update public.profiles
set
  notifications_enabled = coalesce(notifications_enabled, false),
  notification_permission = coalesce(notification_permission, 'default');

alter table public.profiles
  alter column notifications_enabled set default false,
  alter column notification_permission set default 'default';
```

## PWA and Notifications

Alaqay is configured as a PWA through `vite-plugin-pwa`.

Current reminder behavior:

- User enables reminders in Profile/Settings.
- Browser notification permission is requested.
- Preference is saved to Supabase.
- Local scheduler checks morning/evening Spark windows.
- Notification click opens `/brush`.

This is the correct MVP layer for local PWA reminders. The next production layer is server push:

- Store browser push subscriptions.
- Add FastAPI endpoints for subscribe/unsubscribe.
- Schedule server-side jobs for Spark times.
- Send notifications even when the PWA is fully closed.

## Roadmap

Near-term:

- Real server push notifications.
- Editable routine settings.
- Better empty states and completed-day celebration.
- Dashboard polish based on real user history.
- Family Battle backed by Supabase Realtime.

Product expansion:

- AR Mirror mode with face landmarks.
- Brush zone detection.
- Parent and family dashboards.
- Lesson library with short video content.
- Smart recommendations from session history.

Technical polish:

- Code splitting for Supabase and route chunks.
- Offline shell QA.
- Mobile install testing.
- Full accessibility pass.
- Automated tests for Sparks and Brush Session logic.

## Vision

Alaqay is a small app with a surprisingly big promise: make a daily health habit feel alive.

It turns two minutes of routine into a moment of progress, care, and light. One Spark in the morning. One Spark at night. A simple loop, done beautifully.
