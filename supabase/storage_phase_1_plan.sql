-- Supabase Storage Phase 1 Plan
-- Planning only. No executable bucket or public-access policy statements are enabled in this file.
-- Keep every bucket private by default until owner, parent/guardian, and admin review rules are fully confirmed.

-- Recommended future buckets:
-- insert into storage.buckets (id, name, public)
-- values
--   ('msr-profile-photos', 'msr-profile-photos', false),
--   ('msr-highlight-videos', 'msr-highlight-videos', false),
--   ('msr-highlight-thumbnails', 'msr-highlight-thumbnails', false),
--   ('msr-verification-docs', 'msr-verification-docs', false);

-- Recommended future owner upload policy pattern:
-- create policy "owners can upload profile photos"
-- on storage.objects
-- for insert
-- to authenticated
-- with check (
--   bucket_id = 'msr-profile-photos'
--   and owner = auth.uid()
-- );

-- Recommended future owner read policy pattern:
-- create policy "owners can read own private media"
-- on storage.objects
-- for select
-- to authenticated
-- using (
--   owner = auth.uid()
-- );

-- Recommended future owner delete policy pattern:
-- create policy "owners can delete own pending media"
-- on storage.objects
-- for delete
-- to authenticated
-- using (
--   owner = auth.uid()
-- );

-- Recommended future admin review read pattern:
-- do not enable until app-role-aware admin RLS is safely implemented.
-- admin review should prefer server-side checks or tightly scoped storage policies.

-- No public read policy in this phase.
-- No unauthenticated read policy in this phase.
-- No public CDN delivery in this phase.
-- No direct raw public URLs for private or pending media in this phase.

-- Future approved public access should use one of:
-- 1. short-lived signed URLs after approval-aware checks
-- 2. an Edge Function that resolves only approved assets
-- 3. a controlled public bucket copy step after explicit approval rules exist
