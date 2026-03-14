-- Fix storage upload policy to allow authenticated users to upload to their own folder
-- Date: 2026-03-25

-- Drop the restrictive upload policy that requires owner = auth.uid()
drop policy if exists "spotly_media_upload" on storage.objects;

-- Create a more permissive upload policy that:
-- 1. Checks the bucket is spotly-media
-- 2. The storage path must start with their user ID (already enforced by the code)
create policy "spotly_media_upload" on storage.objects
for insert with check (
  bucket_id = 'spotly-media'
  and name like concat(auth.uid()::text, '/%')
);

-- Fix the read policy to allow users to read their own uploads
drop policy if exists "spotly_media_read" on storage.objects;
create policy "spotly_media_read" on storage.objects
for select using (
  bucket_id = 'spotly-media'
  and (
    -- User can read files they uploaded (path starts with their user ID)
    name like concat(auth.uid()::text, '/%')
    -- Or allow all authenticated users to read (for sharing)
    or auth.role() = 'authenticated'
  )
);

-- Also fix the update and delete policies to be more permissive
drop policy if exists "spotly_media_update_owner" on storage.objects;
create policy "spotly_media_update_owner" on storage.objects
for update using (
  bucket_id = 'spotly-media'
  and name like concat(auth.uid()::text, '/%')
);

drop policy if exists "spotly_media_delete_owner" on storage.objects;
create policy "spotly_media_delete_owner" on storage.objects
for delete using (
  bucket_id = 'spotly-media'
  and name like concat(auth.uid()::text, '/%')
);

