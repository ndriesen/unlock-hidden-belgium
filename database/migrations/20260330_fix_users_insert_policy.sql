-- Revert: Remove auto-creation of user records
-- Date: 2026-03-30

-- Drop the trigger and function that was trying to create user records
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
