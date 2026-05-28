# Media Storage Architecture

## Goals

- support safe private media uploads without turning My Sports Resume into a public media platform
- keep all uploaded media private by default
- allow owner-only profile photo uploads first
- allow owner-only highlight thumbnail uploads second
- keep real highlight video upload disabled in this phase
- avoid raw public URLs for private or unapproved media
- preserve under-18 parent and guardian approval rules before any broader visibility
- allow delete and replace flows without exposing retired media

## Private Supabase Storage Phase 1

This phase now supports:

- private profile photo upload metadata + storage
- private highlight thumbnail upload metadata + storage
- owner-only signed preview URLs in-app
- delete and replace controls through the signed-in owner account

This phase does not support:

- public media URLs
- public bucket browsing
- unauthenticated media access
- public media discovery
- highlight video uploads

## Approval-safe media workflow Phase 1

This phase now activates approval-safe image handling for:

- private profile photos
- private highlight thumbnails

Rules now active in the app:

- junior media defaults to `pending_parent_approval`
- junior media defaults to `parent_guardian_required = true`
- adult media defaults to `pending_review`
- all uploaded images default to `visibility_status = private`
- `public_url` remains empty
- signed URLs stay short-lived and owner-only for in-app preview

This phase still does not support:

- public media URLs
- public media browsing
- unauthenticated media access
- highlight video uploads
- verification document uploads

## Highlight Video Upload Phase plan

This phase is now enabled for signed-in owner testing for:

- private highlight video uploads
- owner-only signed preview access
- approval-gated metadata linkage through `media_assets`
- junior parent or guardian approval before any broader visibility
- admin review before any broader visibility

This private owner-test phase still does not support:

- public video URLs
- public video browsing
- public highlight feeds
- unauthenticated media access
- public `public_url` delivery

Core plan:

- use the private bucket `msr-highlight-videos`
- activate the bucket and owner-only policies through `supabase/video_storage_private_phase_1.sql`
- allow only:
  - `video/mp4`
  - `video/quicktime`
  - `video/webm`
- keep the initial test limit at `100 MB`
- keep all uploads private by default
- use signed preview URLs only for owner or future reviewer access
- keep junior videos in `pending_parent_approval`
- keep adult videos in `pending_review`
- require admin review before any broader visibility state is considered
- do not create public URLs in this phase
- do not create public browsing or public feed behavior in this phase

## Bucket strategy

Active private buckets for this phase:

- `msr-profile-photos`
- `msr-highlight-thumbnails`

Future buckets remain planned only:

- `msr-highlight-videos`
- `msr-verification-docs`

Default rule:

- every active bucket stays private
- no public unauthenticated media access exists in this phase
- no public bucket policies are enabled
- approved public delivery, if added later, should use tightly scoped signed URLs or a server-side resolver

## File type limits

Active in this phase:

- profile photo:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
- highlight thumbnail:
  - `image/jpeg`
  - `image/png`
  - `image/webp`

Still disabled in this phase:

- highlight video uploads
- verification-document uploads

Recommended rejects:

- video files through the current upload UI
- executable formats
- archive formats
- unsupported office documents
- SVG for user uploads unless later sanitized deliberately

## File size limits

Active in this phase:

- profile photo: `5 MB`
- highlight thumbnail: `5 MB`

Future rollout planning only:

- verification document: `10 MB`
- highlight video: `100 MB` initial private-testing ceiling

## Upload paths and naming

Active path convention:

- profile photo:
  - `user/{userId}/profiles/{athleteProfileId}/{mediaAssetId}-{safeFileName}`
- highlight thumbnail:
  - `user/{userId}/highlights/{highlightId}/{mediaAssetId}-{safeFileName}`

Future planned only:

- highlight video:
  - `user/{userId}/highlights/{highlightId}/{mediaAssetId}-{safeFileName}`
- verification document:
  - `user/{userId}/verification/{mediaAssetId}-{safeFileName}`

Rules:

- use generated media asset ids, not raw original filenames, as the stable path anchor
- keep original filename in metadata only
- sanitize the trailing filename for safe storage paths
- prefer creating a new asset row for replacements instead of overwriting old files in place

## Privacy defaults

- `visibility_status` starts as `private`
- `approval_status` starts as `pending_review` for adult media
- `approval_status` starts as `pending_parent_approval` for junior media
- `public_url` remains empty in this phase
- signed URLs are short-lived and owner-only in-app helpers, not permanent public links
- no public media browsing exists in this phase

## Signed-in presentation polish

- signed-in owner views can show approved private media through short-lived signed URLs only
- signed-in owner views now present approval and visibility labels clearly for pending, approved, rejected, and archived states
- pending, rejected, and archived media should show status labels instead of exposing the media file
- Public Resume remains conservative:
  - signed-in owner preview can appear only where explicitly allowed
  - public visitors still see safe placeholders and metadata only
  - no unauthenticated private media access is enabled
- signed previews must never be copied into `public_url`
- if a signed preview expires, the owner reloads a fresh private preview through the existing owner controls

## Junior athlete rules

- junior profile photos and highlight thumbnails begin private
- junior media sets `parent_guardian_required = true`
- junior media sets `is_junior_media = true`
- junior media defaults to `pending_parent_approval`
- junior media must not become `showcase_approved` or `public_approved` until parent and admin rules are both satisfied where required
- no direct messaging, no public gallery, and no raw public URLs are added through media features

## Adult athlete rules

- adult media still begins private
- adult media defaults to `pending_review`
- adult media still requires approval-aware handling before any future public delivery path
- no messaging or social distribution rules are attached to media

## Future moderation notes for videos

- review should start from metadata plus signed preview only
- no public playback route should exist until approval checks, retention rules, and cost controls are confirmed
- future moderation can add:
  - reviewer notes
  - rejection reasons
  - archive states
  - content safety holds
- no messaging, no social comments, and no public engagement counters should be introduced through video review

## Parent approval flow

Recommended active direction:

1. athlete uploads a private image
2. upload lands in a private bucket
3. `media_assets` row is created with `pending_parent_approval` for junior media
4. parent or guardian approval logic remains the next gate before broader visibility
5. no public URL is created in this phase

## Admin review flow

Recommended active direction:

1. media asset is linked to `admin_queue_items` when review is required later
2. owner-scoped or future role-aware admin review surfaces inspect metadata and private previews only
3. admin sets `approval_status`
4. approved profile photos move to `profile_only`
5. approved highlight thumbnails move to `profile_only` unless a later showcase rule explicitly permits more
6. rejected media returns to `private`
7. no user notification or messaging thread is created automatically in this phase

## Delete and replace flow

Active Phase 1 direction:

- owner can delete private or pending assets
- replacing an asset should create a new asset row and private object path
- old assets can then be deleted or archived cleanly
- deleted or archived assets should no longer resolve through signed URL helpers

Planned extension for videos:

- owner should be able to replace a private video with a new private upload path
- old video objects should be deleted or archived after replacement succeeds
- signed preview URLs for retired videos should expire and stop resolving

## Thumbnail flow

Active now:

- manual private thumbnail upload
- signed owner preview URL
- metadata linkage through `media_assets`

Future later:

- generated thumbnails from approved highlight videos
- automatic pipeline support once video uploads exist

## Signed access rules

- signed URLs are owner-only in this phase
- short expiry is recommended and currently targeted at about 10 minutes
- signed URLs must not be stored permanently as `public_url`
- unauthenticated users do not get media access through this phase
- signed previews are intended for owner and reviewer-only surfaces, not public resume views

## Future CDN and public delivery notes

- no public bucket policy in this phase
- no public CDN or open bucket links in this phase
- if public media is allowed later, prefer:
  - signed URL delivery
  - server-side approval checks
  - per-asset visibility enforcement
  - short expiry windows

## Storage cost and performance warning

- highlight videos will cost materially more than images in both storage and bandwidth
- the initial `100 MB` limit is deliberately conservative for early testing
- raise limits only after reviewing:
  - storage growth
  - signed preview bandwidth
  - moderation cost
  - transcoding needs

## Future compression and transcoding plan

- the first live video rollout should keep uploads private before any transformation pipeline is added
- later phases can evaluate:
  - automatic transcoding to streaming-friendly variants
  - poster-frame extraction
  - smaller preview renditions
  - duration and bitrate checks
- any transcoded output should inherit the same approval and visibility rules as the original private upload

## Risks and controls

- risk: junior media becomes public too early
  - control: private buckets, parent approval requirement, no public read policy
- risk: raw public URLs leak unapproved media
  - control: keep `public_url` empty and public delivery disabled in this phase
- risk: oversized or unsupported files
  - control: strict mime and size validation before upload
- risk: orphaned media after profile or highlight deletion
  - control: link assets by ids and support explicit delete/replace handling
- risk: upload UI implies full media rollout is live
  - control: keep video limited to signed-in owner testing only, with no public URLs, no public feed, and no unauthenticated access
- risk: private videos create unexpected storage or bandwidth costs
  - control: keep live video uploads disabled, use a planning-only bucket file first, and start with a 100MB limit before any broader rollout

## Approval and Display Rules Phase

- signed-in owners can load approved private media through short-lived signed URLs only
- owner upload panels can still show owner-only pending previews while approval is in progress
- approved media can appear in signed-in profile and resume surfaces without creating a public URL
- junior media remains parent/guardian approval-gated before admin review can widen visibility
- admin review changes metadata only:
  - `approval_status`
  - `visibility_status`
  - `admin_review_required`
  - `parent_guardian_required`
- public unauthenticated media remains disabled in this phase
- no public media feed or public video feed exists in this phase
- `public_url` must stay empty while media remains private and signed-preview only
