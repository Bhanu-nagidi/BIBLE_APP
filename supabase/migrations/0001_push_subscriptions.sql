-- Web Push subscriptions for daily Bible reminders.
-- Run this once in the Supabase SQL Editor (or via `supabase db push`).

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_name text,
  reminder_hour smallint not null,
  reminder_minute smallint not null,
  reminder_on boolean not null default true,
  next_trigger_utc timestamptz not null,
  last_sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- The cron job scans for subscriptions due "now" every minute — this index keeps that cheap.
create index if not exists push_subscriptions_due_idx
  on public.push_subscriptions (next_trigger_utc)
  where reminder_on = true;

alter table public.push_subscriptions enable row level security;

-- Each user can only manage their own subscription rows.
-- The scheduled Edge Function uses the service-role key, which bypasses RLS entirely.
create policy "Users manage their own push subscriptions"
  on public.push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Cron job ──────────────────────────────────────────────────────────────────
-- Requires the `pg_cron` and `pg_net` extensions (Dashboard → Database → Extensions).
-- Replace <SERVICE_ROLE_KEY> and <PROJECT_REF> before running, or run this part
-- manually after enabling the extensions.
--
-- select cron.schedule(
--   'send-daily-reminders',
--   '* * * * *',
--   $$
--   select net.http_post(
--     url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-reminders',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'x-cron-secret', '<CRON_SECRET>'
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
