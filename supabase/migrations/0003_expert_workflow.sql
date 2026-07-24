-- Skinwise Stage 3.2 — expert workflow additions
--
-- Extends 0002. Adds the consultation lifecycle states the expert workflow
-- needs, a regimen draft/published lifecycle, and the customer/internal text
-- split so a customer never sees an expert's private notes.

-- Wider consultation lifecycle. Drop and recreate the check rather than
-- editing it in place.
alter table public.consultations drop constraint if exists consultations_status_check;
alter table public.consultations add constraint consultations_status_check
  check (status in (
    'requested',      -- customer asked; no time booked
    'scheduled',      -- team confirmed a time on WhatsApp
    'in_review',      -- an expert has opened it
    'reviewed',       -- expert verdict recorded
    'regimen_created',-- a regimen has been published
    'completed',
    'cancelled'
  ));

alter table public.consultations
  add column if not exists assigned_at timestamptz;

-- Regimen lifecycle. `notes` on this table is the CUSTOMER-facing summary;
-- an expert's private reasoning lives on expert_reviews.notes and never
-- travels to the customer.
alter table public.regimens
  add column if not exists status text not null default 'draft'
    check (status in ('draft', 'published', 'superseded'));

-- Make the customer/internal split explicit and self-documenting.
comment on column public.regimens.notes is
  'Customer-facing summary. Safe to show to the customer.';
comment on column public.regimens.follow_up is
  'Customer-facing follow-up guidance.';
comment on column public.expert_reviews.notes is
  'INTERNAL expert reasoning. Never shown to the customer.';

create index if not exists regimens_status_idx on public.regimens(assessment_id, status);
