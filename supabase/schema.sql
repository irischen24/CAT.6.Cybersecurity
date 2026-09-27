-- CAT.6 Cybersecurity — Supabase schema (PostgreSQL 15+)
-- Matches js/core/repository.js → SupabaseRepository, which reads/writes the table cat6_records via PostgREST.
-- Run in the Supabase SQL editor. The browser only ever uses the PUBLIC anon key + the signed-in user's JWT;
-- every row is protected by Row Level Security on organization_id. Never put the service_role key in js/config.js.

create extension if not exists pgcrypto;

-- 1. Organizations & memberships -------------------------------------------------------------
create table if not exists organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists memberships (
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null default 'editor' check (role in ('owner', 'editor', 'viewer')),
  created_at      timestamptz not null default now(),
  primary key (organization_id, user_id)
);

-- Helper functions (security definer so policies can read memberships without recursion)
create or replace function is_member(org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships m where m.organization_id = org and m.user_id = auth.uid());
$$;
create or replace function can_edit(org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships m where m.organization_id = org and m.user_id = auth.uid() and m.role in ('owner', 'editor'));
$$;

-- 2. Records: one row per CAT.6 record (risks, treatments, nist, cisram, cisControls, cisSafeguards, csf,
--    isoContext, isoClauses, isoSoa, isoTasks, audits, findings, capas, reviews, evidence, fairInputs,
--    fairRuns, snapshots, activity, importLog, assessments, __meta). The JSON document is stored as-is
--    and keeps its provenance field (USER_INPUT | FILE_IMPORT | CAT6_DEFAULT | CALCULATED).
create table if not exists cat6_records (
  organization_id uuid not null references organizations(id) on delete cascade,
  collection      text not null,
  id              text not null,
  assessment_id   text not null default '',   -- '' for org-wide collections (assessments, __meta)
  source          text check (source is null or source in ('USER_INPUT', 'FILE_IMPORT', 'CAT6_DEFAULT', 'CALCULATED')),
  data            jsonb not null,
  updated_by      uuid default auth.uid(),
  updated_at      timestamptz not null default now(),
  primary key (organization_id, collection, assessment_id, id)   -- same record ID may exist in several assessments
);

create or replace function touch_record() returns trigger language plpgsql as $$
begin new.updated_at := now(); new.updated_by := auth.uid(); return new; end $$;
drop trigger if exists cat6_records_touch on cat6_records;
create trigger cat6_records_touch before insert or update on cat6_records for each row execute function touch_record();

-- 3. Audit log (insert-only, written by trigger — users cannot edit or delete it) ---------------
create table if not exists audit_log (
  id              bigint generated always as identity primary key,
  organization_id uuid not null,
  collection      text not null,
  record_id       text not null,
  action          text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_source      text,
  new_source      text,
  actor           uuid default auth.uid(),
  at              timestamptz not null default now()
);
create or replace function log_record() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into audit_log (organization_id, collection, record_id, action, old_source, new_source)
  values (coalesce(new.organization_id, old.organization_id), coalesce(new.collection, old.collection), coalesce(new.id, old.id),
          tg_op, case when tg_op <> 'INSERT' then old.source end, case when tg_op <> 'DELETE' then new.source end);
  return coalesce(new, old);
end $$;
drop trigger if exists cat6_records_audit on cat6_records;
create trigger cat6_records_audit after insert or update or delete on cat6_records for each row execute function log_record();

-- 4. Row Level Security ------------------------------------------------------------------------
alter table organizations enable row level security;
alter table memberships   enable row level security;
alter table cat6_records  enable row level security;
alter table audit_log     enable row level security;

drop policy if exists org_read on organizations;
create policy org_read on organizations for select using (is_member(id));

drop policy if exists mem_read on memberships;
create policy mem_read on memberships for select using (user_id = auth.uid() or is_member(organization_id));

drop policy if exists rec_read on cat6_records;
create policy rec_read on cat6_records for select using (is_member(organization_id));
drop policy if exists rec_insert on cat6_records;
create policy rec_insert on cat6_records for insert with check (can_edit(organization_id));
drop policy if exists rec_update on cat6_records;
create policy rec_update on cat6_records for update using (can_edit(organization_id)) with check (can_edit(organization_id));
drop policy if exists rec_delete on cat6_records;
create policy rec_delete on cat6_records for delete using (can_edit(organization_id));

drop policy if exists audit_read on audit_log;
create policy audit_read on audit_log for select using (is_member(organization_id));
-- no insert/update/delete policies on audit_log: only the security-definer trigger writes to it.

-- 5. Evidence file storage (optional; the current UI stores file metadata + SHA-256 only) ------------
-- Create a PRIVATE bucket named 'evidence'. Object paths must start with '<organization_id>/'.
insert into storage.buckets (id, name, public) values ('evidence', 'evidence', false) on conflict (id) do nothing;
drop policy if exists evidence_read on storage.objects;
create policy evidence_read on storage.objects for select
  using (bucket_id = 'evidence' and is_member(((storage.foldername(name))[1])::uuid));
drop policy if exists evidence_write on storage.objects;
create policy evidence_write on storage.objects for insert
  with check (bucket_id = 'evidence' and can_edit(((storage.foldername(name))[1])::uuid));
drop policy if exists evidence_delete on storage.objects;
create policy evidence_delete on storage.objects for delete
  using (bucket_id = 'evidence' and can_edit(((storage.foldername(name))[1])::uuid));

-- 6. Onboarding (run once per organization, as an admin in the SQL editor) ----------------------
-- insert into organizations (name) values ('My Organization') returning id;           -- copy the id
-- insert into memberships (organization_id, user_id, role)
--   select '<org-id>', id, 'owner' from auth.users where email = 'owner@example.com';
-- Then put url / anonKey / organizationId in js/config.js and set backend: 'supabase'.
