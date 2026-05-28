create extension if not exists pgcrypto;

create or replace function public.set_media_assets_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete cascade,
  athlete_profile_id uuid references public.athlete_profiles(id) on delete set null,
  highlight_id uuid references public.highlights(id) on delete set null,
  related_queue_item_id uuid references public.admin_queue_items(id) on delete set null,
  media_type text not null,
  bucket_name text,
  storage_path text,
  original_filename text,
  mime_type text,
  file_size_bytes bigint,
  public_url text,
  signed_url_expires_at timestamptz,
  approval_status text not null default 'pending_review',
  visibility_status text not null default 'private',
  parent_guardian_required boolean not null default false,
  admin_review_required boolean not null default true,
  is_junior_media boolean not null default false,
  media_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_assets_media_type_check
    check (
      media_type in (
        'profile_photo',
        'highlight_video',
        'highlight_thumbnail',
        'verification_document'
      )
    ),
  constraint media_assets_approval_status_check
    check (
      approval_status in (
        'pending_parent_approval',
        'pending_review',
        'parent_approved',
        'admin_approved',
        'rejected',
        'archived'
      )
    ),
  constraint media_assets_visibility_status_check
    check (
      visibility_status in (
        'private',
        'owner_only',
        'profile_only',
        'showcase_approved',
        'public_approved'
      )
    ),
  constraint media_assets_file_size_bytes_check
    check (file_size_bytes is null or file_size_bytes >= 0)
);

create index if not exists media_assets_owner_user_id_idx
  on public.media_assets (owner_user_id);

create index if not exists media_assets_athlete_profile_id_idx
  on public.media_assets (athlete_profile_id);

create index if not exists media_assets_highlight_id_idx
  on public.media_assets (highlight_id);

create index if not exists media_assets_media_type_idx
  on public.media_assets (media_type);

create index if not exists media_assets_approval_status_idx
  on public.media_assets (approval_status);

create index if not exists media_assets_visibility_status_idx
  on public.media_assets (visibility_status);

create index if not exists media_assets_is_junior_media_idx
  on public.media_assets (is_junior_media);

drop trigger if exists set_media_assets_updated_at on public.media_assets;

create trigger set_media_assets_updated_at
before update on public.media_assets
for each row
execute function public.set_media_assets_updated_at();

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.media_assets to authenticated;

alter table public.media_assets enable row level security;

drop policy if exists "media assets own select" on public.media_assets;
create policy "media assets own select"
on public.media_assets
for select
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "media assets own insert" on public.media_assets;
create policy "media assets own insert"
on public.media_assets
for insert
to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists "media assets own update" on public.media_assets;
create policy "media assets own update"
on public.media_assets
for update
to authenticated
using (owner_user_id = auth.uid() and visibility_status <> 'public_approved')
with check (owner_user_id = auth.uid());

drop policy if exists "media assets own delete" on public.media_assets;
create policy "media assets own delete"
on public.media_assets
for delete
to authenticated
using (
  owner_user_id = auth.uid()
  and visibility_status in ('private', 'owner_only')
  and approval_status in ('pending_parent_approval', 'pending_review', 'rejected', 'archived')
);

-- Metadata only in this phase. No file upload requirement exists yet.
-- No public read policy is added in this phase.
-- No unauthenticated reads are allowed.
-- No public media browsing is introduced in this phase.

notify pgrst, 'reload schema';
