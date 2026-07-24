-- Per-expert login credentials.
--
-- The experts table already held real people (id, full_name, credentials,
-- is_active) and the audit log already recorded an expert id against every
-- action — but there was no way to actually sign in AS one of them. Access
-- was a single shared ADMIN_ACCESS_TOKEN, and the acting expert id was sent
-- by the client, so any signed-in person could attribute work to a colleague.
--
-- These columns close that: an expert authenticates as themselves, and the
-- server derives the identity for the audit trail from the session.

alter table public.experts
  add column if not exists email          text,
  add column if not exists password_hash  text,
  add column if not exists last_login_at  timestamptz;

-- Email is the login handle, so it must be unique and is stored lowercased.
-- A partial index keeps the constraint from tripping on rows that predate
-- accounts and have no email yet.
create unique index if not exists experts_email_unique
  on public.experts (lower(email))
  where email is not null;

-- Only ever queried by exact email during login.
create index if not exists experts_email_idx on public.experts (lower(email));

-- RLS stays enabled with zero policies: this table is reachable only through
-- the service role on the server, exactly like every other table here. The
-- password hash must never be selectable by any browser-side key.
alter table public.experts enable row level security;
