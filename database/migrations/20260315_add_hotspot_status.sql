-- Migration: Add hotspot status and improve schema
-- Date: 2026-03-15

-- 1) Add status column to hotspots table if not exists
ALTER TABLE IF EXISTS public.hotspots 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' 
CHECK (status IN ('private', 'pending', 'approved'));

-- 2) Add created_by column to link hotspots to users
ALTER TABLE IF EXISTS public.hotspots 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- 3) Add images column as TEXT array
ALTER TABLE IF EXISTS public.hotspots 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- 4) Update user_hotspots to be a proper linking table
-- First, let's check if we need to migrate existing data

-- Add unique constraint for user_hotspots if not exists
ALTER TABLE IF EXISTS public.user_hotspots 
ADD CONSTRAINT IF NOT EXISTS unique_user_hotspot PRIMARY KEY (user_id, hotspot_id);

-- Add status tracking columns to user_hotspots
ALTER TABLE IF EXISTS public.user_hotspots 
ADD COLUMN IF NOT EXISTS visited_at TIMESTAMP WITH TIME ZONE;

-- 5) Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hotspots_status ON public.hotspots (status);
CREATE INDEX IF NOT EXISTS idx_hotspots_created_by ON public.hotspots (created_by);
CREATE INDEX IF NOT EXISTS idx_hotspots_name_province ON public.hotspots (lower(name), lower(province));

-- 6) Enable RLS on hotspots (if not already enabled)
ALTER TABLE IF EXISTS public.hotspots ENABLE ROW LEVEL SECURITY;

-- 7) RLS policies for hotspots
-- Everyone can read approved hotspots
DROP POLICY IF EXISTS "hotspots_select_approved" ON public.hotspots;
CREATE POLICY "hotspots_select_approved" ON public.hotspots
FOR SELECT USING (status = 'approved');

-- Users can read their own hotspots (private + pending + approved)
DROP POLICY IF EXISTS "hotspots_select_own" ON public.hotspots;
CREATE POLICY "hotspots_select_own" ON public.hotspots
FOR SELECT USING (created_by = auth.uid());

-- Users can insert their own hotspots
DROP POLICY IF EXISTS "hotspots_insert_own" ON public.hotspots;
CREATE POLICY "hotspots_insert_own" ON public.hotspots
FOR INSERT WITH CHECK (created_by = auth.uid());

-- Users can update their own hotspots
DROP POLICY IF EXISTS "hotspots_update_own" ON public.hotspots;
CREATE POLICY "hotspots_update_own" ON public.hotspots
FOR UPDATE USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- Users can delete their own hotspots
DROP POLICY IF EXISTS "hotspots_delete_own" ON public.hotspots;
CREATE POLICY "hotspots_delete_own" ON public.hotspots
FOR DELETE USING (created_by = auth.uid());

-- Admin can do everything (you may need to add a role check)
DROP POLICY IF EXISTS "hotspots_admin_all" ON public.hotspots;
CREATE POLICY "hotspots_admin_all" ON public.hotspots
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'role') = 'admin'
  )
);

