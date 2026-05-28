-- My Sports Resume
-- Private Highlight Video Upload Phase 1
-- Signed-in owner testing only
-- No public URLs
-- No public video feed
-- No unauthenticated access

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'msr-highlight-videos',
  'msr-highlight-videos',
  false,
  104857600,
  array['video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "highlight videos own insert" on storage.objects;
create policy "highlight videos own insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'msr-highlight-videos'
  and (storage.foldername(name))[1] = 'user'
  and (storage.foldername(name))[2] = auth.uid()::text
  and (storage.foldername(name))[3] = 'highlights'
  and coalesce(array_length(storage.foldername(name), 1), 0) >= 4
);

drop policy if exists "highlight videos own select" on storage.objects;
create policy "highlight videos own select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'msr-highlight-videos'
  and (storage.foldername(name))[1] = 'user'
  and (storage.foldername(name))[2] = auth.uid()::text
  and (storage.foldername(name))[3] = 'highlights'
  and coalesce(array_length(storage.foldername(name), 1), 0) >= 4
);

drop policy if exists "highlight videos own update" on storage.objects;
create policy "highlight videos own update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'msr-highlight-videos'
  and (storage.foldername(name))[1] = 'user'
  and (storage.foldername(name))[2] = auth.uid()::text
  and (storage.foldername(name))[3] = 'highlights'
  and coalesce(array_length(storage.foldername(name), 1), 0) >= 4
)
with check (
  bucket_id = 'msr-highlight-videos'
  and (storage.foldername(name))[1] = 'user'
  and (storage.foldername(name))[2] = auth.uid()::text
  and (storage.foldername(name))[3] = 'highlights'
  and coalesce(array_length(storage.foldername(name), 1), 0) >= 4
);

drop policy if exists "highlight videos own delete" on storage.objects;
create policy "highlight videos own delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'msr-highlight-videos'
  and (storage.foldername(name))[1] = 'user'
  and (storage.foldername(name))[2] = auth.uid()::text
  and (storage.foldername(name))[3] = 'highlights'
  and coalesce(array_length(storage.foldername(name), 1), 0) >= 4
);

-- No public read policies in this phase.
-- No unauthenticated read policies in this phase.
-- No public signed URL sharing in this phase.

notify pgrst, 'reload schema';
