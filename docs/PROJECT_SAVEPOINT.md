# Project Savepoint

## Current app status

- My Sports Resume is a visual-polished V1 sports resume platform demo.
- The homepage structure is locked in the approved dark/gold laptop-first direction.
- Inner pages are polished and aligned to the same premium visual system.
- Supabase Auth Phase 1 is working for real account sign up, login, logout, session detection, and lightweight role sync.
- Athlete Profiles Phase 1 is working behind a guarded Supabase profile data service.
- Highlights Metadata Phase 1 is working behind a guarded Supabase highlight data service.
- Opportunities Metadata Phase 1 is working behind a guarded Supabase opportunity data service.
- Contact Requests Metadata Phase 1 is working behind a guarded Supabase contact-request data service.
- Shortlists Metadata Phase 1 is working behind a guarded Supabase shortlist data service.
- Admin Queue Metadata Phase 1 is working behind a guarded Supabase admin queue data service.
- Media Metadata Phase 1 is working behind a guarded Supabase media-asset service.
- Private Supabase Storage Phase 1 now works for owner-only profile photos and highlight thumbnails.
- Approval-safe Media Workflow Phase 1 is now active for private profile photos and private highlight thumbnails.
- Real private profile photo upload is now confirmed with a live image upload through the Account panel.
- Private Highlight Video Upload Phase 1 is now confirmed for signed-in owner testing in the private `msr-highlight-videos` bucket, with signed owner preview, no public URLs, and no public video feed.
- Approval + Display Rules Phase is now confirmed for signed-in owner previews, private media status labels, and public-safe resume behavior.
- Signed-in media presentation polish is now wired across owner views so private profile photos, highlight thumbnails, and highlight videos present clearer approval, visibility, and owner-preview state while public media remains disabled.
- A starter NSW Rugby League directory is now wired into the profile builder, highlight manager, scout search filters, and sample data as the first real structured sport focus.
- NSW Rugby League users can now mostly click through group or region, club, age group, position, secondary position, and Rugby League highlight types instead of typing them manually.
- Rugby League age groups are now standardised from `Under 6` through `Under 18`, with senior footy options beginning after that for `Under 19`, `Under 21`, `Open`, `Reserve Grade`, `First Grade`, `Ladies League Tag`, `Girls League Tag`, `Women's Tackle`, and `Masters`.
- Highlight Manager now keeps Rugby League highlight creation click-based, lets kids and parents save a clip without typing long match notes, auto-generates a clean title when needed, and collapses match details under an optional section.
- The main family-facing sport flow now uses `Sport -> Postcode/Suburb -> Nearby Clubs/Teams -> Age Group -> Position` instead of making sport category the primary choice.
- A simple starter sports list is now used for the main profile/search/opportunity paths: Rugby League, Rugby Union, AFL, Soccer, Netball, Basketball, Cricket, Touch Football, Oztag, Athletics, Swimming, Boxing, Martial Arts, Tennis, Hockey, Golf, and Other.
- A starter `australianSportsClubDirectory` seed now supports postcode/suburb club suggestions, beginning with NSW Rugby League Group 2 clubs including South Grafton Rebels, Grafton Ghosts, Coffs Harbour Comets, Sawtell Panthers, Woolgoolga Seahorses, Nambucca Heads Roosters, Macksville Sea Eagles, Bowraville Tigers, Kempsey Dragons, and Smithtown Tigers.
- Sport categories are demoted to internal catalogue metadata and are no longer the main visible Create Profile, Scout Search, or Opportunities filter flow.
- The NSW Rugby League directory remains starter and expandable, not a complete official national club database yet.
- A custom unverified fallback remains available when a club or competition is not listed, so kids and parents are not blocked by the starter directory.

## Current folder path

- `C:\Users\natha\OneDrive\Desktop\my_sports_resume_app`

## Visual status

- Premium dark/gold shell is active.
- Homepage remains:
  - compact dark/gold header
  - two-column hero
  - trust strip
  - off-white feature board
  - bottom proof strip
- Inner pages use the same dark/gold/off-white visual system.

## Supabase Auth Phase 1 status

- Supabase scaffold exists.
- Real auth is env-gated and safe.
- Account, Login, Create Account, Account Setup, and Admin backend status support Supabase Auth Phase 1.
- `app_user_profiles` is the lightweight account-role table for this phase.
- `athlete_profiles` is the first sports-data table in real use for this migration path.
- `highlights` is the second focused sports-data table in real use for this migration path, but metadata only in this phase.
- `opportunities` is now the third focused sports-data table in real use for this migration path, but metadata only in this phase and still owner-scoped.
- `contact_requests` is now the fourth focused sports-data table in real use for this migration path as structured request records only.
- `shortlists` is now the fifth focused sports-data table in real use for this migration path as private workflow records only.
- `admin_queue_items` is now the sixth focused sports-data workflow in real use for this migration path as structured review records only.
- `media_assets` is now the seventh focused metadata table in real use for this migration path.
- private profile photo and private highlight thumbnail storage now works behind owner-only bucket rules.
- approval-safe media workflow now enforces:
  - junior media defaults to `pending_parent_approval`
  - adult media defaults to `pending_review`
  - all image uploads default to `private`
  - owner-only signed previews
  - no public URLs
- Athlete profiles, highlight metadata, and opportunity metadata are now confirmed in Supabase behind the same guarded service boundary.
- Contact-request metadata is now confirmed in Supabase behind the same guarded service boundary and QA panel flow.
- Shortlist metadata is now confirmed in Supabase behind the same guarded service boundary and QA panel flow.
- Admin queue metadata is now confirmed in Supabase behind the same guarded service boundary and QA panel flow.
- Media metadata is now confirmed in Supabase behind the same guarded service boundary and QA panel flow.
- Account and Admin now include a `Supabase Profile Test` panel for signed-in QA.
- Account and Admin now include a `Supabase Highlight Test` panel for signed-in QA.
- Account and Admin now include a `Supabase Opportunity Test` panel for signed-in QA.
- Account and Admin now include a `Supabase Contact Request Test` panel for signed-in QA.
- Account and Admin now include a `Supabase Shortlist Test` panel for signed-in QA.
- Account and Admin now include a `Supabase Admin Queue Test` panel for signed-in QA.
- Account and Admin now include a `Supabase Media Metadata Test` panel for signed-in metadata-only QA.
- Account and Admin now include a `Supabase Storage Test` panel for signed-in private bucket QA.
- Account and Admin now include a `Supabase Media Approval Test` panel for signed-in approval-workflow QA.
- Signed-in browser testing has now confirmed that `athlete_profiles` save/load works for the current signed-in user.
- Signed-in browser testing has now confirmed that `highlights` metadata save/load works for the current signed-in user.
- Signed-in browser testing has now confirmed that `opportunities` metadata save/load works for the current signed-in user.
- Signed-in browser testing has now confirmed that `contact_requests` metadata save/load works for the current signed-in user.
- Signed-in browser testing has now confirmed that `shortlists` metadata save/load works for the current signed-in user.
- Signed-in browser testing has now confirmed that `admin_queue_items` metadata save/load works for the current signed-in user.
- Signed-in browser testing has now confirmed that `media_assets` metadata save/load works for the current signed-in user.
- Supabase Table Editor now shows real athlete profile rows created by the app, including the generated test profile and Nathan's signed-in profile data.
- Supabase Table Editor now shows real highlight metadata rows created by the app, including the generated Supabase highlight test row.
- Supabase Table Editor now shows real opportunity metadata rows created by the app, including the generated Supabase opportunity test row.
- Supabase Table Editor now shows real structured contact-request rows created by the app, including the generated Supabase contact request test row.
- Supabase Table Editor now shows real shortlist metadata rows created by the app, including the generated Supabase shortlist test row.
- Supabase Table Editor now shows real admin queue metadata rows created by the app, including the generated Supabase admin queue test row.
- Supabase Table Editor now shows real media metadata rows created by the app, including the generated Supabase media metadata test row.
- Signed-in browser testing has now confirmed that Private Supabase Storage Phase 1 works for the current signed-in user.
- Nathan has now confirmed a real private profile photo upload with:
  - the uploaded filename shown in the Account panel
  - `Approval status: Pending Review`
  - `Visibility: Private`
  - a successful private signed preview
- `media_assets` metadata is linked for the uploaded private profile photo record.
- Nathan has now confirmed that the full in-app `Run Full Supabase Highlight Thumbnail Test` passed in the signed-in browser session.
- The full Supabase highlight thumbnail test now proves:
  - a Supabase-backed QA athlete profile can be created or found
  - a Supabase-backed QA highlight can be created or found
  - a private thumbnail can upload to `msr-highlight-thumbnails`
  - linked `media_assets` metadata is saved correctly
  - a signed private preview can be loaded for the signed-in owner
  - public media access remains disabled
  - private highlight video owner testing remains a separate gated phase
  - no public media URL is created
- Nathan has now confirmed that the real user-selected private highlight thumbnail upload path passed in the signed-in browser session.
- The real user-selected private highlight thumbnail path now proves:
  - Local Demo highlights are safely converted or resaved to Supabase first when needed
  - a Supabase-backed highlight is created or reused before thumbnail upload begins
  - the private thumbnail uploads to `msr-highlight-thumbnails`
  - linked `media_assets` metadata is saved correctly
  - a signed private preview loads for the signed-in owner
  - approval remains `Pending Review` or `Pending Parent Approval` where relevant
  - visibility remains `Private`
  - public media access remains disabled
  - private highlight video owner testing remains a separate gated phase
  - no public media URL is created
- Approval-safe media workflow state changes are now wired for images only:
  - `pending_parent_approval`
  - `pending_review`
  - `admin_approved`
  - `rejected`
- The private profile photo bucket is confirmed working.
- The private highlight thumbnail bucket is confirmed working.
- Signed private owner preview URLs are confirmed working.
- Storage cleanup and delete flow is confirmed working.
- Public unauthenticated reads of `athlete_profiles` remain blocked.
- Public unauthenticated reads of `highlights` remain blocked.
- Public unauthenticated reads of `opportunities` remain blocked.
- Public unauthenticated reads of `contact_requests` remain blocked.
- Public unauthenticated reads of `shortlists` remain blocked.
- Public unauthenticated reads of `admin_queue_items` remain blocked.
- Public unauthenticated reads of `media_assets` remain blocked.

## localStorage data status

The following still remain localStorage-only in this phase:

- selected role UI state fallback

Athlete profiles now support:
- guarded Supabase save/load when backend is enabled, configured, the user is signed in, and the `athlete_profiles` table exists
- safe fallback to localStorage when any of those conditions are missing
- no automatic migration of older local athlete profiles until the user explicitly resaves them
- one-click QA through the `Supabase Profile Test` panel to prove whether Supabase or localStorage handled the save
- signed-in profile save/load is now proven in live testing
- older local athlete profiles still render safely when fallback/local mode is active

Highlights now support:
- guarded Supabase metadata save/load when backend is enabled, configured, the user is signed in, and the `highlights` table exists
- safe fallback to localStorage when any of those conditions are missing
- no automatic migration of older local highlights until the user explicitly resaves them
- one-click QA through the `Supabase Highlight Test` panel to prove whether Supabase or localStorage handled the save
- signed-in highlight metadata save/load is now proven in live testing
- metadata only in this phase: no real video uploads, no Supabase Storage, and no public database-wide highlight discovery
- junior approval restrictions still apply before wider visibility or showcase approval

Opportunities now support:
- guarded Supabase metadata save/load when backend is enabled, configured, the user is signed in, and the `opportunities` table exists
- safe fallback to localStorage when any of those conditions are missing
- no automatic migration of older local/demo opportunities until the user explicitly resaves them
- one-click QA through the `Supabase Opportunity Test` panel to prove whether Supabase or localStorage handled the save
- signed-in opportunity metadata save/load is now proven in live testing
- local/demo opportunities can still render alongside owned Supabase opportunities in this phase
- no public database-wide opportunity browsing yet
- junior opportunity routing remains parent/guardian safe with no direct messaging

Contact requests now support:
- guarded Supabase request-record save/load when backend is enabled, configured, the user is signed in, and the `contact_requests` table exists
- safe fallback to localStorage when any of those conditions are missing
- no automatic migration of older local request records until the user explicitly recreates or resaves them through the active account
- one-click QA through the `Supabase Contact Request Test` panel to prove whether Supabase or localStorage handled the save
- signed-in contact-request metadata save/load is now proven in live testing
- structured request records only in this phase: no inbox, no conversation threads, no direct messaging, and no public request browsing
- junior request routing remains parent/guardian safe with no direct messaging

Shortlists now support:
- guarded Supabase shortlist save/load when backend is enabled, configured, the user is signed in, and the `shortlists` table exists
- safe fallback to localStorage when any of those conditions are missing
- no automatic migration of older local shortlist records until the user explicitly resaves them through the active account
- one-click QA through the `Supabase Shortlist Test` panel to prove whether Supabase or localStorage handled the save
- signed-in shortlist metadata save/load is now proven in live testing
- private workflow records only in this phase: no public shortlist browsing, no athlete notification yet, no follow or follower behavior, and no messaging threads

Admin queues now support:
- guarded Supabase review-record save/load when backend is enabled, configured, the user is signed in, and the `admin_queue_items` table exists
- safe fallback to localStorage when any of those conditions are missing
- no automatic migration of older local admin queue records until they are explicitly recreated or resaved through the active account
- one-click QA through the `Supabase Admin Queue Test` panel to prove whether Supabase or localStorage handled the save
- signed-in admin queue save/load is now proven in live testing
- structured review records only in this phase: no inbox, no conversation threads, no direct messaging, and no automatic notifications yet
- admin-wide cross-account RLS can remain future work until a safer role-aware policy is introduced

Media assets now support:
- guarded Supabase metadata save/load when backend is enabled, configured, the user is signed in, and the `media_assets` table exists
- safe local/no-op fallback when any of those conditions are missing
- no automatic migration of placeholder media metadata until a user explicitly creates or saves media metadata through the active account
- one-click QA through the `Supabase Media Metadata Test` panel to prove whether Supabase or fallback handled the metadata save
- signed-in media metadata save/load is now proven in live testing
- private storage now works for:
  - owner-only profile photo uploads
  - owner-only highlight thumbnail uploads
  - signed owner preview URLs
  - cleanup and delete flow
- real private profile photo upload is now proven with:
  - a live stored image
  - linked `media_assets` metadata
  - `Pending Review` approval status
  - `Private` visibility
  - owner-only signed preview access
- real user-selected private highlight thumbnail upload is now proven with:
  - automatic Supabase-first save or conversion for Local Demo highlights when needed
  - a live stored image in `msr-highlight-thumbnails`
  - linked `media_assets` metadata
  - `Pending Review` or `Pending Parent Approval` approval status where relevant
  - `Private` visibility
  - owner-only signed preview access
- approval-safe image workflow now works for:
  - private profile photos
  - private highlight thumbnails
  - junior parent/guardian approval gating
  - adult admin review gating
  - owner-only signed previews in signed-in surfaces
  - media review queue linkage for future broader review
- public media URLs remain disabled
- public media browsing remains disabled
- private highlight video uploads are now confirmed working for signed-in owner testing
- private highlight video uploads currently support:
  - private bucket `msr-highlight-videos`
  - MP4, MOV, and WEBM only
  - `100 MB` initial test limit
  - private-by-default owner-only video storage
  - owner-only signed private preview
  - no public URLs
  - no public browsing
  - junior parent/guardian approval required
  - admin review required
- the in-app `Run Private Video Storage Test` now proves bucket + `media_assets` linkage without faking a real video upload
- the real private highlight video upload path is now confirmed for:
  - private upload into `msr-highlight-videos`
  - linked `media_assets` metadata
  - created video media asset id and private storage object path
  - signed private owner preview loaded in the app
  - `Pending Review` or `Pending Parent Approval` approval status where relevant
  - `Private` visibility
  - public video access remaining disabled
  - public URL creation remaining disabled
  - no public video feed added
- Nathan has now confirmed that the signed-in `Media Approval Display Test` passed on `/qa/media-approval`.
- The confirmed approval and display rules now prove:
  - signed-in owner previews work for private media
  - approved private profile photos, highlight thumbnails, and highlight videos can be shown safely in signed-in owner views
  - pending, rejected, and archived media shows status labels instead of being exposed
  - public resume remains public-safe
  - public media URLs remain disabled
  - public unauthenticated media access remains disabled
  - public media feed remains disabled
  - video uploads remain private
  - junior media remains parent or guardian approval-gated
  - admin review metadata controls are active
- Signed-in media presentation polish now adds:
  - clearer private, pending, approved, rejected, archived, owner-preview, public-disabled, and video-private labels
  - cleaner signed-in owner presentation in My Profile, Athlete Profile, and Highlight Manager
  - safer public-resume media copy with no raw public media URL exposure

## Official project email

- `mysportsresumeaus@outlook.com`

For account, verification, or platform support, contact mysportsresumeaus@outlook.com.

## What is not built yet

- public or signed highlight video playback for general users
- approved public media URL flows
- any public media browsing
- public media URLs
- payments
- public unauthenticated database highlight browsing
- public unauthenticated database resume sharing
- database-wide scout profile discovery
- any messaging or social layer

## No-social rule

This product remains a sports resume platform, not a social network.

- no chat
- no comments
- no DMs
- no followers
- no follow behaviour
- no inbox
- no conversation threads
- no user-to-user messaging

## Next planned phase

Database-backed athlete profiles, highlight metadata, opportunity metadata, contact-request metadata, shortlist metadata, admin queue metadata, media metadata, private storage, and approval-safe image workflow are now confirmed behind the same guarded Supabase pattern. Private highlight video Phase 1 is now enabled for signed-in owner testing only, with private bucket access, owner-only signed preview, and no public URL or public feed behavior. The next recommended phase is public deployment planning, environment hardening, and final release-readiness checks while public media access remains disabled.

## Full app QA pass

A full pre-deployment QA pass was completed on 28/05/2026 with the current local Vite app and signed-in Supabase session.

What passed in this QA pass:

- `npm run build` passed successfully
- the only build note remained the existing Vite chunk-size warning
- homepage, login, create account, account, create profile, highlight manager, public resume, search, opportunities, parent dashboard, and admin dashboard all loaded in the live browser with no console errors during route smoke checks
- mobile-width route smoke checks passed on homepage, login, create profile, my profile, highlight manager, public resume, search, opportunities, parent dashboard, and admin dashboard with no horizontal overflow detected
- the signed-in `/qa/media-approval` route was opened live and `Run Media Approval Display Test` passed
- the Account page `Run Private Video Storage Test` passed with Supabase source, bucket ready, `media_assets` linked, and no public URL creation
- signed-in Account view showed the correct active user email and Supabase-backed status panels
- public resume remained public-safe, with safe placeholders and no private media exposure
- Highlight Showcase remained metadata-first, with private thumbnails, private videos, public media URLs, and public media feed behavior still disabled
- signed private media previews remained signed-URL only, with `public_url` kept empty in the media service layer
- frontend Supabase usage still relies on the anon key only; no frontend `service_role` usage was found
- no password values are written to localStorage in the frontend code paths audited in this pass
- the official support email remained scoped to support/admin contact usage
- no chat, comments, DMs, followers, inbox, conversation threads, user-to-user messaging, or public media feed behavior was introduced

Bug fixed during this QA pass:

- `.env.local` was not ignored by git; `.gitignore` now excludes `.env.local` and `.env.*.local`

Known issues or honest limits from this QA pass:

- the build still emits the existing Vite chunk-size warning
- the live dev browser still shows the existing React Router future-flag warnings in development
- not every mutating backend QA panel was rerun in this pass, to avoid unnecessary duplicate test-record churn; previously confirmed Supabase profile, highlight, opportunity, contact request, shortlist, admin queue, media metadata, storage, thumbnail, and video flows remain documented above
- the current signed-in browser session was role-scoped as `Admin / demo reviewer`, so athlete-role-specific signed-in `My Profile` presentation was not rechecked under a separate athlete session in this pass

## Pilot-ready cleanup pass

A pilot-ready cleanup pass for the `2460` junior rugby league flow was completed on 28/05/2026.

What changed in this cleanup pass:

- normal parent, athlete, scout, public resume, opportunities, search, and highlight surfaces now filter obvious generated QA/test records from normal display
- Account, Admin, and `/qa/media-approval` still keep the QA/testing panels available for deliberate backend checks
- Highlight Manager keeps the real private thumbnail and private video upload controls, but no longer shows the full Supabase thumbnail proof button or built-in video test button in the normal athlete flow
- visible custom-club copy now says `Added manually - pending verification` instead of exposing internal `custom_unverified` wording
- the pilot sample athlete remains `Luca Hart`, a junior Rugby League player in NSW postcode `2460` for `South Grafton Rebels`
- pilot sample highlights for Luca now use clean junior footy examples: `Try`, `Line break`, `Cover tackle`, and `Dummy-half run`
- the `2460` postcode path remains focused on `Grafton / South Grafton / Clarence Valley`, with `South Grafton Rebels` and `Grafton Ghosts` seeded as clean starter Rugby League clubs

Safety status after this cleanup:

- public media access remains disabled
- public media URLs remain disabled
- public media feed remains disabled
- private profile photo, private thumbnail, and private video upload flows remain signed-in and private
- payments remain unbuilt
- no chat, comments, DMs, followers, inbox, conversation threads, or user-to-user messaging were added

Deployment/dist note:

- `.gitignore` includes `dist`, so the local recommendation remains: commit source files, let Vercel run the Vite build, and do not intentionally commit generated `dist/` output unless a future hosting setup explicitly requires it
- this local workspace currently has no `.git` folder and `git` is not available on PATH, so historical tracked/untracked status for `dist/` cannot be proven from this machine
