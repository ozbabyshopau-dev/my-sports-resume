create extension if not exists pgcrypto;

create or replace function public.set_shortlists_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.shortlists (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  athlete_profile_id uuid references public.athlete_profiles(id) on delete cascade,
  athlete_owner_user_id uuid references auth.users(id) on delete set null,
  athlete_display_name text,
  athlete_sport text,
  athlete_sport_id text,
  athlete_position_role text,
  athlete_age_group text,
  athlete_state text,
  athlete_region text,
  shortlist_type text not null default 'athlete_shortlist',
  shortlist_status text not null default 'active',
  source_context text not null default 'manual',
  notes text,
  no_direct_messaging boolean not null default true,
  shortlist_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shortlists_shortlist_type_check
    check (
      shortlist_type in (
        'athlete_shortlist',
        'opportunity_match',
        'scout_watchlist',
        'club_review'
      )
    ),
  constraint shortlists_shortlist_status_check
    check (
      shortlist_status in (
        'active',
        'archived',
        'removed'
      )
    )
);

create index if not exists shortlists_owner_user_id_idx
  on public.shortlists (owner_user_id);

create index if not exists shortlists_athlete_profile_id_idx
  on public.shortlists (athlete_profile_id);

create index if not exists shortlists_athlete_owner_user_id_idx
  on public.shortlists (athlete_owner_user_id);

create index if not exists shortlists_athlete_sport_idx
  on public.shortlists (athlete_sport);

create index if not exists shortlists_athlete_sport_id_idx
  on public.shortlists (athlete_sport_id);

create index if not exists shortlists_athlete_state_idx
  on public.shortlists (athlete_state);

create index if not exists shortlists_athlete_region_idx
  on public.shortlists (athlete_region);

create index if not exists shortlists_shortlist_type_idx
  on public.shortlists (shortlist_type);

create index if not exists shortlists_shortlist_status_idx
  on public.shortlists (shortlist_status);

create index if not exists shortlists_created_at_idx
  on public.shortlists (created_at);

create unique index if not exists shortlists_owner_athlete_type_active_idx
  on public.shortlists (owner_user_id, athlete_profile_id, shortlist_type)
  where shortlist_status = 'active' and athlete_profile_id is not null;

drop trigger if exists set_shortlists_updated_at on public.shortlists;

create trigger set_shortlists_updated_at
before update on public.shortlists
for each row
execute function public.set_shortlists_updated_at();

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.shortlists to authenticated;

alter table public.shortlists enable row level security;

drop policy if exists "shortlists own select" on public.shortlists;
create policy "shortlists own select"
on public.shortlists
for select
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "shortlists own insert" on public.shortlists;
create policy "shortlists own insert"
on public.shortlists
for insert
to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists "shortlists own update" on public.shortlists;
create policy "shortlists own update"
on public.shortlists
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "shortlists own delete" on public.shortlists;
create policy "shortlists own delete"
on public.shortlists
for delete
to authenticated
using (owner_user_id = auth.uid());

-- No public read policy is added in this phase.
-- No unauthenticated reads are allowed.
-- No athlete notification, follow, inbox, or messaging-thread behaviour is introduced.

notify pgrst, 'reload schema';
