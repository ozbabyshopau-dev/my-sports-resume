create extension if not exists pgcrypto;

create or replace function public.set_admin_queue_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.admin_queue_items (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete set null,
  related_user_id uuid references auth.users(id) on delete set null,
  related_athlete_profile_id uuid references public.athlete_profiles(id) on delete set null,
  related_highlight_id uuid references public.highlights(id) on delete set null,
  related_opportunity_id uuid references public.opportunities(id) on delete set null,
  related_contact_request_id uuid references public.contact_requests(id) on delete set null,
  related_shortlist_id uuid references public.shortlists(id) on delete set null,
  queue_type text not null,
  queue_status text not null default 'pending_review',
  priority text not null default 'normal',
  review_reason text,
  review_notes text,
  source_context text,
  admin_decision text,
  admin_decision_by uuid references auth.users(id) on delete set null,
  admin_decision_at timestamptz,
  no_direct_messaging boolean not null default true,
  queue_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_queue_items_queue_type_check
    check (
      queue_type in (
        'profile_review',
        'highlight_review',
        'opportunity_review',
        'club_scout_verification',
        'contact_request_review',
        'flagged_content',
        'safety_review'
      )
    ),
  constraint admin_queue_items_queue_status_check
    check (
      queue_status in (
        'pending_review',
        'in_review',
        'approved',
        'rejected',
        'archived',
        'needs_changes'
      )
    ),
  constraint admin_queue_items_priority_check
    check (
      priority in (
        'low',
        'normal',
        'high',
        'urgent'
      )
    ),
  constraint admin_queue_items_admin_decision_check
    check (
      admin_decision is null or
      admin_decision in (
        'approved',
        'rejected',
        'needs_changes',
        'archived',
        'no_action'
      )
    )
);

create index if not exists admin_queue_items_owner_user_id_idx
  on public.admin_queue_items (owner_user_id);

create index if not exists admin_queue_items_related_user_id_idx
  on public.admin_queue_items (related_user_id);

create index if not exists admin_queue_items_related_athlete_profile_id_idx
  on public.admin_queue_items (related_athlete_profile_id);

create index if not exists admin_queue_items_related_highlight_id_idx
  on public.admin_queue_items (related_highlight_id);

create index if not exists admin_queue_items_related_opportunity_id_idx
  on public.admin_queue_items (related_opportunity_id);

create index if not exists admin_queue_items_related_contact_request_id_idx
  on public.admin_queue_items (related_contact_request_id);

create index if not exists admin_queue_items_related_shortlist_id_idx
  on public.admin_queue_items (related_shortlist_id);

create index if not exists admin_queue_items_queue_type_idx
  on public.admin_queue_items (queue_type);

create index if not exists admin_queue_items_queue_status_idx
  on public.admin_queue_items (queue_status);

create index if not exists admin_queue_items_priority_idx
  on public.admin_queue_items (priority);

create index if not exists admin_queue_items_created_at_idx
  on public.admin_queue_items (created_at);

drop trigger if exists set_admin_queue_items_updated_at on public.admin_queue_items;

create trigger set_admin_queue_items_updated_at
before update on public.admin_queue_items
for each row
execute function public.set_admin_queue_items_updated_at();

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.admin_queue_items to authenticated;

alter table public.admin_queue_items enable row level security;

drop policy if exists "admin queue items own select" on public.admin_queue_items;
create policy "admin queue items own select"
on public.admin_queue_items
for select
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "admin queue items own insert" on public.admin_queue_items;
create policy "admin queue items own insert"
on public.admin_queue_items
for insert
to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists "admin queue items own update" on public.admin_queue_items;
create policy "admin queue items own update"
on public.admin_queue_items
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "admin queue items own delete" on public.admin_queue_items;
create policy "admin queue items own delete"
on public.admin_queue_items
for delete
to authenticated
using (owner_user_id = auth.uid());

-- No public read policy is added in this phase.
-- No unauthenticated reads are allowed.
-- Admin-wide RLS can be added later when a robust app-role policy is ready.
-- No inbox, conversation thread, or messaging behaviour is introduced in this table.

notify pgrst, 'reload schema';
