-- Add highlight functionality to trip media
-- Date: 2026-03-26

-- Add is_highlight column to trip_media table
alter table if exists public.trip_media
add column if not exists is_highlight boolean not null default false;

-- Create index for faster queries on highlights
create index if not exists idx_trip_media_is_highlight on public.trip_media (is_highlight) where is_highlight = true;

-- Update RLS policies to allow updating is_highlight
drop policy if exists "trip_media_update_own" on public.trip_media;
create policy "trip_media_update_own" on public.trip_media
for update using (uploaded_by = auth.uid()) with check (uploaded_by = auth.uid());

