-- My Sports Resume
-- Private Supabase Storage Phase 1
-- Safe media uploads only:
-- - private profile photos
-- - private highlight thumbnails
-- No public buckets
-- No public read policies
-- No unauthenticated media access
-- No video uploads in this phase

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'msr-profile-photos',
    'msr-profile-photos',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'msr-highlight-thumbnails',
    'msr-highlight-thumbnails',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Future buckets remain commented only in this phase.
-- insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- values
--   (
--     'msr-highlight-videos',
--     'msr-highlight-videos',
--     false,
--     262144000,
--     array['video/mp4', 'video/quicktime', 'video/webm']
--   ),
--   (
--     'msr-verification-docs',
--     'msr-verification-docs',
--     false,
--     10485760,
--     array['application/pdf', 'image/jpeg', 'image/png']
--   )
-- on conflict (id) do nothing;

drop policy if exists "profile photos own insert" on storage.objects;
create policy "profile photos own insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'msr-profile-photos'
  and name like ('user/' || auth.uid()::text || '/%')
);

drop policy if exists "profile photos own select" on storage.objects;
create policy "profile photos own select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'msr-profile-photos'
  and name like ('user/' || auth.uid()::text || '/%')
);

drop policy if exists "profile photos own update" on storage.objects;
create policy "profile photos own update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'msr-profile-photos'
  and name like ('user/' || auth.uid()::text || '/%')
)
with check (
  bucket_id = 'msr-profile-photos'
  and name like ('user/' || auth.uid()::text || '/%')
);

drop policy if exists "profile photos own delete" on storage.objects;
create policy "profile photos own delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'msr-profile-photos'
  and name like ('user/' || auth.uid()::text || '/%')
);

drop policy if exists "highlight thumbnails own insert" on storage.objects;
create policy "highlight thumbnails own insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'msr-highlight-thumbnails'
  and name like ('user/' || auth.uid()::text || '/%')
);

drop policy if exists "highlight thumbnails own select" on storage.objects;
create policy "highlight thumbnails own select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'msr-highlight-thumbnails'
  and name like ('user/' || auth.uid()::text || '/%')
);

drop policy if exists "highlight thumbnails own update" on storage.objects;
create policy "highlight thumbnails own update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'msr-highlight-thumbnails'
  and name like ('user/' || auth.uid()::text || '/%')
)
with check (
  bucket_id = 'msr-highlight-thumbnails'
  and name like ('user/' || auth.uid()::text || '/%')
);

drop policy if exists "highlight thumbnails own delete" on storage.objects;
create policy "highlight thumbnails own delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'msr-highlight-thumbnails'
  and name like ('user/' || auth.uid()::text || '/%')
);

-- No public read policies in this phase.
-- No unauthenticated read policies in this phase.
-- No public signed URL sharing for unauthenticated users in this phase.
