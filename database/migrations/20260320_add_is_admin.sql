-- Add is_admin column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Optional: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;

-- Admin can view all hotspots (pending, approved, private)
DROP POLICY IF EXISTS "hotspots_admin_all" ON public.hotspots;
CREATE POLICY "hotspots_admin_all" ON public.hotspots
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.is_admin = true
  )
);

-- To enable admin for a specific user, run:
-- UPDATE users SET is_admin = TRUE WHERE id = 'user-uuid-here';

