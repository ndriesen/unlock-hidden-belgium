-- Migration: Fix broken admin RLS policy
-- Date: 2026-03-27
-- Issue: Admin policy was checking raw_user_meta_data instead of is_admin column

-- Fix the broken admin policy to use the is_admin column correctly
DROP POLICY IF EXISTS "hotspots_admin_all" ON public.hotspots;
CREATE POLICY "hotspots_admin_all" ON public.hotspots
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
);

-- Enable RLS on users table
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users
FOR SELECT USING (id = auth.uid());

-- Users can update their own profile
DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Enable RLS on user_hotspots table
ALTER TABLE IF EXISTS public.user_hotspots ENABLE ROW LEVEL SECURITY;

-- Users can only read their own hotspot associations
DROP POLICY IF EXISTS "user_hotspots_select_own" ON public.user_hotspots;
CREATE POLICY "user_hotspots_select_own" ON public.user_hotspots
FOR SELECT USING (user_id = auth.uid());

-- Users can only insert their own hotspot associations
DROP POLICY IF EXISTS "user_hotspots_insert_own" ON public.user_hotspots;
CREATE POLICY "user_hotspots_insert_own" ON public.user_hotspots
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can only update their own hotspot associations
DROP POLICY IF EXISTS "user_hotspots_update_own" ON public.user_hotspots;
CREATE POLICY "user_hotspots_update_own" ON public.user_hotspots
FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Enable RLS on user_badges table
ALTER TABLE IF EXISTS public.user_badges ENABLE ROW LEVEL SECURITY;

-- Users can only read their own badges
DROP POLICY IF EXISTS "user_badges_select_own" ON public.user_badges;
CREATE POLICY "user_badges_select_own" ON public.user_badges
FOR SELECT USING (user_id = auth.uid());

-- Users can only insert their own badges
DROP POLICY IF EXISTS "user_badges_insert_own" ON public.user_badges;
CREATE POLICY "user_badges_insert_own" ON public.user_badges
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Enable RLS on reviews table
ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews (public content)
DROP POLICY IF EXISTS "reviews_select_public" ON public.reviews;
CREATE POLICY "reviews_select_public" ON public.reviews
FOR SELECT USING (visibility = 'public');

-- Users can read their own reviews
DROP POLICY IF EXISTS "reviews_select_own" ON public.reviews;
CREATE POLICY "reviews_select_own" ON public.reviews
FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own reviews
DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
CREATE POLICY "reviews_insert_own" ON public.reviews
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own reviews
DROP POLICY IF EXISTS "reviews_update_own" ON public.reviews;
CREATE POLICY "reviews_update_own" ON public.reviews
FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Enable RLS on activities table
ALTER TABLE IF EXISTS public.activities ENABLE ROW LEVEL SECURITY;

-- Anyone can read public activities
DROP POLICY IF EXISTS "activities_select_public" ON public.activities;
CREATE POLICY "activities_select_public" ON public.activities
FOR SELECT USING (visibility = 'public');

-- Users can read their own activities
DROP POLICY IF EXISTS "activities_select_own" ON public.activities;
CREATE POLICY "activities_select_own" ON public.activities
FOR SELECT USING (actor_id = auth.uid());

-- Users can insert their own activities
DROP POLICY IF EXISTS "activities_insert_own" ON public.activities;
CREATE POLICY "activities_insert_own" ON public.activities
FOR INSERT WITH CHECK (actor_id = auth.uid());

