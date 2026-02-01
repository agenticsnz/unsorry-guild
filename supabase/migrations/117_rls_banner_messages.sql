-- Migration: 117_rls_banner_messages
-- Description: Row Level Security for banner_messages and banner_dismissals
-- ADR: ADR-011-Banner-Message-System

-- Enable RLS
ALTER TABLE banner_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE banner_dismissals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for idempotent re-runs
DROP POLICY IF EXISTS "Users can read relevant banners" ON banner_messages;
DROP POLICY IF EXISTS "GMs can read all banners" ON banner_messages;
DROP POLICY IF EXISTS "GMs can create banners" ON banner_messages;
DROP POLICY IF EXISTS "GMs can update own banners" ON banner_messages;
DROP POLICY IF EXISTS "GMs can delete own banners" ON banner_messages;
DROP POLICY IF EXISTS "System can create system banners" ON banner_messages;
DROP POLICY IF EXISTS "Users can read own dismissals" ON banner_dismissals;
DROP POLICY IF EXISTS "Users can dismiss banners" ON banner_dismissals;
DROP POLICY IF EXISTS "Users can delete own dismissals" ON banner_dismissals;
DROP POLICY IF EXISTS "GMs can view all dismissals" ON banner_dismissals;

-- ===========================================
-- BANNER MESSAGES POLICIES
-- ===========================================

-- Users can read global banners, system banners targeted to them, and private banners for them
CREATE POLICY "Users can read relevant banners"
  ON banner_messages
  FOR SELECT
  TO authenticated
  USING (
    target_type = 'global'
    OR (target_type = 'user' AND target_user_id = auth.uid())
    OR (target_type = 'system' AND (target_user_id = auth.uid() OR target_user_id IS NULL))
  );

-- GMs can read all banners
CREATE POLICY "GMs can read all banners"
  ON banner_messages
  FOR SELECT
  TO authenticated
  USING (is_gm());

-- GMs can create banners
CREATE POLICY "GMs can create banners"
  ON banner_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (is_gm());

-- GMs can update banners they created
CREATE POLICY "GMs can update own banners"
  ON banner_messages
  FOR UPDATE
  TO authenticated
  USING (is_gm() AND created_by = auth.uid())
  WITH CHECK (is_gm() AND created_by = auth.uid());

-- GMs can delete banners they created
CREATE POLICY "GMs can delete own banners"
  ON banner_messages
  FOR DELETE
  TO authenticated
  USING (is_gm() AND created_by = auth.uid());

-- System can insert system banners (for triggers)
CREATE POLICY "System can create system banners"
  ON banner_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (target_type = 'system' AND created_by IS NULL);

-- ===========================================
-- BANNER DISMISSALS POLICIES
-- ===========================================

-- Users can read their own dismissals
CREATE POLICY "Users can read own dismissals"
  ON banner_dismissals
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can dismiss banners (insert their dismissal)
CREATE POLICY "Users can dismiss banners"
  ON banner_dismissals
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can delete their dismissals (un-dismiss, if needed)
CREATE POLICY "Users can delete own dismissals"
  ON banner_dismissals
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- GMs can view all dismissals for analytics
CREATE POLICY "GMs can view all dismissals"
  ON banner_dismissals
  FOR SELECT
  TO authenticated
  USING (is_gm());
