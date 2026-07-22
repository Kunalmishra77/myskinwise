-- Skinwise Stage 2 — assessment persistence
--
-- Design notes that matter:
--  * Ids are random UUIDs, never sequential. Assessment ids appear in
--    result links, so a guessable id would let anyone walk other people's
--    skin assessments.
--  * Answers live in their own table rather than a jsonb blob on the
--    assessment, so a single answer can be corrected or redacted without
--    rewriting the record, and so Stage 3's expert view can query them.
--  * RLS is ON with NO public policies. Every write goes through the
--    server using the service role key, which bypasses RLS. The anon key
--    therefore cannot read or write anything here at all — that is the
--    intended posture while there are no user accounts.

create extension if not exists "pgcrypto";

create table if not exists public.leads (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  phone_e164    text not null,
  email         text,
  created_at    timestamptz not null default now()
);

create table if not exists public.assessments (
  id                 uuid primary key default gen_random_uuid(),
  lead_id            uuid not null references public.leads(id) on delete cascade,
  concern_slug       text not null,
  skin_type          text,
  status             text not null default 'submitted',
  -- Consent is recorded per purpose, not as one blanket flag: DPDP
  -- requires the notice to itemise what is collected.
  contact_consent    boolean not null,
  photo_consent      boolean,
  policy_version     text not null,
  submitted_at       timestamptz not null default now()
);

create table if not exists public.assessment_answers (
  id             uuid primary key default gen_random_uuid(),
  assessment_id  uuid not null references public.assessments(id) on delete cascade,
  question_id    text not null,
  -- Multi-select answers keep one row per value, so counting and
  -- filtering stay trivial for the expert view.
  value          text not null,
  created_at     timestamptz not null default now()
);

-- What the rules engine produced, and which rules fired. Kept so any
-- recommendation shown to a customer can be replayed months later.
create table if not exists public.regimen_recommendations (
  id             uuid primary key default gen_random_uuid(),
  assessment_id  uuid not null references public.assessments(id) on delete cascade,
  engine_version text not null,
  outline        jsonb not null,
  created_at     timestamptz not null default now()
);

create index if not exists assessment_answers_assessment_idx
  on public.assessment_answers(assessment_id);
create index if not exists assessments_lead_idx on public.assessments(lead_id);
create index if not exists assessments_submitted_idx on public.assessments(submitted_at desc);

alter table public.leads                    enable row level security;
alter table public.assessments              enable row level security;
alter table public.assessment_answers       enable row level security;
alter table public.regimen_recommendations  enable row level security;

-- Deliberately no policies. With RLS enabled and no policy defined,
-- anon and authenticated roles are denied everything. The service role
-- bypasses RLS entirely, so server-side writes still work. When user
-- accounts arrive in Stage 3, add scoped SELECT policies here.
