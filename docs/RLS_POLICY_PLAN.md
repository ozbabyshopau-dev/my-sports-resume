# Row Level Security Policy Plan

This document outlines the intended Supabase Row Level Security approach for My Sports Resume.

## Guiding Rules

- The platform is not social media
- No chat
- No comments
- No DMs
- No followers
- No user-to-user messaging
- Under-18 contact routes to parent or guardian
- Exact addresses are never stored or displayed
- Public resume views expose only approved and shareable fields

## Role Model

Application roles:
- athlete
- parent_guardian
- club_scout
- admin

Phase 1 auth-account roles:
- junior_athlete
- parent_guardian
- adult_athlete
- club_scout
- admin

Implementation note:
- Supabase Auth authenticates the user
- `user_roles` determines app permissions
- policies should check both authenticated identity and app role membership

## Core Policy Direction

### `users`
- A user can view and update their own `public.users` row
- Admin can view all user rows
- Non-admin users cannot browse arbitrary user records

### `app_user_profiles`
- A signed-in user can select their own `app_user_profiles` row
- A signed-in user can insert or update only their own `app_user_profiles` row
- No public or anonymous access should exist
- Admin cross-account access should be added later, not opened in Phase 1 by default
- If the table is unavailable during scaffold rollout, the frontend may temporarily fall back to auth metadata, but production policy should still rely on the table once migrations are applied
- The focused SQL entry point for this phase is `supabase/auth_phase_1.sql`

### `user_roles`
- Users can view their own role records
- Only admins or controlled backend functions can assign or elevate roles
- No user can self-assign admin or verified scout privileges through direct table writes

## Athlete Profile Policies

### `athlete_profiles`
- Athletes can create, view, and edit their own draft profile
- Adult athletes can manage their own profile lifecycle subject to review states
- Junior athletes can manage draft content, but visibility expansion must still depend on guardian and admin state
- Phase 1 currently grants owner-only select, insert, update, and delete policies through `supabase/athlete_profiles_phase_1.sql`
- No public read policy exists yet
- No club or scout browsing policy exists yet
- Parents and guardians can view linked child profiles
- Parents and guardians can update guardian-controlled fields for linked child profiles
- Verified clubs and scouts can read only profiles that are scout-visible or otherwise approved for discovery
- Public and anonymous access should be limited to share-enabled profiles only

### `profile_visibility`
- Athletes can read their own visibility record
- Adult athletes can update allowable self-service visibility transitions if product policy permits
- Parents and guardians can update visibility for linked junior profiles
- Admins can update verification and final visibility states
- Clubs and scouts can never update visibility

### `availability`
- Athletes can manage their own availability data
- Parents and guardians can manage linked junior availability data
- Clubs and scouts can read only if the parent profile is scout-visible

## Parent and Guardian Policies

### `parent_guardian_links`
- Parents and guardians can view links where they are the guardian
- Linked junior athletes can view that guardian linkage exists, but not necessarily all guardian private details
- Admins can manage and audit link records

### Junior approval enforcement
- Junior profiles require parent and guardian approval before public share
- Junior highlights require parent and guardian approval before public showcase
- Junior opportunity interests create routed review records rather than direct organisation contact

## Club and Scout Policies

### `club_scout_accounts`
- Club and scout users can view and update their own organisation account row
- Verification fields should be admin-controlled
- Unverified club and scout accounts should not receive broad discovery access

### `club_scout_verification_requests`
- Club and scout users can create and view their own verification requests
- Only admins can approve, reject, or mark reviewed

### Search and discovery permissions
- Verified clubs and scouts can search profiles that are:
  - scout-visible
  - approved for discovery
  - not private
- They cannot read hidden junior profiles
- They cannot directly contact junior athletes

## Highlight and Media Policies

### `highlights`
- Athletes can create and edit highlights attached to their own profile
- Phase 1 currently grants owner-only select, insert, update, and delete policies through `supabase/highlights_phase_1.sql`
- Phase 1 is metadata only: `video_url` and `thumbnail_url` remain metadata fields, with no Supabase Storage rollout yet
- No public read policy exists yet
- No scout or public database-wide highlight browsing policy exists yet
- Parents and guardians can read and approve linked junior highlights
- Clubs and scouts can read only profile-visible or showcase-approved highlight records allowed by profile visibility
- Junior highlights without guardian approval must not be publicly queryable

### `highlight_approvals`
- Parents and guardians can create approval records for linked junior highlights
- Admins can create approval records for admin-reviewed highlights
- Athletes can read approval history on their own highlights
- Clubs and scouts should not see internal approval notes beyond public-facing status

### `media_assets`
- Phase 1 currently grants owner-only select, insert, update, and delete policies through `supabase/media_assets_phase_1.sql`
- Private Supabase Storage Phase 1 adds owner-only bucket access through `supabase/storage_private_phase_1.sql`
- Approval-safe media workflow Phase 1 supports only:
  - private profile photos
  - private highlight thumbnails
- Junior media remains parent/guardian approval-gated
- Adult media remains admin-review gated before broader visibility
- No public delivery, no public URLs, and no unauthenticated media access exist in this phase
- Signed-in owners can read their own media metadata rows
- Signed-in owners can insert their own media metadata rows
- Signed-in owners can update their own media metadata rows while the asset is not in `public_approved`
- Signed-in owners can delete or archive only their own private or pending media metadata rows
- No public or unauthenticated media metadata read policy exists
- No public bucket policy, public URL policy, or database-wide media browsing policy exists in this phase
- Authenticated owners can insert, read, update, and delete only their own objects in:
  - `msr-profile-photos`
  - `msr-highlight-thumbnails`
- Private Highlight Video Upload Phase 1 now adds an owner-only bucket path through `supabase/video_storage_private_phase_1.sql`
  - `msr-highlight-videos`
  - `video/mp4`, `video/quicktime`, and `video/webm` only
  - `100 MB` early signed-in owner-test limit
- Highlight-video object policies stay owner-scoped for insert, read, update, and delete only
- No public or unauthenticated read policy exists for `msr-highlight-videos`
- Signed preview access remains owner or future reviewer scoped only
- Video uploads are private owner test only in this phase
- Parent, guardian, and admin cross-account media access can be added later once the private bucket and signed-URL model is fully implemented

## Contact and Opportunity Policies

### `contact_requests`
- Phase 1 currently grants owner-scoped and route-scoped policies through `supabase/contact_requests_phase_1.sql`
- A signed-in requester can select request rows they created
- A signed-in athlete owner can select request rows attached to their own athlete profile
- A signed-in requester can insert a request row only for themselves
- A signed-in requester can update or cancel only their own pending request rows
- A signed-in athlete owner can update request status on rows attached to their own athlete profile
- No public read policy exists yet
- No unauthenticated read policy exists yet
- No messaging-thread, inbox, or conversation policies exist
- Clubs and scouts cannot directly contact juniors outside the routed request path

### `opportunities`
- Phase 1 currently grants owner-only select, insert, update, and draft/private delete policies through `supabase/opportunities_phase_1.sql`
- Opportunity metadata only is moving behind a guarded Supabase boundary in this phase
- No public read policy exists yet
- No unauthenticated browsing exists yet
- No club or scout database-wide opportunity browsing exists yet beyond owned rows
- Junior opportunity routing must remain parent/guardian safe
- Public access, if any, should remain limited and carefully filtered in a later phase

### `opportunity_interests`
- Athletes can create interest records for themselves
- Juniors create records that route to parent and guardian review
- Parents and guardians can read junior interest records for linked profiles
- Clubs and scouts can read interest records on their own opportunities
- Admins can read all

### `shortlists`
- Phase 1 currently grants owner-only select, insert, update, and delete policies through `supabase/shortlists_phase_1.sql`
- Shortlist rows are private workflow records owned by the signed-in club, scout, or admin account that created them
- Athletes do not get read access to another organisation's shortlist rows in this phase
- No public or unauthenticated shortlist read policy exists
- No follow, notification, inbox, or messaging-thread behavior is introduced through shortlist records

### `admin_queue_items`
- Phase 1 currently grants owner-only select, insert, update, and delete policies through `supabase/admin_queues_phase_1.sql`
- Admin queue rows are structured review records only, not inbox items or conversation threads
- Signed-in users can create and review queue rows they own or that were generated from their own content
- No public or unauthenticated admin queue read policy exists
- Admin-wide cross-account review policies can remain future work until app-role-aware RLS is safely implemented
- No direct messaging, inbox, or conversation-thread behavior is introduced through admin queue records

## Public Resume Policies

Public resume access should be handled by either:
- tightly scoped anonymous read policies, or
- server-side access through Edge Functions

Recommended public rules:
- only approved share-enabled profiles are visible publicly
- private profiles are not visible publicly
- pending or draft profiles are not publicly queryable unless an intentional preview path is created
- only approved public highlight records appear
- no guardian private details are shown
- no exact address fields exist

## Admin Policies

Admins can:
- review pending profiles
- review pending highlights
- review pending opportunities
- process verification requests
- inspect moderation flags
- write audit entries

Admin writes should be limited to:
- authenticated users with the `admin` app role
- ideally through service-role functions or Edge Functions for sensitive transitions

## Recommended Implementation Pattern

Use a mixed approach:
- simple ownership reads and writes in direct RLS policies
- sensitive workflow transitions through RPCs or Edge Functions

Good candidates for server-side controlled actions:
- guardian approval transitions
- admin verification decisions
- signed public resume resolution
- signed owner media URL creation
- moderation lock actions

## Data Minimization Rules

- Do not store exact home addresses
- Store state and region only
- Keep guardian contact details private
- Keep junior media private until approval
- Keep club and scout verification private until approved

## Approval and Display Rules Phase

- owner-scoped media reads remain the default path for private media assets
- signed owner previews use signed URLs, not public bucket access
- parent/guardian approval remains a metadata transition, not a public-access grant
- admin review metadata controls can stay owner-scoped and demo-safe until broader admin-role RLS is designed safely
- public unauthenticated media access remains disabled
- no public read policy should be added for private image or video media in this phase
