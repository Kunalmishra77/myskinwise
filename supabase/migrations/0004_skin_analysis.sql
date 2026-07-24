-- Skinwise Stage 5 — AI skin analyzer (photo analysis)
--
-- Face photos are the most sensitive data in this product, so the storage
-- posture is the strictest in the schema: a PRIVATE bucket, RLS on the
-- objects, and no policies — every read/write goes through the server using
-- the service role, and signed URLs are minted server-side with short
-- lifetimes. Nothing here is ever public.
--
-- Layering, kept deliberately separate (requirement §19):
--   skin_analyses               one analysis session
--   skin_analysis_images        the stored photo references (storage paths)
--   skin_analysis_observations  the AI's STRUCTURED output — informational,
--                               never a diagnosis, never an expert verdict

-- Private bucket. `public = false` means no object is served without a
-- signed URL, and file size is capped at the same 8MB the app enforces.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('skin-photos', 'skin-photos', false, 8388608,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create table if not exists public.skin_analyses (
  id             uuid primary key default gen_random_uuid(),
  -- Optional links: an analysis can stand alone, or belong to an assessment
  -- and/or a lead once the person continues into the funnel.
  assessment_id  uuid references public.assessments(id) on delete set null,
  lead_id        uuid references public.leads(id) on delete set null,

  reference      text not null unique,

  -- No-silent-loss lifecycle (requirement §15). "completed" only ever means
  -- a real structured result exists; a failed model call lands on "failed",
  -- never a false success.
  status         text not null default 'uploaded'
                 check (status in (
                   'uploaded', 'quality_failed', 'analyzing',
                   'completed', 'failed'
                 )),

  -- Explicit, itemised consent for AI image analysis (requirement §5).
  consent_image_analysis boolean not null default false,
  policy_version         text,
  consented_at           timestamptz,

  model_version  text,
  error_reason   text,

  created_at     timestamptz not null default now(),
  -- 90-day retention, carried over from the Stage-2 photo policy unchanged.
  -- A scheduled purge deletes the storage object and this row after expiry.
  expires_at     timestamptz not null default (now() + interval '90 days')
);

create table if not exists public.skin_analysis_images (
  id            uuid primary key default gen_random_uuid(),
  analysis_id   uuid not null references public.skin_analyses(id) on delete cascade,
  -- The storage PATH inside the private bucket, never a URL. URLs are minted
  -- on demand, short-lived, and never persisted or sent anywhere durable.
  storage_path  text not null,
  content_type  text not null,
  bytes         integer,
  angle         text check (angle in ('front', 'left', 'right')),
  created_at    timestamptz not null default now()
);

create table if not exists public.skin_analysis_observations (
  id            uuid primary key default gen_random_uuid(),
  analysis_id   uuid not null references public.skin_analyses(id) on delete cascade,
  -- The validated structured observation (see lib/ai/vision-schema). Stored
  -- as jsonb so the customer view and the expert view read the same
  -- validated object; raw provider text is NOT stored.
  observations  jsonb not null,
  created_at    timestamptz not null default now(),
  unique (analysis_id)
);

create index if not exists skin_analyses_assessment_idx on public.skin_analyses(assessment_id);
create index if not exists skin_analyses_lead_idx on public.skin_analyses(lead_id);
create index if not exists skin_analyses_expiry_idx on public.skin_analyses(expires_at);
create index if not exists skin_analysis_images_analysis_idx on public.skin_analysis_images(analysis_id);

alter table public.skin_analyses              enable row level security;
alter table public.skin_analysis_images       enable row level security;
alter table public.skin_analysis_observations enable row level security;

-- No policies, matching every other table: anon/authenticated are denied
-- everything; the service role (server-side only) bypasses RLS. storage.objects
-- already has RLS enabled by Supabase with no public policy, so the bucket's
-- objects are likewise reachable only via the service role.
