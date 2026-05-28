# Auth QA Checklist

Use this checklist for My Sports Resume Supabase Auth Phase 1.

For account, verification, or platform support, contact mysportsresumeaus@outlook.com.

## Local mode QA

- `VITE_ENABLE_BACKEND=false` keeps the app in local demo mode
- local login still works with `msr_demo_account_v1`
- local role flow still syncs with `msr_selected_role_v1`
- local profile, highlight, opportunity, shortlist, request, and admin queue data still work

## Missing-key safety QA

- set `VITE_ENABLE_BACKEND=true` with no Supabase URL or anon key
- app still loads
- no blank screen appears
- login and account pages still remain safe
- backend status still explains the missing configuration

## Real auth UI QA

- set valid `VITE_SUPABASE_URL`
- set valid `VITE_SUPABASE_ANON_KEY`
- set `VITE_ENABLE_BACKEND=true`
- Create Account page loads in Supabase auth mode
- Login page loads in Supabase auth mode

## Sign-up QA

- create account succeeds with:
  - full name
  - email
  - password
  - role
- optional organisation name saves for club and scout flows
- password is never stored in localStorage
- account setup page loads after sign up

## Login / logout QA

- login succeeds with email and password
- session is detected on reload
- logout succeeds
- logout does not wipe local athlete, highlight, or opportunity demo data

## `app_user_profiles` QA

- `app_user_profiles` row is created or updated after sign up
- selected role is saved into `app_user_profiles.role`
- changing role in Account updates the same account role cleanly
- if the table is missing, the app shows a friendly fallback warning instead of crashing
- if the table exists but reads/writes are forbidden, rerun `supabase/auth_phase_1.sql` so the authenticated role receives the required grants

## Athlete profile backend QA

- sign in with a confirmed Supabase account
- open the `Supabase Profile Test` panel on Account or Admin
- click `Run Supabase Profile Test`
- confirm the panel shows:
  - `PASS - Supabase profile save/load works`
  - `Source used: Supabase`
  - `profile_data JSON exists: Yes`
  - `owner_user_id exists: Yes`
  - `Found again on reload: Yes`
- if the panel shows `FALLBACK - saved locally only`, athlete profile save/load is still using localStorage
- if the panel shows `FAIL - Supabase profile backend error`, inspect the safe error message for table, policy, session, or permission issues
- if needed, click `Delete Test Profile` to remove only the generated QA record

## Highlight metadata backend QA

- sign in with a confirmed Supabase account
- ensure at least one Supabase-backed athlete profile exists first
- open the `Supabase Highlight Test` panel on Account or Admin
- click `Run Supabase Highlight Test`
- confirm the panel shows:
  - `PASS - Supabase highlight save/load works`
  - `Source used: Supabase`
  - `highlight_data JSON exists: Yes`
  - `owner_user_id exists: Yes`
  - `athlete_profile_id exists: Yes`
  - `Found again on reload: Yes`
- if the panel shows `FALLBACK - saved locally only`, highlight metadata is still using localStorage
- if the panel shows `FAIL - Supabase highlight backend error`, inspect the safe error message for table, policy, session, or permission issues
- if no owned athlete profile exists yet, the panel should say `Create a Supabase-backed athlete profile first.`
- if needed, click `Delete Test Highlight` to remove only the generated QA record

## Opportunity metadata backend QA

- sign in with a confirmed Supabase account
- open the `Supabase Opportunity Test` panel on Account or Admin
- click `Run Supabase Opportunity Test`
- confirm the panel shows:
  - `PASS - Supabase opportunity save/load works`
  - `Source used: Supabase`
  - `opportunity_data JSON exists: Yes`
  - `owner_user_id exists: Yes`
  - `Found again on reload: Yes`
- if the panel shows `FALLBACK - saved locally only`, opportunity metadata is still using localStorage
- if the panel shows `FAIL - Supabase opportunity backend error`, inspect the safe error message for table, policy, session, or permission issues
- if needed, click `Delete Test Opportunity` to remove only the generated QA record

## Contact request metadata backend QA

- sign in with a confirmed Supabase account
- ensure at least one Supabase-backed athlete profile exists first
- open the `Supabase Contact Request Test` panel on Account or Admin
- click `Run Supabase Contact Request Test`
- confirm the panel shows:
  - `PASS - Supabase contact request save/load works`
  - `Source used: Supabase`
  - `request_context JSON exists: Yes`
  - `requester_user_id exists: Yes`
  - `athlete_owner_user_id exists: Yes`
  - `Found again on reload: Yes`
- if the panel shows `FALLBACK - saved locally only`, contact-request metadata is still using localStorage
- if the panel shows `FAIL - Supabase contact request backend error`, inspect the safe error message for table, policy, session, or permission issues
- if no owned athlete profile exists yet, the panel should say `Create a Supabase-backed athlete profile first.`
- if needed, click `Delete Test Contact Request` to remove only the generated QA record

## Shortlist metadata backend QA

- sign in with a confirmed Supabase account
- ensure at least one Supabase-backed athlete profile exists first
- open the `Supabase Shortlist Test` panel on Account or Admin
- click `Run Supabase Shortlist Test`
- confirm the panel shows:
  - `PASS - Supabase shortlist save/load works`
  - `Source used: Supabase`
  - `shortlist_data JSON exists: Yes`
  - `owner_user_id exists: Yes`
  - `athlete_profile_id exists: Yes`
  - `Found again on reload: Yes`
- if the panel shows `FALLBACK - saved locally only`, shortlist metadata is still using localStorage
- if the panel shows `FAIL - Supabase shortlist backend error`, inspect the safe error message for table, policy, session, or permission issues
- if no owned athlete profile exists yet, the panel should say `Create a Supabase-backed athlete profile first.`
- if needed, click `Delete Test Shortlist` to remove only the generated QA record

## Admin queue metadata backend QA

- sign in with a confirmed Supabase account
- open the `Supabase Admin Queue Test` panel on Account or Admin
- click `Run Supabase Admin Queue Test`
- confirm the panel shows:
  - `PASS - Supabase admin queue save/load works`
  - `Source used: Supabase`
  - `queue_data JSON exists: Yes`
  - `owner_user_id exists: Yes`
  - `Found again on reload: Yes`
- if the panel shows `FALLBACK - saved locally only`, admin queue metadata is still using localStorage
- if the panel shows `FAIL - Supabase admin queue backend error`, inspect the safe error message for table, policy, session, or permission issues
- if needed, click `Delete Test Admin Queue Item` to remove only the generated QA record

SQL diagnostics for `admin_queue_items`:

```sql
select table_schema, table_name
from information_schema.tables
where table_schema = 'public'
  and table_name = 'admin_queue_items';
```

```sql
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'admin_queue_items';
```

```sql
select policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename = 'admin_queue_items';
```

## Media metadata backend QA

- sign in with a confirmed Supabase account
- open the `Supabase Media Metadata Test` panel on Account or Admin
- click `Run Supabase Media Metadata Test`
- confirm the panel shows:
  - `PASS - Supabase media metadata save/load works`
  - `Source used: Supabase`
  - `media_data JSON exists: Yes`
  - `owner_user_id exists: Yes`
  - `Found again on reload: Yes`
- if the panel shows `FALLBACK - saved locally only`, media metadata is still using fallback instead of Supabase
- if the panel shows `FAIL - Supabase media metadata backend error`, inspect the safe error message for table, policy, session, or permission issues
- remember this panel creates metadata only and does not upload a real file
- if needed, click `Delete Test Media Metadata` to remove only the generated QA record

## Private storage backend QA

- sign in with a confirmed Supabase account
- run `supabase/storage_private_phase_1.sql` first
- ensure at least one Supabase-backed athlete profile exists first
- open the `Supabase Storage Test` panel on Account or Admin
- click `Run Private Storage Metadata/Bucket Test`
- confirm the panel shows:
  - `PASS - private storage upload works`
  - `Source used: Supabase`
  - `File uploaded: Yes`
  - `Signed URL created: Yes`
  - `Cleanup completed: Yes`
- confirm the status lines show:
  - `Storage mode: Private Storage Active`
  - `Profile photo bucket: yes`
  - `Thumbnail bucket: yes`
  - `Public media access: No`
  - `Video uploads: Private owner test only`
- on Account, test `Private profile photo upload`
- on Highlight Manager, test `Private thumbnail upload`
- confirm both flows accept only JPG, PNG, or WEBP images up to 5MB
- confirm video files are blocked with `Video upload is not enabled yet.`
- confirm no public media URL is created
- confirm signed preview access is owner-only

## Media approval workflow QA

- sign in with a confirmed Supabase account
- ensure `media_assets` and private storage are already working
- open the `Supabase Media Approval Test` panel on Account or Admin
- click `Run Media Approval Test`
- confirm the panel shows:
  - `PASS - media approval workflow works`
  - `Source used: Supabase`
  - an initial status of `pending_review` for adult test media
  - an approved status of `admin_approved`
  - a rejected status of `rejected`
- confirm the status lines show:
  - `Media approval workflow: Active`
  - `Public media URLs: Disabled`
  - `Video uploads: Private owner test only`
  - `Junior media approval: Parent/guardian required`
  - `Admin media review: Enabled for metadata`
- on owner-facing signed-in views, confirm:
  - private profile photos never appear in public unauthenticated resume views
  - private highlight thumbnails never appear publicly while pending or rejected
  - juniors show `Pending parent/guardian approval`
  - adults show `Pending admin review`
- if the panel shows `FALLBACK - saved locally only`, the approval workflow did not use Supabase
- if the panel shows `FAIL - media approval workflow error`, inspect the safe update error message before changing any SQL
- if needed, click `Delete Test Media Metadata` to remove only the generated QA record

## Signed-in media presentation QA

- sign in with a confirmed Supabase account
- open `My Profile`, `Athlete Profile`, and the signed-in owner `Public Resume`
- confirm approved private profile photos, thumbnails, and videos can appear only through signed owner preview where allowed
- confirm pending, rejected, or archived media shows status labels instead of exposing the media file
- confirm Public Resume still stays public-safe for non-owner and unauthenticated views
- confirm `public_url` remains empty and signed preview access is still separate from public delivery
- if a signed preview has expired, use the existing `Load Private Preview` or `Load Private Video Preview` controls to refresh it

## Private highlight video QA

- sign in with a confirmed Supabase account
- run `supabase/video_storage_private_phase_1.sql`
- open Account or Admin
- run `Run Private Video Storage Test`
- confirm the panel shows either:
  - `PASS - private video bucket + metadata ready`
  - or a clear metadata-only message stating that no real video file was uploaded by the QA path
- confirm the panel still shows:
  - `Video uploads: Private owner test only`
  - `Public video access: No`
  - `Public URLs: Disabled`
- open Highlight Manager
- confirm the `Private Highlight Video Upload` panel shows:
  - `Video uploads: Private owner test only`
  - `Public video access: No`
  - `Bucket: msr-highlight-videos`
  - `Allowed types: MP4, MOV, WEBM`
  - `Max size: 100MB`
  - `Junior approval: Required`
  - `Admin review: Required`
  - `Public URLs: Disabled`
- confirm a saved Supabase-backed highlight is required before the file picker and upload button enable
- confirm `validateHighlightVideoFile(file)` accepts only MP4, MOV, or WEBM
- confirm `validateHighlightVideoFile(file)` rejects files over `100MB`
- confirm manual live upload still creates no public URL
- confirm signed preview remains owner-only
- confirm no public video URL is created in this phase

## Account / admin status QA

- Account page shows `Supabase account active`
- Account page shows email, name, and role
- Admin backend status shows:
  - current mode
  - backend enabled
  - Supabase configured
  - auth enabled
  - current user email
  - current role
- when signed in successfully, current mode becomes `Supabase Auth Active`

## Local sports data QA

- athlete profiles still load from localStorage when Supabase profile mode is unavailable or blocked
- highlights still load from localStorage when Supabase highlight mode is unavailable or blocked
- opportunities still load from localStorage when Supabase opportunity mode is unavailable or blocked
- local/demo opportunity seed content still renders even when owned Supabase opportunities are active
- shortlist still loads from localStorage when Supabase shortlist mode is unavailable or blocked
- contact requests still load from localStorage when Supabase contact-request mode is unavailable or blocked
- admin queues still load from localStorage when Supabase admin queue mode is unavailable or blocked
- media metadata still falls back safely when Supabase media mode is unavailable or blocked
- private media upload helpers stay blocked when buckets are missing or policies are incomplete

## Security QA

- no password value appears in localStorage
- no Supabase service role key is used in frontend env files
- no public media URLs are exposed in this phase
- no public bucket browsing exists in this phase
- no public media browsing exists in this phase
- public video access remains disabled in this phase
- no direct messaging features appear
- no chat, comments, DMs, followers, or social feed features appear

## Product rule QA

- junior safety wording remains visible
- under-18 routes still go through parent or guardian
- clubs and scouts still use contact requests only
- exact addresses are not shown

## Media approval and display QA

- run `Media Approval Display Test` while signed in
- confirm the QA result shows:
  - initial approval status
  - approved status
  - rejected status
  - public URL created: `No`
  - signed preview available: `No` or `Metadata-only test` unless a real object exists
  - public access enabled: `No`
  - source used
  - any update error message
- confirm signed-in owner profile/resume surfaces only show approved private media through signed URLs
- confirm pending, rejected, or archived private media does not appear publicly
- confirm public unauthenticated media remains disabled
- confirm no public media URL or public video feed exists
