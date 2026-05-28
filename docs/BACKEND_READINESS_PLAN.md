# Backend Readiness Plan

## Product Summary

My Sports Resume is a professional athlete resume and recruitment platform for:
- Athletes
- Parents and guardians
- Clubs
- Scouts
- Coaches
- Schools
- Academies
- Admin and demo reviewers

The product is intentionally not social media. The platform remains focused on:
- Verified sports resumes
- Highlights as resume evidence
- Safe contact requests
- Parent and guardian control for under-18 athletes
- Recruitment and discovery workflows

The current app already supports:
- Role-based onboarding
- Athlete resume creation
- Highlight management
- Parent approval flows
- Admin review queues
- Opportunities board
- Shortlist and interest routing
- Public resume preview

## Current localStorage Architecture

The current V1 demo still defaults to browser localStorage, with athlete profiles, highlight metadata, opportunity metadata, structured contact-request metadata, shortlist metadata, and admin queue metadata now gaining optional guarded Supabase save/load paths in Phase 1 when backend auth is enabled and the required tables exist.

Primary local keys:
- `msr_profiles_v1`
- `msr_highlights_v1`
- `msr_contact_requests_v1`
- `msr_admin_queues_v1`
- `msr_media_assets_v1`
- `msr_selected_role_v1`
- `msr_opportunities_v1`
- `msr_shortlist_v1`

Current characteristics:
- Zero backend dependency
- Fast local QA loops
- Demo-safe resets
- Device-local data only
- Supabase Auth is optional, and local demo mode still works without requiring a real signed-in account
- No public media delivery

The frontend now also has a small local data service boundary in `src/services/localDataService.js`, which makes future backend integration safer because storage access is no longer fully embedded in component logic.

## Current Scaffold Status

The app now includes a safe Supabase connection scaffold for future work.

Current scaffold rules:
- localStorage remains the active runtime
- the backend toggle is disabled by default
- missing or invalid Supabase env values do not break the app
- backend service placeholders exist, but they are not wired into live reads or writes
- Supabase Auth Phase 1 can now be enabled safely for real sign up, sign in, sign out, session detection, and lightweight account-role sync
- a dedicated setup guide now exists in `docs/SUPABASE_AUTH_SETUP.md`
- a focused auth QA checklist now exists in `docs/AUTH_QA_CHECKLIST.md`
- a focused Phase 1 SQL file now exists in `supabase/auth_phase_1.sql`
- athlete profile save/load now has a guarded Phase 1 service path through `src/services/profileDataService.js`
- highlight metadata save/load now has a guarded Phase 1 service path through `src/services/highlightDataService.js`
- `supabase/athlete_profiles_phase_1.sql` is the focused SQL entry point for athlete profile migration
- `supabase/highlights_phase_1.sql` is the focused SQL entry point for highlight metadata migration
- highlight persistence still starts as metadata-first, while private thumbnail storage is now a separate gated rollout
- opportunities now have a guarded metadata-only service path
- contact requests now have a guarded request-record service path
- shortlist metadata now has a guarded private-workflow service path
- admin queues now have a guarded review-record service path
- media metadata now has a guarded service path
- `supabase/admin_queues_phase_1.sql` is the focused SQL entry point for admin queue metadata migration
- `supabase/media_assets_phase_1.sql` is the focused SQL entry point for media metadata only
- `supabase/storage_phase_1_plan.sql` remains the earlier planning-only storage policy starter
- `supabase/storage_private_phase_1.sql` is the focused SQL entry point for private profile photo and private highlight thumbnail storage
- `supabase/video_storage_private_phase_1.sql` is the focused SQL entry point for private highlight video owner testing
- private profile photo and private highlight thumbnail uploads are now scaffolded in the app
- private highlight video uploads are now enabled for signed-in owner testing only
- approval-safe media workflow Phase 1 is now active for:
  - private profile photos
  - private highlight thumbnails
- junior media remains parent/guardian approval-gated
- adult media remains pending admin review before broader visibility
- no public media access has been enabled

Recommended next phase:
- keep private image uploads active through owner-only signed previews
- verify approval-state transitions through the media approval QA panel
- keep public media access disabled while private video uploads remain owner-test only
- confirm signed-in browser live video upload, signed preview playback, and delete or replace behavior before any broader rollout

## Future Supabase Architecture

Recommended future architecture:

1. React app
2. Data service layer
3. Supabase Auth
4. Supabase Postgres
5. Supabase Storage
6. Optional Supabase Edge Functions for review, sharing, moderation, and signed media URLs

Recommended frontend boundary:
- `localDataService.js` for current browser-only demo mode
- `backendDataService.js` later for Supabase-backed reads and writes
- optional `dataService.js` selector that switches by feature flag such as `VITE_ENABLE_BACKEND`

Recommended backend domains:
- Identity and roles
- Athlete profiles and resume sections
- Parent and guardian approvals
- Club and scout verification
- Highlights and media approvals
- Contact requests and opportunity interests
- Admin review and moderation audit trails

## Why localStorage remains active for V1 demo

localStorage should remain active until backend rollout is intentionally staged.

Reasons:
- The current demo is already QA-polished and stable
- It allows product iteration without auth and migration friction
- It supports offline/local walkthroughs
- It keeps stakeholder demos simple
- It avoids mixing unfinished auth/storage logic into a working frontend

Recommended principle:
- Keep the local demo working until the backend path is feature-complete enough to replace or dual-run the same workflows safely

## Migration Stages

### Stage 1: Planning and schema readiness
- Finalize docs and draft schema
- Keep product logic unchanged
- Define data-service boundaries

### Stage 2: Supabase project bootstrap
- Create Supabase project
- Add environment variables
- Create draft tables in a development project
- Prepare storage buckets

### Stage 3: Auth and role model
- Add Supabase Auth
- Support athlete, parent_guardian, club_scout, and admin roles
- Keep role onboarding UX but back it with authenticated role membership

Status update:
- Phase 1 is now scaffolded in the frontend for real account sign up, login, logout, and session detection
- `app_user_profiles` is the recommended lightweight account table for this stage
- localStorage remains active for all sports resume data outside the account layer

### Stage 4: Read model first
- Move sports catalogue and team directory to database-backed reads
- Keep profile writes local if needed during transition

### Stage 5: Athlete profile write migration
- Add athlete profile create and load persistence first
- Preserve current frontend profile shapes through normalization adapters and `profile_data`
- Keep localStorage fallback active until the athlete profile table and account flows are stable

Status update:
- Athlete profiles are now the first sports data type moving behind a guarded Supabase data-service boundary
- Highlight metadata, opportunity metadata, structured contact-request metadata, shortlist metadata, and admin queue metadata now have guarded Supabase service paths

### Stage 6: Highlight and opportunity write migration
- Add highlight persistence and approval records
- Add opportunity persistence and related workflow records
- Preserve current frontend shapes through normalization adapters

Status update:
- Highlight metadata Phase 1 is now prepared behind a guarded Supabase service path
- Opportunity metadata Phase 1 is now prepared behind a guarded Supabase service path
- These phases are metadata-first: no real video uploads and no public database-wide opportunity browsing
- Junior highlight approval and showcase restrictions still apply before any broader visibility
- Junior opportunity routing remains parent or guardian safe with no direct messaging

### Stage 7: Contact and opportunity workflows
- Move contact requests, opportunity posts, shortlist records, and interests to database tables
- Preserve safe routing rules before enabling broader discovery

Status update:
- Structured contact-request records are now prepared behind a guarded Supabase service path
- This phase remains request records only: no chat, no inbox, no conversation threads, and no user-to-user messaging
- Shortlist records are now prepared behind a guarded Supabase service path as private workflow records only
- Admin queue records are now prepared behind a guarded Supabase service path as structured review records only

### Stage 8: Admin review persistence
- Move admin queue records and review metadata to database tables
- Keep owner-scoped Phase 1 policies until broader admin-role RLS is safely designed

Status update:
- Admin queue metadata Phase 1 is now prepared behind a guarded Supabase service path
- This phase remains review records only: no inbox, no conversation threads, no direct messaging, and no automatic notifications

### Stage 9: Media metadata planning and private storage scaffold
- Add metadata-only media records first
- Add private profile photo and private highlight thumbnail uploads only
- Keep public media access and video uploads disabled until bucket policies and approval rules are verified
- Plan delete/replace flows, signed delivery, and admin review routing before any wider media rollout

Status update:
- Media metadata is now scaffolded behind a guarded Supabase service path
- Private profile photo and private highlight thumbnail upload helpers now exist behind the same guarded media service
- `storage_private_phase_1.sql` now exists for private owner-only bucket rollout
- This phase does not enable public bucket access, public media URLs, or video uploads

### Stage 10: Approval-safe image workflow activation
- Activate private profile photo and private highlight thumbnail uploads with approval-aware metadata
- Keep junior uploads private until parent or guardian and admin approval requirements are satisfied
- Use signed URLs for restricted owner-only media previews
- Keep public media URLs and public browsing disabled
- Keep highlight video uploads disabled

Status update:
- Approval-safe media workflow Phase 1 is now active for images only
- Private profile photos and private highlight thumbnails now create approval-aware metadata rows
- Owner-only signed previews are now wired into signed-in surfaces
- Media review metadata and queue linkage now support future broader review safely

### Stage 10.5: Signed-in media presentation polish
- Keep owner-facing media presentation clean inside signed-in profile, resume, and review views
- Show approval and visibility states clearly instead of exposing pending or rejected media
- Keep Public Resume public-safe while still allowing tightly scoped owner preview where explicitly allowed
- Keep signed URLs private, short-lived, and outside `public_url`

Status update:
- Signed-in owner media surfaces now use clearer private-media badges and approval labels
- Public Resume remains metadata-first and public-safe while public media access stays disabled
- Highlight Showcase remains card-focused and does not expose private media publicly

### Stage 11: Highlight video private owner-test rollout
- Add highlight video upload only after the private image rollout is stable
- Reuse the same approval-safe bucket, metadata, and signed-access model
- Keep public media delivery disabled by default until a separate approved rollout exists

Status update:
- A private highlight video owner-test rollout now exists in:
  - `supabase/video_storage_phase_1_plan.sql`
  - `supabase/video_storage_private_phase_1.sql`
  - `src/services/mediaAssetService.js`
  - Highlight Manager private video upload panel
  - Account and Admin private video QA panel
- This phase now supports the private video contract only:
  - bucket `msr-highlight-videos`
  - MP4, MOV, and WEBM only
  - `100 MB` initial test limit
  - junior parent or guardian approval required
  - admin review required
  - no public URLs
  - no public browsing
- owner-only signed preview access
- signed-in owner testing only
- public or unauthenticated video access remains disabled

### Stage 12: Public sharing and cutover
- Add secure public resume access rules
- Add dual-read or import path from local demo data if needed
- Retire localStorage only after parity is verified

## Safety and Privacy Notes for Under-18 Users

Under-18 safety must remain a first-class product rule during backend rollout.

Required rules:
- No direct athlete-to-scout messaging
- No public comments
- No follower features
- No public addresses
- Region and state only
- Parent and guardian approval before broader visibility
- Junior highlight approval before public showcase
- Junior opportunity interest routing to parent or guardian
- Junior contact requests routed to parent or guardian

Recommended storage rules:
- Avoid storing home addresses entirely
- Make guardian linkage explicit and auditable
- Record approval status changes with timestamps and reviewer identity
- Store media privately by default

## No-Social Rule

The future backend must preserve the current product stance:
- No chat
- No comments
- No DMs
- No followers
- No social feed
- No user-to-user messaging

This should be enforced in both product design and schema design:
- no message thread tables
- no comments tables
- no follower relationship tables
- no public engagement counters

## Parent and Guardian Control Model

Recommended model:
- A junior athlete may have an athlete account, but contact and visibility actions are gated through linked parent and guardian records
- Parent and guardian links should support:
  - approval status
  - primary guardian flag
  - visibility control
  - contact routing
  - audit trails

Parent and guardian actions that must remain explicit:
- approve profile
- keep profile private
- approve highlight
- keep highlight private
- request changes
- review junior opportunity interest routing

## Club and Scout Verification Model

Recommended model:
- Club and scout users can create accounts and request verification
- A separate verification request entity should exist before full account verification
- Verified status should be required for the broadest search and request permissions

Suggested states:
- pending
- under_review
- verified
- rejected
- suspended

Verified clubs and scouts may:
- search scout-visible profiles
- create structured opportunities
- shortlist athletes
- request contact through safe routes

They must not:
- directly contact juniors
- bypass approval rules
- access non-shareable media

## Admin Review Model

Admin review should be domain-aware, not one generic queue only.

Recommended review targets:
- athlete profiles
- highlights
- opportunities
- club and scout verification requests
- moderation flags

Recommended review metadata:
- reviewer id
- reviewer role
- action
- status before
- status after
- notes
- created_at

## Video and Media Storage Plan

Recommended approach:
- Store media metadata in Postgres
- Store profile photos, highlight thumbnails, and later video files in Supabase Storage
- Keep all uploads private first
- Use approval state plus signed URL logic to decide who can access what

See `docs/MEDIA_STORAGE_ARCHITECTURE.md` for the detailed bucket, approval, and storage plan.

## Public Resume Sharing Plan

The current `/resume/:athleteId` experience should evolve into a backend-backed public resume model with:
- safe public fields only
- no exact address
- no guardian private details
- visibility checks before share
- optional share token or slug support

Recommended public rules:
- private profiles are never public
- junior profiles require guardian approval before share
- pending verification can still have preview-only states if needed
- public highlight visibility must respect approval and showcase state

## Risks

Main risks during backend rollout:
- Breaking the stable local demo experience too early
- Leaking junior data or media through overly broad queries
- Overcomplicating auth before data models are stable
- Tight-coupling UI components directly to Supabase calls
- Schema drift between current frontend shapes and database rows

## Future Work

Recommended follow-up work after this planning pass:
- build `backendDataService.js`
- define normalized frontend DTOs for profile, highlight, opportunity, and request entities
- add import/export tooling for demo data
- add Supabase migrations in an actual project
- add RLS policies and policy tests
- add storage moderation workflow
- add signed public share URLs or server-side share checks

## Approval and Display Rules Phase

- private media upload is already active for signed-in owner flows
- this phase adds:
  - signed-in owner preview rules
  - owner-visible approval and visibility labels
  - admin metadata review controls
  - parent/guardian metadata approval controls where current scoped data allows it
- public unauthenticated media remains disabled
- no public URLs are enabled
- no public media feed or public highlight video feed is enabled
- `PROJECT_SAVEPOINT.md` should only move forward for this phase after the media approval/display QA pass is confirmed
