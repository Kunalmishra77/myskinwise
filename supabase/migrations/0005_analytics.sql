-- Skinwise Stage 8 — lightweight first-party funnel analytics.
--
-- Deliberately minimal and privacy-safe: an event NAME, an optional small
-- jsonb of NON-PII metadata (e.g. {"stored": true}, {"concern": "acne"}),
-- and a timestamp. It never stores names, phones, emails, photos, photo
-- URLs, transcripts, or any free-text the customer typed. RLS on, no
-- policies — writes go through the server (service role) only.
create table if not exists public.analytics_events (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  meta       jsonb,
  occurred_at timestamptz not null default now()
);
create index if not exists analytics_events_name_idx on public.analytics_events(name, occurred_at desc);
alter table public.analytics_events enable row level security;
