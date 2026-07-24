-- Skinwise Stage 3.1 — consultation, expert workflow, regimen, orders
--
-- Extends 0001 rather than duplicating it: consultations hang off the
-- existing assessments/leads tables, and no user or assessment data is
-- restated here.
--
-- Conventions carried over from 0001: gen_random_uuid() primary keys,
-- timestamptz, RLS enabled with NO policies (all access is server-side via
-- the service role, which bypasses RLS).

create table if not exists public.experts (
  id           uuid primary key default gen_random_uuid(),
  full_name    text not null,
  credentials  text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists public.consultations (
  id             uuid primary key default gen_random_uuid(),
  assessment_id  uuid not null references public.assessments(id) on delete cascade,
  lead_id        uuid not null references public.leads(id) on delete cascade,
  expert_id      uuid references public.experts(id) on delete set null,

  -- Human-quotable reference, e.g. SW-2607221530. Unique so the team and
  -- the customer can both cite it without ambiguity.
  reference      text not null unique,

  -- 'requested' is deliberately distinct from any confirmed state. There is
  -- no calendar system, so the customer is told their request was received,
  -- never that a time is booked. The team confirms on WhatsApp and moves
  -- this to 'scheduled'.
  status         text not null default 'requested'
                 check (status in ('requested','scheduled','completed','cancelled')),

  -- Rough preference only. No booking_slots table exists, because inventing
  -- appointment times the business cannot honour would be fake availability.
  preferred_time text check (preferred_time in ('morning','afternoon','evening','anytime')),

  -- The payment seam. Every row is 'not_required' today: there is no
  -- gateway. Nothing downstream reads this column to function, so a
  -- PaymentProvider can be introduced later without touching the
  -- consultation lifecycle, expert workflow, regimen or order stages.
  payment_status text not null default 'not_required'
                 check (payment_status in ('not_required','pending','paid','refunded')),
  payment_ref    text,

  handoff_sent   boolean not null default false,
  requested_at   timestamptz not null default now(),
  closed_at      timestamptz
);

-- What the human expert reviewed and concluded. Kept separate from any
-- future photo_observations/AI table by design: AI output can inform this
-- row but must never write it, which is what makes "AI guides, human
-- decides" true in the schema rather than only in the copy.
create table if not exists public.expert_reviews (
  id               uuid primary key default gen_random_uuid(),
  consultation_id  uuid not null references public.consultations(id) on delete cascade,
  assessment_id    uuid not null references public.assessments(id) on delete cascade,
  expert_id        uuid not null references public.experts(id) on delete restrict,

  -- What the expert observed, in their own words.
  notes            text,
  -- Whether the expert agreed with the rules-engine outline. Nullable until
  -- they say. Recording disagreement is how the engine gets better.
  agreed_with_outline boolean,
  -- The verdict: the expert's decision, distinct from their notes.
  verdict          text,
  reviewed_at      timestamptz not null default now(),

  -- One review per consultation. A second opinion belongs on a new
  -- consultation, not silently overwriting the first.
  unique (consultation_id)
);

create table if not exists public.regimens (
  id                uuid primary key default gen_random_uuid(),
  assessment_id     uuid not null references public.assessments(id) on delete cascade,
  expert_review_id  uuid not null references public.expert_reviews(id) on delete cascade,
  duration_days     integer check (duration_days in (15, 30, 45)),
  notes             text,
  follow_up         text,
  -- Nothing reaches the customer until an expert publishes it.
  published_at      timestamptz,
  created_at        timestamptz not null default now()
);

create table if not exists public.regimen_items (
  id            uuid primary key default gen_random_uuid(),
  regimen_id    uuid not null references public.regimens(id) on delete cascade,
  step_order    integer not null,
  time_of_day   text not null check (time_of_day in ('am','pm','both')),

  -- Free-text formulation reference, NOT a foreign key to a products table.
  -- There is no product catalogue: Skinwise formulations are compounded per
  -- customer, so a SKU table would be invented data. When a real catalogue
  -- exists, add product_id alongside this and backfill.
  formulation_ref text not null,
  instructions  text,
  frequency     text,
  created_at    timestamptz not null default now()
);

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  lead_id          uuid not null references public.leads(id) on delete cascade,
  consultation_id  uuid not null references public.consultations(id) on delete cascade,
  regimen_id       uuid not null references public.regimens(id) on delete restrict,
  status           text not null default 'pending'
                   check (status in ('pending','confirmed','fulfilled','shipped','cancelled')),
  tracking_ref     text,
  created_at       timestamptz not null default now(),
  shipped_at       timestamptz
);

-- Business/expert actions worth being able to reconstruct later. Carries
-- ids and action names only: no answers, no photo data, no credentials.
create table if not exists public.audit_log (
  id           uuid primary key default gen_random_uuid(),
  actor_type   text not null check (actor_type in ('system','expert','customer')),
  actor_id     uuid,
  action       text not null,
  subject_type text not null,
  subject_id   uuid not null,
  meta         jsonb,
  occurred_at  timestamptz not null default now()
);

create index if not exists consultations_assessment_idx on public.consultations(assessment_id);
create index if not exists consultations_lead_idx on public.consultations(lead_id);
create index if not exists consultations_status_idx on public.consultations(status, requested_at desc);
create index if not exists expert_reviews_consultation_idx on public.expert_reviews(consultation_id);
create index if not exists regimens_assessment_idx on public.regimens(assessment_id);
create index if not exists regimen_items_regimen_idx on public.regimen_items(regimen_id, step_order);
create index if not exists orders_lead_idx on public.orders(lead_id);
create index if not exists audit_log_subject_idx on public.audit_log(subject_type, subject_id, occurred_at desc);

alter table public.experts         enable row level security;
alter table public.consultations   enable row level security;
alter table public.expert_reviews  enable row level security;
alter table public.regimens        enable row level security;
alter table public.regimen_items   enable row level security;
alter table public.orders          enable row level security;
alter table public.audit_log       enable row level security;

-- No policies, matching 0001. Anon and authenticated are denied everything;
-- the server writes via the service role. Expert-scoped SELECT policies get
-- added when expert accounts exist.
