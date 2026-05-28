create extension if not exists pgcrypto;

create or replace function public.set_opportunities_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete set null,
  organisation_name text not null,
  contact_role text,
  sport_category text,
  sport text,
  sport_id text,
  position_role text,
  age_group text,
  is_junior_opportunity boolean not null default false,
  junior_or_senior text,
  state text,
  region text,
  competition_level text,
  opportunity_type text,
  title text not null,
  description text,
  requirements text,
  closing_date text,
  verification_status text not null default 'pending_admin_verification',
  opportunity_status text not null default 'draft',
  contact_route text not null default 'contact_request_only',
  visibility_status text not null default 'private',
  opportunity_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint opportunities_verification_status_check
    check (
      verification_status in (
        'pending_admin_verification',
        'verified_organisation',
        'rejected',
        'archived'
      )
    ),
  constraint opportunities_opportunity_status_check
    check (
      opportunity_status in (
        'draft',
        'pending_review',
        'active',
        'closed',
        'archived',
        'rejected'
      )
    ),
  constraint opportunities_contact_route_check
    check (
      contact_route in (
        'contact_request_only',
        'parent_guardian_required',
        'athlete_allowed'
      )
    ),
  constraint opportunities_visibility_status_check
    check (
      visibility_status in (
        'private',
        'verified_only',
        'member_visible',
        'public_preview'
      )
    )
);

create index if not exists opportunities_owner_user_id_idx
  on public.opportunities (owner_user_id);

create index if not exists opportunities_sport_idx
  on public.opportunities (sport);

create index if not exists opportunities_sport_id_idx
  on public.opportunities (sport_id);

create index if not exists opportunities_state_idx
  on public.opportunities (state);

create index if not exists opportunities_region_idx
  on public.opportunities (region);

create index if not exists opportunities_opportunity_type_idx
  on public.opportunities (opportunity_type);

create index if not exists opportunities_opportunity_status_idx
  on public.opportunities (opportunity_status);

create index if not exists opportunities_verification_status_idx
  on public.opportunities (verification_status);

create index if not exists opportunities_is_junior_opportunity_idx
  on public.opportunities (is_junior_opportunity);

create index if not exists opportunities_visibility_status_idx
  on public.opportunities (visibility_status);

drop trigger if exists set_opportunities_updated_at on public.opportunities;

create trigger set_opportunities_updated_at
before update on public.opportunities
for each row
execute function public.set_opportunities_updated_at();

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.opportunities to authenticated;

alter table public.opportunities enable row level security;

drop policy if exists "opportunities own select" on public.opportunities;
create policy "opportunities own select"
on public.opportunities
for select
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "opportunities own insert" on public.opportunities;
create policy "opportunities own insert"
on public.opportunities
for insert
to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists "opportunities own update" on public.opportunities;
create policy "opportunities own update"
on public.opportunities
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "opportunities own delete draft private" on public.opportunities;
create policy "opportunities own delete draft private"
on public.opportunities
for delete
to authenticated
using (
  owner_user_id = auth.uid()
  and opportunity_status = 'draft'
  and visibility_status = 'private'
);

-- No public read policy is added in this phase.
-- No unauthenticated opportunity browsing or database-wide club/scout browsing
-- should be enabled until broader visibility and request routing rules are designed.

notify pgrst, 'reload schema';
