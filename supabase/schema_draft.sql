-- My Sports Resume
-- Draft Supabase schema for future backend rollout
-- This file is for planning only and is not wired into the current app.

create extension if not exists pgcrypto;

create schema if not exists public;

create type public.app_role as enum (
  'athlete',
  'parent_guardian',
  'club_scout',
  'admin'
);

create type public.record_status as enum (
  'draft',
  'pending',
  'approved',
  'rejected',
  'reviewed',
  'archived'
);

create type public.profile_status as enum (
  'draft',
  'pending_parent_approval',
  'pending_verification',
  'profile_approved_by_parent',
  'showcase_approved',
  'private_awaiting_parent_approval'
);

create type public.visibility_status as enum (
  'private',
  'club_verified',
  'scout_visible',
  'showcase_approved'
);

create type public.contact_route as enum (
  'athlete',
  'parent_guardian'
);

create type public.verification_status as enum (
  'unverified',
  'pending_admin_verification',
  'admin_reviewed',
  'verified_organisation',
  'rejected'
);

create type public.request_type as enum (
  'contact_request',
  'opportunity_interest'
);

create type public.request_status as enum (
  'pending_review',
  'approved',
  'rejected',
  'closed'
);

create type public.highlight_approval_status as enum (
  'pending_parent_approval',
  'pending_admin_review',
  'parent_approved',
  'coach_verified',
  'club_verified',
  'admin_approved',
  'admin_reviewed',
  'request_changes',
  'rejected'
);

create type public.highlight_showcase_status as enum (
  'private',
  'profile_only',
  'showcase_requested',
  'showcase_approved'
);

create type public.highlight_verification_source as enum (
  'parent',
  'coach',
  'club',
  'admin',
  'unverified'
);

create type public.opportunity_type as enum (
  'club_recruitment',
  'first_grade_signing',
  'reserve_grade_signing',
  'academy_trial',
  'school_sport_opportunity',
  'representative_trial',
  'development_squad',
  'training_invite',
  'coach_review'
);

create type public.playing_history_type as enum (
  'current_team',
  'previous_team',
  'representative',
  'school_sport',
  'academy_pathway'
);

create type public.media_visibility_class as enum (
  'private',
  'profile_visible',
  'public_resume',
  'showcase'
);

create type public.media_moderation_status as enum (
  'uploaded',
  'pending_parent_approval',
  'pending_admin_review',
  'approved_profile_only',
  'approved_showcase',
  'rejected',
  'flagged'
);

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  display_name text,
  default_state_code text,
  default_region_label text,
  account_status public.record_status not null default 'approved',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

alter table if exists public.app_user_profiles enable row level security;

create policy "app_user_profiles_select_own"
on public.app_user_profiles
for select
to authenticated
using (auth.uid() = id);

create policy "app_user_profiles_insert_own"
on public.app_user_profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "app_user_profiles_update_own"
on public.app_user_profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Draft admin policy for a later phase:
-- create policy "app_user_profiles_admin_all"
-- on public.app_user_profiles
-- for all
-- to authenticated
-- using (
--   exists (
--     select 1
--     from public.app_user_profiles profile
--     where profile.id = auth.uid()
--       and profile.role = 'admin'
--   )
-- )
-- with check (
--   exists (
--     select 1
--     from public.app_user_profiles profile
--     where profile.id = auth.uid()
--       and profile.role = 'admin'
--   )
-- );

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  role public.app_role not null,
  status public.record_status not null default 'approved',
  is_primary boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, role)
);

create table if not exists public.sports_catalog (
  id text primary key,
  name text not null,
  category text not null,
  common_positions jsonb not null default '[]'::jsonb,
  common_stats jsonb not null default '[]'::jsonb,
  age_groups jsonb not null default '[]'::jsonb,
  competition_levels jsonb not null default '[]'::jsonb,
  supports_team_club boolean not null default true,
  supports_individual boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_directory (
  id uuid primary key default gen_random_uuid(),
  sport_id text not null references public.sports_catalog (id),
  name text not null,
  region_label text not null,
  state_code text not null check (char_length(state_code) between 2 and 4),
  competition_name text,
  competition_level text,
  is_verified_directory_entry boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.athlete_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  display_name text not null,
  is_junior boolean not null default true,
  age_group text not null,
  sport_id text not null references public.sports_catalog (id),
  position_role text,
  secondary_position_role text,
  state_code text not null check (char_length(state_code) between 2 and 4),
  region_label text not null,
  current_team_label text,
  competition_level text,
  main_competition text,
  contact_route public.contact_route not null,
  profile_status public.profile_status not null default 'draft',
  completeness_score integer not null default 0 check (completeness_score between 0 and 100),
  completeness_label text not null default 'Draft',
  about_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.custom_team_entries (
  id uuid primary key default gen_random_uuid(),
  created_by_user_id uuid not null references public.users (id) on delete cascade,
  athlete_profile_id uuid references public.athlete_profiles (id) on delete cascade,
  sport_id text not null references public.sports_catalog (id),
  name text not null,
  region_label text,
  state_code text check (state_code is null or char_length(state_code) between 2 and 4),
  competition_name text,
  competition_level text,
  verification_status public.verification_status not null default 'unverified',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.parent_guardian_links (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null references public.users (id) on delete cascade,
  athlete_profile_id uuid not null references public.athlete_profiles (id) on delete cascade,
  relationship_type text,
  approval_status public.record_status not null default 'pending',
  is_primary_guardian boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parent_user_id, athlete_profile_id)
);

create table if not exists public.club_scout_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  organisation_name text not null,
  contact_name text,
  role_title text,
  sport_scope text,
  state_code text check (state_code is null or char_length(state_code) between 2 and 4),
  region_label text,
  verification_status public.verification_status not null default 'pending_admin_verification',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, organisation_name)
);

create table if not exists public.club_scout_verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  organisation_name text not null,
  contact_name text not null,
  role_title text,
  sports_text text,
  state_code text,
  region_label text,
  email text,
  verification_purpose text not null,
  status public.record_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.playing_history (
  id uuid primary key default gen_random_uuid(),
  athlete_profile_id uuid not null references public.athlete_profiles (id) on delete cascade,
  entry_type public.playing_history_type not null,
  organisation_name text not null,
  competition_name text,
  year_label text,
  notes text,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  athlete_profile_id uuid not null references public.athlete_profiles (id) on delete cascade,
  category text not null,
  title text not null,
  details text,
  achieved_on date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stats (
  id uuid primary key default gen_random_uuid(),
  athlete_profile_id uuid not null references public.athlete_profiles (id) on delete cascade,
  label text not null,
  value_text text not null,
  stat_context text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_references (
  id uuid primary key default gen_random_uuid(),
  athlete_profile_id uuid not null references public.athlete_profiles (id) on delete cascade,
  reference_name text not null,
  reference_role text,
  organisation_name text,
  verification_status public.verification_status not null default 'unverified',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.availability (
  athlete_profile_id uuid primary key references public.athlete_profiles (id) on delete cascade,
  open_to_trials boolean not null default false,
  open_to_academy boolean not null default false,
  open_to_school_sport boolean not null default false,
  open_to_representative_pathways boolean not null default false,
  open_to_senior_signing boolean not null default false,
  open_to_first_grade boolean not null default false,
  open_to_reserve_grade boolean not null default false,
  willing_to_relocate boolean not null default false,
  preferred_locations text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_visibility (
  athlete_profile_id uuid primary key references public.athlete_profiles (id) on delete cascade,
  visibility_status public.visibility_status not null default 'private',
  parent_approval_status public.record_status not null default 'pending',
  admin_verification_status public.record_status not null default 'pending',
  share_enabled boolean not null default false,
  showcase_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users (id) on delete cascade,
  athlete_profile_id uuid references public.athlete_profiles (id) on delete cascade,
  bucket_name text not null,
  object_path text not null,
  mime_type text not null,
  byte_size bigint not null default 0 check (byte_size >= 0),
  visibility_class public.media_visibility_class not null default 'private',
  moderation_status public.media_moderation_status not null default 'uploaded',
  signed_url_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket_name, object_path)
);

create table if not exists public.highlights (
  id uuid primary key default gen_random_uuid(),
  athlete_profile_id uuid not null references public.athlete_profiles (id) on delete cascade,
  sport_id text not null references public.sports_catalog (id),
  title text not null,
  highlight_type text,
  match_event text,
  competition_name text,
  occurred_on date,
  opponent_name text,
  position_played text,
  description text,
  verification_source public.highlight_verification_source not null default 'unverified',
  approval_status public.highlight_approval_status not null default 'pending_admin_review',
  showcase_status public.highlight_showcase_status not null default 'private',
  is_featured boolean not null default false,
  boost_count integer not null default 0 check (boost_count >= 0),
  video_asset_id uuid references public.media_assets (id) on delete set null,
  thumbnail_asset_id uuid references public.media_assets (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.highlight_approvals (
  id uuid primary key default gen_random_uuid(),
  highlight_id uuid not null references public.highlights (id) on delete cascade,
  reviewer_user_id uuid not null references public.users (id) on delete cascade,
  reviewer_role public.app_role not null,
  decision public.highlight_approval_status not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.highlight_boosts (
  id uuid primary key default gen_random_uuid(),
  highlight_id uuid not null references public.highlights (id) on delete cascade,
  actor_user_id uuid references public.users (id) on delete set null,
  actor_role public.app_role,
  created_at timestamptz not null default now()
);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  created_by_user_id uuid references public.users (id) on delete set null,
  club_scout_account_id uuid references public.club_scout_accounts (id) on delete set null,
  organisation_name text not null,
  contact_role_title text,
  sport_id text not null references public.sports_catalog (id),
  position_role text,
  age_group text not null,
  is_junior_opportunity boolean not null default false,
  state_code text not null check (char_length(state_code) between 2 and 4),
  region_label text not null,
  competition_level text,
  opportunity_type public.opportunity_type not null,
  description text not null,
  requirements text,
  verification_status public.verification_status not null default 'pending_admin_verification',
  closing_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.opportunity_interests (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  athlete_profile_id uuid not null references public.athlete_profiles (id) on delete cascade,
  route_to_role public.contact_route not null,
  status public.request_status not null default 'pending_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (opportunity_id, athlete_profile_id)
);

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  created_by_user_id uuid references public.users (id) on delete set null,
  created_by_role public.app_role not null,
  athlete_profile_id uuid not null references public.athlete_profiles (id) on delete cascade,
  routed_to_user_id uuid references public.users (id) on delete set null,
  routed_to_role public.contact_route not null,
  opportunity_id uuid references public.opportunities (id) on delete set null,
  request_type public.request_type not null default 'contact_request',
  status public.request_status not null default 'pending_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shortlists (
  id uuid primary key default gen_random_uuid(),
  club_scout_account_id uuid not null references public.club_scout_accounts (id) on delete cascade,
  athlete_profile_id uuid not null references public.athlete_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (club_scout_account_id, athlete_profile_id)
);

create table if not exists public.moderation_flags (
  id uuid primary key default gen_random_uuid(),
  target_table text not null,
  target_id uuid not null,
  flagged_by_user_id uuid references public.users (id) on delete set null,
  reason text not null,
  status public.record_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_reviews (
  id uuid primary key default gen_random_uuid(),
  review_type text not null,
  target_table text not null,
  target_id uuid not null,
  reviewer_user_id uuid references public.users (id) on delete set null,
  status public.record_status not null default 'pending',
  decision text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users (id) on delete set null,
  actor_role public.app_role,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_roles_user_id on public.user_roles (user_id);
create index if not exists idx_user_roles_role on public.user_roles (role);
create index if not exists idx_app_user_profiles_role on public.app_user_profiles (role);
create index if not exists idx_app_user_profiles_email on public.app_user_profiles (email);
create index if not exists idx_app_user_profiles_account_status on public.app_user_profiles (account_status);
create index if not exists idx_team_directory_sport_state on public.team_directory (sport_id, state_code);
create index if not exists idx_athlete_profiles_user_id on public.athlete_profiles (user_id);
create index if not exists idx_athlete_profiles_sport_id on public.athlete_profiles (sport_id);
create index if not exists idx_athlete_profiles_junior_state on public.athlete_profiles (is_junior, state_code);
create index if not exists idx_athlete_profiles_competition_level on public.athlete_profiles (competition_level);
create index if not exists idx_parent_guardian_links_parent on public.parent_guardian_links (parent_user_id);
create index if not exists idx_parent_guardian_links_athlete on public.parent_guardian_links (athlete_profile_id);
create index if not exists idx_club_scout_accounts_user on public.club_scout_accounts (user_id);
create index if not exists idx_club_scout_accounts_verification on public.club_scout_accounts (verification_status);
create index if not exists idx_verification_requests_user on public.club_scout_verification_requests (user_id);
create index if not exists idx_playing_history_profile on public.playing_history (athlete_profile_id, entry_type);
create index if not exists idx_achievements_profile on public.achievements (athlete_profile_id, category);
create index if not exists idx_stats_profile on public.stats (athlete_profile_id);
create index if not exists idx_references_profile on public.profile_references (athlete_profile_id);
create index if not exists idx_profile_visibility_status on public.profile_visibility (visibility_status, share_enabled);
create index if not exists idx_media_assets_profile on public.media_assets (athlete_profile_id);
create index if not exists idx_media_assets_visibility on public.media_assets (visibility_class, moderation_status);
create index if not exists idx_highlights_profile on public.highlights (athlete_profile_id);
create index if not exists idx_highlights_showcase on public.highlights (showcase_status, approval_status);
create index if not exists idx_highlights_featured on public.highlights (athlete_profile_id, is_featured);
create index if not exists idx_highlight_approvals_highlight on public.highlight_approvals (highlight_id);
create index if not exists idx_highlight_boosts_highlight on public.highlight_boosts (highlight_id);
create index if not exists idx_opportunities_sport_state on public.opportunities (sport_id, state_code);
create index if not exists idx_opportunities_verification on public.opportunities (verification_status);
create index if not exists idx_opportunities_junior on public.opportunities (is_junior_opportunity, age_group);
create index if not exists idx_opportunity_interests_opportunity on public.opportunity_interests (opportunity_id);
create index if not exists idx_contact_requests_athlete on public.contact_requests (athlete_profile_id);
create index if not exists idx_contact_requests_route on public.contact_requests (routed_to_role, status);
create index if not exists idx_contact_requests_creator on public.contact_requests (created_by_user_id);
create index if not exists idx_shortlists_account on public.shortlists (club_scout_account_id);
create index if not exists idx_moderation_flags_target on public.moderation_flags (target_table, target_id);
create index if not exists idx_admin_reviews_target on public.admin_reviews (target_table, target_id);
create index if not exists idx_admin_reviews_status on public.admin_reviews (status);
create index if not exists idx_audit_log_entity on public.audit_log (entity_type, entity_id);
create index if not exists idx_audit_log_actor on public.audit_log (actor_user_id, created_at desc);
