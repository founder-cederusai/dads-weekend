-- Dads Weekend 2026 — one key/value table is all the app needs.
-- Run this in Supabase → SQL Editor → New query → Run.

create table if not exists public.kv (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table public.kv enable row level security;

-- Anyone with the link can read and write. This is a private tournament
-- URL, not a public app — do not reuse this policy for anything sensitive.
drop policy if exists "tournament open access" on public.kv;
create policy "tournament open access"
  on public.kv for all
  using (true)
  with check (true);

-- Push changes to every phone the moment a score lands.
alter publication supabase_realtime add table public.kv;
