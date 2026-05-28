create extension if not exists pgcrypto;

create or replace function public.set_contact_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.prevent_contact_request_identity_mutation()
returns trigger
language plpgsql
as $$
begin
  if new.requester_user_id is distinct from old.requester_user_id
    or new.athlete_owner_user_id is distinct from old.athlete_owner_user_id
    or new.athlete_profile_id is distinct from old.athlete_profile_id
    or new.opportunity_id is distinct from old.opportunity_id
    or new.requester_name is distinct from old.requester_name
    or new.requester_email is distinct from old.requester_email
    or new.requester_role is distinct from old.requester_role
    or new.requester_organisation is distinct from old.requester_organisation
    or new.athlete_display_name is distinct from old.athlete_display_name
    or new.athlete_is_junior is distinct from old.athlete_is_junior
    or new.contact_route is distinct from old.contact_route
    or new.request_type is distinct from old.request_type
    or new.no_direct_messaging is distinct from old.no_direct_messaging
  then
    raise exception 'contact request identity fields cannot be changed after creation';
  end if;

  return new;
end;
$$;

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid references auth.users(id) on delete set null,
  athlete_owner_user_id uuid references auth.users(id) on delete set null,
  athlete_profile_id uuid references public.athlete_profiles(id) on delete set null,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  requester_name text,
  requester_email text,
  requester_role text,
  requester_organisation text,
  athlete_display_name text,
  athlete_is_junior boolean not null default false,
  contact_route text not null default 'contact_request_only',
  request_type text not null default 'general_contact_request',
  request_status text not null default 'pending_review',
  safety_status text not null default 'safe_pending',
  parent_guardian_required boolean not null default false,
  admin_review_required boolean not null default true,
  no_direct_messaging boolean not null default true,
  request_reason text,
  request_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_requests_contact_route_check
    check (
      contact_route in (
        'parent_guardian_required',
        'athlete_allowed',
        'contact_request_only'
      )
    ),
  constraint contact_requests_request_type_check
    check (
      request_type in (
        'general_contact_request',
        'opportunity_interest',
        'scout_interest',
        'club_trial_interest',
        'verification_followup'
      )
    ),
  constraint contact_requests_request_status_check
    check (
      request_status in (
        'pending_review',
        'pending_parent_guardian',
        'approved_to_contact',
        'rejected',
        'archived'
      )
    ),
  constraint contact_requests_safety_status_check
    check (
      safety_status in (
        'safe_pending',
        'needs_admin_review',
        'blocked',
        'approved'
      )
    )
);

create index if not exists contact_requests_requester_user_id_idx
  on public.contact_requests (requester_user_id);

create index if not exists contact_requests_athlete_owner_user_id_idx
  on public.contact_requests (athlete_owner_user_id);

create index if not exists contact_requests_athlete_profile_id_idx
  on public.contact_requests (athlete_profile_id);

create index if not exists contact_requests_opportunity_id_idx
  on public.contact_requests (opportunity_id);

create index if not exists contact_requests_request_status_idx
  on public.contact_requests (request_status);

create index if not exists contact_requests_contact_route_idx
  on public.contact_requests (contact_route);

create index if not exists contact_requests_athlete_is_junior_idx
  on public.contact_requests (athlete_is_junior);

create index if not exists contact_requests_created_at_idx
  on public.contact_requests (created_at);

drop trigger if exists set_contact_requests_updated_at on public.contact_requests;
drop trigger if exists prevent_contact_request_identity_mutation on public.contact_requests;

create trigger set_contact_requests_updated_at
before update on public.contact_requests
for each row
execute function public.set_contact_requests_updated_at();

create trigger prevent_contact_request_identity_mutation
before update on public.contact_requests
for each row
execute function public.prevent_contact_request_identity_mutation();

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.contact_requests to authenticated;

alter table public.contact_requests enable row level security;

drop policy if exists "contact requests requester select" on public.contact_requests;
create policy "contact requests requester select"
on public.contact_requests
for select
to authenticated
using (requester_user_id = auth.uid());

drop policy if exists "contact requests athlete owner select" on public.contact_requests;
create policy "contact requests athlete owner select"
on public.contact_requests
for select
to authenticated
using (athlete_owner_user_id = auth.uid());

drop policy if exists "contact requests requester insert" on public.contact_requests;
create policy "contact requests requester insert"
on public.contact_requests
for insert
to authenticated
with check (requester_user_id = auth.uid());

drop policy if exists "contact requests requester update pending" on public.contact_requests;
create policy "contact requests requester update pending"
on public.contact_requests
for update
to authenticated
using (
  requester_user_id = auth.uid()
  and request_status in ('pending_review', 'pending_parent_guardian')
)
with check (
  requester_user_id = auth.uid()
);

drop policy if exists "contact requests athlete owner update" on public.contact_requests;
create policy "contact requests athlete owner update"
on public.contact_requests
for update
to authenticated
using (athlete_owner_user_id = auth.uid())
with check (athlete_owner_user_id = auth.uid());

drop policy if exists "contact requests requester delete pending" on public.contact_requests;
create policy "contact requests requester delete pending"
on public.contact_requests
for delete
to authenticated
using (
  requester_user_id = auth.uid()
  and request_status in ('pending_review', 'pending_parent_guardian')
);

-- No public read policy is added in this phase.
-- No unauthenticated reads are allowed.
-- No messaging-thread or inbox-style policies are introduced.

notify pgrst, 'reload schema';
