# Supabase Schema Design

This document describes a proposed Supabase data model for My Sports Resume. It is designed to preserve the current product rules:
- professional sports resume platform
- no social messaging features
- parent and guardian control for under-18 athletes
- safe contact routing
- verified club and scout access

Notes:
- `auth.users` remains the source of truth for authentication
- `public.app_user_profiles` is the Phase 1 lightweight account table used to mirror auth role and account metadata safely
- `supabase/auth_phase_1.sql` is the focused SQL file to run first for account-only auth testing
- `public.athlete_profiles` is now the focused Phase 1 sports-data table for athlete profile save and load
- `supabase/athlete_profiles_phase_1.sql` is the focused SQL file for the first database-backed sports resume records
- `public.highlights` is now the focused Phase 1 table for highlight metadata save and load
- `supabase/highlights_phase_1.sql` is the focused SQL file for highlight metadata only in this phase
- `public.opportunities` is now the focused Phase 1 table for opportunity metadata save and load
- `supabase/opportunities_phase_1.sql` is the focused SQL file for opportunity metadata only in this phase
- `public.contact_requests` is now the focused Phase 1 table for structured contact-request metadata save and load
- `supabase/contact_requests_phase_1.sql` is the focused SQL file for request-record metadata only in this phase
- `public.shortlists` is now the focused Phase 1 table for shortlist metadata save and load
- `supabase/shortlists_phase_1.sql` is the focused SQL file for private shortlist workflow records only in this phase
- `public.admin_queue_items` is now the focused Phase 1 table for admin queue metadata save and load
- `supabase/admin_queues_phase_1.sql` is the focused SQL file for admin review-record metadata only in this phase
- `public.media_assets` is now the focused Phase 1 table for media metadata planning and save/load scaffolding
- `supabase/media_assets_phase_1.sql` is the focused SQL file for media metadata only in this phase
- `supabase/storage_phase_1_plan.sql` is a planning-only storage policy starter and does not enable public media access
- approval-safe media workflow Phase 1 is now active for images only:
  - private profile photos
  - private highlight thumbnails
  - junior approval required
  - admin review before broader visibility
  - no public URLs
  - no public media browsing
  - no highlight video uploads yet
- `public.users` is proposed as the app-facing profile table linked to `auth.users`
- the SQL draft uses `profile_references` instead of `references` to avoid reserved-word issues

## Core Tables

### `app_user_profiles`
- Purpose: lightweight Phase 1 account record for authenticated users before profile, highlight, and opportunity data migrate off localStorage
- Key fields:
  - `id`
  - `email`
  - `full_name`
  - `role`
  - `account_status`
  - `organisation_name`
  - `state`
  - `region`
- Relationships:
  - one-to-one with `auth.users`
  - future admin review and verification logic can reference this row for safe account context
- Junior safety notes:
  - this table should not store exact addresses
  - role values must clearly distinguish `junior_athlete` from `adult_athlete`
  - club and scout users still do not gain direct junior contact rights through account creation alone

### `users`
- Purpose: app-level user record linked to Supabase Auth
- Key fields:
  - `id`
  - `email`
  - `display_name`
  - `default_state_code`
  - `default_region_label`
  - `account_status`
- Relationships:
  - one-to-many with `user_roles`
  - one-to-many with `athlete_profiles`
  - one-to-many with `club_scout_accounts`
- Junior safety notes:
  - should not store exact address fields
  - parent and guardian users should remain distinct from junior athlete profile records

### `user_roles`
- Purpose: allow one authenticated user to hold one or more product roles
- Key fields:
  - `id`
  - `user_id`
  - `role`
  - `status`
  - `is_primary`
- Relationships:
  - many-to-one with `users`
- Junior safety notes:
  - explicit `parent_guardian` role is required for guardian-only actions

### `athlete_profiles`
- Purpose: core athlete identity and resume header information
- Phase 1 status:
  - this is the first sports-data table being migrated off localStorage
  - the current frontend writes common searchable fields into columns and keeps the full rich resume object in `profile_data`
  - public resume sharing is still local/demo until a later dedicated migration phase
- Key fields:
  - `id`
  - `owner_user_id`
  - `display_name`
  - `is_junior`
  - `age_group`
  - `sport_category`
  - `sport`
  - `sport_id`
  - `position_role`
  - `secondary_position_role`
  - `state`
  - `region`
  - `competition_level`
  - `team_club`
  - `team_club_status`
  - `contact_route`
  - `profile_status`
  - `visibility_status`
  - `completeness_score`
  - `profile_data`
- Relationships:
  - many-to-one with `auth.users` through `owner_user_id`
  - one-to-many with `achievements`
  - one-to-many with `stats`
  - one-to-many with `playing_history`
  - one-to-many with `profile_references`
  - one-to-one with `availability`
  - one-to-one with `profile_visibility`
  - one-to-many with `highlights`
- Junior safety notes:
  - no address fields
  - `contact_route` should be `parent_guardian` for juniors
  - no public select policy exists in Phase 1
  - clubs and scouts do not browse this table yet

### `parent_guardian_links`
- Purpose: link guardian accounts to junior athlete profiles
- Key fields:
  - `id`
  - `parent_user_id`
  - `athlete_profile_id`
  - `relationship_type`
  - `approval_status`
  - `is_primary_guardian`
- Relationships:
  - many-to-one with `users`
  - many-to-one with `athlete_profiles`
- Junior safety notes:
  - this table is a core control point for contact routing and approval checks

### `club_scout_accounts`
- Purpose: store organisation context for club, scout, school, and academy users
- Key fields:
  - `id`
  - `user_id`
  - `organisation_name`
  - `contact_name`
  - `role_title`
  - `sport_scope`
  - `state_code`
  - `region_label`
  - `verification_status`
- Relationships:
  - many-to-one with `users`
  - one-to-many with `opportunities`
  - one-to-many with `shortlists`
- Junior safety notes:
  - verification gates are required before broader discovery permissions

### `club_scout_verification_requests`
- Purpose: store verification applications before account verification is approved
- Key fields:
  - `id`
  - `user_id`
  - `organisation_name`
  - `contact_name`
  - `role_title`
  - `sports_text`
  - `state_code`
  - `region_label`
  - `email`
  - `verification_purpose`
  - `status`
- Relationships:
  - many-to-one with `users`
  - optional one-to-one or one-to-many review linkage with `admin_reviews`
- Junior safety notes:
  - verification quality directly affects who can search or request contact

### `admin_reviews`
- Purpose: generic audit and workflow record for admin decisions
- Key fields:
  - `id`
  - `review_type`
  - `target_table`
  - `target_id`
  - `reviewer_user_id`
  - `status`
  - `decision`
  - `notes`
- Relationships:
  - many-to-one with `users`
  - polymorphic linkage to profiles, highlights, opportunities, and verification requests
- Junior safety notes:
  - should record guardian-sensitive review decisions cleanly and auditable

## Sports and Directory Tables

### `sports_catalog`
- Purpose: canonical sports list for dropdowns, filters, and stat suggestions
- Key fields:
  - `id`
  - `name`
  - `category`
  - `supports_team_club`
  - `supports_individual`
  - `common_positions`
  - `common_stats`
  - `age_groups`
  - `competition_levels`
- Relationships:
  - one-to-many with `athlete_profiles`
  - one-to-many with `team_directory`
  - one-to-many with `opportunities`
- Junior safety notes:
  - none directly, but consistency improves safe filtering

### `team_directory`
- Purpose: verified or starter team and club directory records
- Key fields:
  - `id`
  - `sport_id`
  - `name`
  - `region_label`
  - `state_code`
  - `competition_name`
  - `competition_level`
  - `is_verified_directory_entry`
- Relationships:
  - many-to-one with `sports_catalog`
  - one-to-many with `athlete_profiles`
  - one-to-many with `opportunities`
- Junior safety notes:
  - helps reduce unsafe free-text ambiguity by anchoring club identity

### `custom_team_entries`
- Purpose: store user-created team, club, program, or squad labels when no directory match exists
- Key fields:
  - `id`
  - `created_by_user_id`
  - `athlete_profile_id`
  - `sport_id`
  - `name`
  - `region_label`
  - `state_code`
  - `competition_name`
  - `competition_level`
  - `verification_status`
- Relationships:
  - many-to-one with `users`
  - many-to-one with `athlete_profiles`
  - many-to-one with `sports_catalog`
- Junior safety notes:
  - custom entries should never imply verified status by default

## Resume and Profile Tables

### `achievements`
- Purpose: structured achievements for athlete resumes
- Key fields:
  - `id`
  - `athlete_profile_id`
  - `category`
  - `title`
  - `details`
  - `achieved_on`
  - `sort_order`
- Relationships:
  - many-to-one with `athlete_profiles`
- Junior safety notes:
  - public display must still follow profile visibility rules

### `stats`
- Purpose: flexible sport-aware stat storage
- Key fields:
  - `id`
  - `athlete_profile_id`
  - `label`
  - `value_text`
  - `stat_context`
  - `sort_order`
- Relationships:
  - many-to-one with `athlete_profiles`
- Junior safety notes:
  - no health-sensitive data should be forced here

### `playing_history`
- Purpose: timeline and pathway entries for club, school, academy, or representative history
- Key fields:
  - `id`
  - `athlete_profile_id`
  - `entry_type`
  - `organisation_name`
  - `competition_name`
  - `year_label`
  - `notes`
  - `is_current`
- Relationships:
  - many-to-one with `athlete_profiles`
- Junior safety notes:
  - school references should remain broad and not expose unsafe private detail

### `profile_references`
- Purpose: coach, club, or pathway reference records
- Key fields:
  - `id`
  - `athlete_profile_id`
  - `reference_name`
  - `reference_role`
  - `organisation_name`
  - `verification_status`
  - `is_public`
- Relationships:
  - many-to-one with `athlete_profiles`
- Junior safety notes:
  - do not expose personal phone or address fields on public resumes

### `availability`
- Purpose: structured availability and pathway interest preferences
- Key fields:
  - `athlete_profile_id`
  - `open_to_trials`
  - `open_to_academy`
  - `open_to_school_sport`
  - `open_to_representative_pathways`
  - `open_to_senior_signing`
  - `open_to_first_grade`
  - `open_to_reserve_grade`
  - `willing_to_relocate`
  - `preferred_locations`
- Relationships:
  - one-to-one with `athlete_profiles`
- Junior safety notes:
  - junior opportunity settings must never bypass guardian routing

### `profile_visibility`
- Purpose: share, approval, and public-visibility state
- Key fields:
  - `athlete_profile_id`
  - `visibility_status`
  - `parent_approval_status`
  - `admin_verification_status`
  - `share_enabled`
  - `showcase_approved`
- Relationships:
  - one-to-one with `athlete_profiles`
- Junior safety notes:
  - this table is a critical gate for public resume exposure

## Media and Highlights Tables

### `highlights`
- Purpose: structured resume highlight records
- Phase 1 status:
  - highlight metadata is the second sports-data type moving behind a guarded Supabase data-service boundary
  - the current frontend writes common searchable fields into columns and keeps the full rich local object in `highlight_data`
  - this phase does not add real video uploads or Supabase Storage
  - no public or scout-facing database-wide highlight discovery exists yet
- Key fields:
  - `id`
  - `owner_user_id`
  - `athlete_profile_id`
  - `title`
  - `sport`
  - `sport_id`
  - `highlight_type`
  - `match_event`
  - `competition`
  - `event_date`
  - `opponent`
  - `position_played`
  - `description`
  - `video_url`
  - `thumbnail_url`
  - `verification_source`
  - `approval_status`
  - `showcase_status`
  - `is_featured`
  - `boost_count`
  - `highlight_data`
- Relationships:
  - many-to-one with `auth.users` through `owner_user_id`
  - many-to-one with `athlete_profiles`
  - optional many-to-one with `sports_catalog`
- Junior safety notes:
  - junior highlights must remain private until guardian approval
  - no public select policy exists in Phase 1
  - showcase approval should not bypass parent or admin approval checks

### `highlight_approvals`
- Purpose: review trail for highlight approval actions
- Key fields:
  - `id`
  - `highlight_id`
  - `reviewer_user_id`
  - `reviewer_role`
  - `decision`
  - `notes`
  - `created_at`
- Relationships:
  - many-to-one with `highlights`
  - many-to-one with `users`
- Junior safety notes:
  - parent or guardian approval records should be explicit and queryable

### `highlight_boosts`
- Purpose: log boost actions independently from the display counter
- Key fields:
  - `id`
  - `highlight_id`
  - `actor_user_id`
  - `actor_role`
  - `created_at`
- Relationships:
  - many-to-one with `highlights`
  - many-to-one with `users`
- Junior safety notes:
  - public-facing junior boost counts may remain hidden even if events are logged

### `media_assets`
- Purpose: store metadata for future profile photos, highlight videos, highlight thumbnails, and later verification documents
- Phase 1 status:
  - media metadata is now active behind a guarded Supabase service boundary
  - approval-safe image workflow Phase 1 is active for private profile photos and private highlight thumbnails only
  - highlight video upload remains disabled
  - all active storage buckets stay private
  - no public unauthenticated media access exists yet
  - no public media URLs, public bucket browsing, or database-wide media discovery exist yet
- Key fields:
  - `id`
  - `owner_user_id`
  - `athlete_profile_id`
  - `highlight_id`
  - `related_queue_item_id`
  - `media_type`
  - `bucket_name`
  - `storage_path`
  - `original_filename`
  - `mime_type`
  - `file_size_bytes`
  - `public_url`
  - `signed_url_expires_at`
  - `approval_status`
  - `visibility_status`
  - `parent_guardian_required`
  - `admin_review_required`
  - `is_junior_media`
  - `media_data`
- Relationships:
  - many-to-one with `auth.users` through `owner_user_id`
  - many-to-one with `athlete_profiles`
  - optional many-to-one with `highlights`
  - optional many-to-one with `admin_queue_items`
- Junior safety notes:
  - all junior media should be private and approval-gated by default
  - parent and guardian approval should be required before broader visibility for junior media
  - current signed delivery is owner-only preview access, not public resume delivery
  - real upload delivery should rely on private buckets and signed access only after approval rules are in place

## Discovery Tables

### `contact_requests`
- Purpose: safe structured contact records
- Phase 1 status:
  - contact-request metadata is the fourth sports-data type moving behind a guarded Supabase data-service boundary
  - this phase stores structured request records only, not messages, inbox threads, or conversations
  - the current frontend writes common searchable fields into columns and keeps the full rich local object in `request_context`
  - no public or unauthenticated reads exist yet
  - no messaging-thread, chat, or inbox-style model is introduced
- Key fields:
  - `id`
  - `requester_user_id`
  - `athlete_owner_user_id`
  - `athlete_profile_id`
  - `opportunity_id`
  - `requester_name`
  - `requester_email`
  - `requester_role`
  - `requester_organisation`
  - `athlete_display_name`
  - `athlete_is_junior`
  - `contact_route`
  - `request_type`
  - `request_status`
  - `safety_status`
  - `parent_guardian_required`
  - `admin_review_required`
  - `no_direct_messaging`
  - `request_reason`
  - `request_context`
- Relationships:
  - many-to-one with `auth.users` through `requester_user_id`
  - many-to-one with `auth.users` through `athlete_owner_user_id`
  - many-to-one with `athlete_profiles`
  - optional many-to-one with `opportunities`
- Junior safety notes:
  - juniors must route to parent and guardian, never directly to athlete
  - `no_direct_messaging` stays true by default
  - exact addresses are not stored or exposed
  - no public select policy exists in Phase 1

### `opportunities`
- Purpose: structured recruitment and pathway opportunities
- Phase 1 status:
  - opportunity metadata is the third sports-data type moving behind a guarded Supabase data-service boundary
  - the current frontend writes common searchable fields into columns and keeps the full rich local object in `opportunity_data`
- local/demo opportunities can still render while signed-in owned opportunities save to Supabase
- no public or unauthenticated database-wide opportunity browsing exists yet
- contact requests now have their own focused Phase 1 metadata table and service boundary
- Key fields:
  - `id`
  - `owner_user_id`
  - `organisation_name`
  - `contact_role`
  - `sport_category`
  - `sport`
  - `sport_id`
  - `position_role`
  - `age_group`
  - `is_junior_opportunity`
  - `junior_or_senior`
  - `state`
  - `region`
  - `competition_level`
  - `opportunity_type`
  - `title`
  - `description`
  - `requirements`
  - `verification_status`
  - `opportunity_status`
  - `contact_route`
  - `visibility_status`
  - `closing_date`
  - `opportunity_data`
- Relationships:
  - many-to-one with `auth.users` through `owner_user_id`
  - one-to-many with `opportunity_interests`
  - one-to-many with `contact_requests`
- Junior safety notes:
  - junior opportunity visibility and interest flows must still respect guardian routing
  - no public select policy exists in Phase 1
  - no database-wide opportunity discovery policy exists yet

### `opportunity_interests`
- Purpose: structured athlete responses to opportunities
- Key fields:
  - `id`
  - `opportunity_id`
  - `athlete_profile_id`
  - `route_to_role`
  - `status`
  - `created_at`
- Relationships:
  - many-to-one with `opportunities`
  - many-to-one with `athlete_profiles`
- Junior safety notes:
  - juniors should create records that route to guardian review, not direct organisation contact

### `shortlists`
- Purpose: private club, scout, and admin saved-athlete workflow records
- Phase 1 status:
  - shortlist metadata is now the fifth sports-data type moving behind a guarded Supabase data-service boundary
  - the current frontend writes common searchable fields into columns and keeps the full rich local object in `shortlist_data`
  - this phase does not add athlete notifications, follower behavior, inboxes, or messaging threads
  - no public or unauthenticated shortlist browsing exists yet
- Key fields:
  - `id`
  - `owner_user_id`
  - `athlete_profile_id`
  - `athlete_owner_user_id`
  - `athlete_display_name`
  - `athlete_sport`
  - `athlete_sport_id`
  - `athlete_position_role`
  - `athlete_age_group`
  - `athlete_state`
  - `athlete_region`
  - `shortlist_type`
  - `shortlist_status`
  - `source_context`
  - `notes`
  - `no_direct_messaging`
  - `shortlist_data`
  - `created_at`
- Relationships:
  - many-to-one with `auth.users` through `owner_user_id`
  - many-to-one with `athlete_profiles`
  - optional many-to-one with `auth.users` through `athlete_owner_user_id`
- Junior safety notes:
  - shortlisting does not create contact permission by itself
  - shortlist records stay private to the signed-in owner in Phase 1
  - no athlete notification is triggered in this phase
  - no public select policy exists in Phase 1
  - no follow or follower behavior is introduced

### `admin_queue_items`
- Purpose: structured admin and review queue records for moderation, verification, and trust workflows
- Phase 1 status:
  - admin queue metadata is now the sixth sports-data workflow moving behind a guarded Supabase data-service boundary
  - the current frontend writes common searchable fields into columns and keeps the full rich local object in `queue_data`
  - this phase stores review records only, not inboxes, conversations, or messaging threads
  - no public or unauthenticated queue browsing exists yet
  - admin-wide cross-account RLS can remain future work until a safe app-role policy is ready
- Key fields:
  - `id`
  - `owner_user_id`
  - `related_user_id`
  - `related_athlete_profile_id`
  - `related_highlight_id`
  - `related_opportunity_id`
  - `related_contact_request_id`
  - `related_shortlist_id`
  - `queue_type`
  - `queue_status`
  - `priority`
  - `review_reason`
  - `review_notes`
  - `source_context`
  - `admin_decision`
  - `admin_decision_by`
  - `admin_decision_at`
  - `no_direct_messaging`
  - `queue_data`
  - `created_at`
  - `updated_at`
- Relationships:
  - many-to-one with `auth.users` through `owner_user_id`
  - optional many-to-one with `auth.users` through `related_user_id`
  - optional many-to-one with `athlete_profiles`
  - optional many-to-one with `highlights`
  - optional many-to-one with `opportunities`
  - optional many-to-one with `contact_requests`
  - optional many-to-one with `shortlists`
- Junior safety notes:
  - admin queue items do not expose junior contact details publicly
  - `no_direct_messaging` stays true by default
  - no public select policy exists in Phase 1
  - no inbox or conversation model is introduced

## Safety and Audit Tables

### `moderation_flags`
- Purpose: moderation and trust review signals
- Key fields:
  - `id`
  - `target_table`
  - `target_id`
  - `flagged_by_user_id`
  - `reason`
  - `status`
  - `notes`
- Relationships:
  - many-to-one with `users`
  - polymorphic reference to profiles, highlights, opportunities, or media
- Junior safety notes:
  - should support urgent visibility lock or media restriction workflows

### `audit_log`
- Purpose: append-only operational history for sensitive actions
- Key fields:
  - `id`
  - `actor_user_id`
  - `actor_role`
  - `entity_type`
  - `entity_id`
  - `action`
  - `metadata`
  - `created_at`
- Relationships:
  - many-to-one with `users`
- Junior safety notes:
  - use for parent approval, admin review, and visibility changes

## Approval and Display Rules Phase

- `media_assets` now acts as the approval and visibility source of truth for private media display
- signed-in owner preview rules come from:
  - `approval_status`
  - `visibility_status`
  - `parent_guardian_required`
  - `admin_review_required`
- approved media can display in signed-in owner profile/resume views through signed URLs only
- public unauthenticated media display remains disabled
- `public_url` remains empty in this phase
- no public media feed or public video feed is introduced
