create extension if not exists pgcrypto;

create or replace function public.set_highlights_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.highlights (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  athlete_profile_id uuid not null references public.athlete_profiles(id) on delete cascade,
  title text not null,
  sport text,
  sport_id text,
  highlight_type text,
  match_event text,
  competition text,
  event_date text,
  opponent text,
  position_played text,
  description text,
  video_url text,
  thumbnail_url text,
  verification_source text not null default 'unverified',
  approval_status text not null default 'pending_review',
  showcase_status text not null default 'private',
  is_featured boolean not null default false,
  boost_count integer not null default 0,
  highlight_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint highlights_approval_status_check
    check (
      approval_status in (
        'pending_parent_approval',
        'pending_review',
        'parent_approved',
        'coach_verified',
        'club_verified',
        'admin_approved',
        'rejected'
      )
    ),
  constraint highlights_showcase_status_check
    check (
      showcase_status in (
        'private',
        'profile_only',
        'showcase_requested',
        'showcase_approved'
      )
    ),
  constraint highlights_boost_count_check
    check (boost_count >= 0)
);

create index if not exists highlights_owner_user_id_idx
  on public.highlights (owner_user_id);

create index if not exists highlights_athlete_profile_id_idx
  on public.highlights (athlete_profile_id);

create index if not exists highlights_sport_idx
  on public.highlights (sport);

create index if not exists highlights_sport_id_idx
  on public.highlights (sport_id);

create index if not exists highlights_approval_status_idx
  on public.highlights (approval_status);

create index if not exists highlights_showcase_status_idx
  on public.highlights (showcase_status);

create index if not exists highlights_is_featured_idx
  on public.highlights (is_featured);

drop trigger if exists set_highlights_updated_at on public.highlights;

create trigger set_highlights_updated_at
before update on public.highlights
for each row
execute function public.set_highlights_updated_at();

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.highlights to authenticated;

alter table public.highlights enable row level security;

drop policy if exists "highlights own select" on public.highlights;
create policy "highlights own select"
on public.highlights
for select
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "highlights own insert" on public.highlights;
create policy "highlights own insert"
on public.highlights
for insert
to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists "highlights own update" on public.highlights;
create policy "highlights own update"
on public.highlights
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "highlights own delete" on public.highlights;
create policy "highlights own delete"
on public.highlights
for delete
to authenticated
using (owner_user_id = auth.uid());

-- No public read policy is added in this phase.
-- Public or scout-facing database highlight discovery should not be enabled yet.

-- Ask PostgREST to refresh its schema cache so the highlights table becomes
-- visible to the Supabase Data API immediately after this script runs.
notify pgrst, 'reload schema';
