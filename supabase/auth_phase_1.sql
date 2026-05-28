-- My Sports Resume
-- Supabase Auth Phase 1
-- Accounts only. This file does not migrate athlete profiles, highlights, opportunities, or other sports data.

create schema if not exists public;

create table if not exists public.app_user_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text not null,
  role text not null check (
    role in ('junior_athlete', 'parent_guardian', 'adult_athlete', 'club_scout', 'admin')
  ),
  account_status text not null default 'active' check (
    account_status in ('active', 'pending', 'suspended', 'disabled')
  ),
  organisation_name text,
  state text,
  region text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_app_user_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_app_user_profiles_set_updated_at on public.app_user_profiles;

create trigger trg_app_user_profiles_set_updated_at
before update on public.app_user_profiles
for each row
execute function public.set_app_user_profiles_updated_at();

create index if not exists idx_app_user_profiles_role
  on public.app_user_profiles (role);

create index if not exists idx_app_user_profiles_email
  on public.app_user_profiles (email);

create index if not exists idx_app_user_profiles_account_status
  on public.app_user_profiles (account_status);

alter table public.app_user_profiles enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update on public.app_user_profiles to authenticated;

drop policy if exists "app_user_profiles_select_own" on public.app_user_profiles;
create policy "app_user_profiles_select_own"
on public.app_user_profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "app_user_profiles_insert_own" on public.app_user_profiles;
create policy "app_user_profiles_insert_own"
on public.app_user_profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "app_user_profiles_update_own" on public.app_user_profiles;
create policy "app_user_profiles_update_own"
on public.app_user_profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- No public read policy is added in this phase.
-- Admin cross-account policies can be added later after the admin role model is finalized.
