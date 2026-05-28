create extension if not exists pgcrypto;

create or replace function public.set_athlete_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.athlete_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  is_junior boolean not null default false,
  age_group text,
  sport_category text,
  sport text,
  sport_id text,
  position_role text,
  secondary_position_role text,
  state text,
  region text,
  team_club text,
  team_club_status text not null default 'custom_unverified',
  competition_level text,
  profile_status text not null default 'draft',
  visibility_status text not null default 'private',
  contact_route text not null default 'athlete',
  completeness_score integer not null default 0,
  profile_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint athlete_profiles_contact_route_check
    check (contact_route in ('parent_guardian', 'athlete')),
  constraint athlete_profiles_visibility_status_check
    check (visibility_status in ('private', 'club_verified', 'scout_visible', 'showcase_approved')),
  constraint athlete_profiles_profile_status_check
    check (profile_status in ('draft', 'pending_parent_approval', 'pending_verification', 'approved', 'rejected')),
  constraint athlete_profiles_completeness_score_check
    check (completeness_score between 0 and 100)
);

create index if not exists athlete_profiles_owner_user_id_idx
  on public.athlete_profiles (owner_user_id);

create index if not exists athlete_profiles_sport_idx
  on public.athlete_profiles (sport);

create index if not exists athlete_profiles_sport_id_idx
  on public.athlete_profiles (sport_id);

create index if not exists athlete_profiles_state_idx
  on public.athlete_profiles (state);

create index if not exists athlete_profiles_region_idx
  on public.athlete_profiles (region);

create index if not exists athlete_profiles_is_junior_idx
  on public.athlete_profiles (is_junior);

create index if not exists athlete_profiles_visibility_status_idx
  on public.athlete_profiles (visibility_status);

create index if not exists athlete_profiles_profile_status_idx
  on public.athlete_profiles (profile_status);

drop trigger if exists set_athlete_profiles_updated_at on public.athlete_profiles;

create trigger set_athlete_profiles_updated_at
before update on public.athlete_profiles
for each row
execute function public.set_athlete_profiles_updated_at();

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.athlete_profiles to authenticated;

alter table public.athlete_profiles enable row level security;

drop policy if exists "athlete profiles own select" on public.athlete_profiles;
create policy "athlete profiles own select"
on public.athlete_profiles
for select
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "athlete profiles own insert" on public.athlete_profiles;
create policy "athlete profiles own insert"
on public.athlete_profiles
for insert
to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists "athlete profiles own update" on public.athlete_profiles;
create policy "athlete profiles own update"
on public.athlete_profiles
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "athlete profiles own delete" on public.athlete_profiles;
create policy "athlete profiles own delete"
on public.athlete_profiles
for delete
to authenticated
using (owner_user_id = auth.uid());
