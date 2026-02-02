-- Migration: 134_rls_engagement_tables.sql
-- Description: RLS policies for all engagement tables (ADR-012)

-- ============================================================
-- skill_tier_config - Everyone reads, GM writes
-- ============================================================
ALTER TABLE skill_tier_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "skill_tier_config_select_all" ON skill_tier_config;
CREATE POLICY "skill_tier_config_select_all" ON skill_tier_config
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "skill_tier_config_gm_all" ON skill_tier_config;
CREATE POLICY "skill_tier_config_gm_all" ON skill_tier_config
  FOR ALL USING (is_gm());

-- ============================================================
-- user_streaks - Users view own, GM views all
-- ============================================================
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_streaks_select_own" ON user_streaks;
CREATE POLICY "user_streaks_select_own" ON user_streaks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_streaks_update_own" ON user_streaks;
CREATE POLICY "user_streaks_update_own" ON user_streaks
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_streaks_gm_select" ON user_streaks;
CREATE POLICY "user_streaks_gm_select" ON user_streaks
  FOR SELECT USING (is_gm());

-- ============================================================
-- philosophy_quotes - Everyone reads active, GM manages all
-- ============================================================
ALTER TABLE philosophy_quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "philosophy_quotes_select_active" ON philosophy_quotes;
CREATE POLICY "philosophy_quotes_select_active" ON philosophy_quotes
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "philosophy_quotes_gm_select_all" ON philosophy_quotes;
CREATE POLICY "philosophy_quotes_gm_select_all" ON philosophy_quotes
  FOR SELECT USING (is_gm());

DROP POLICY IF EXISTS "philosophy_quotes_gm_insert" ON philosophy_quotes;
CREATE POLICY "philosophy_quotes_gm_insert" ON philosophy_quotes
  FOR INSERT WITH CHECK (is_gm());

DROP POLICY IF EXISTS "philosophy_quotes_gm_update" ON philosophy_quotes;
CREATE POLICY "philosophy_quotes_gm_update" ON philosophy_quotes
  FOR UPDATE USING (is_gm());

DROP POLICY IF EXISTS "philosophy_quotes_gm_delete" ON philosophy_quotes;
CREATE POLICY "philosophy_quotes_gm_delete" ON philosophy_quotes
  FOR DELETE USING (is_gm());

-- ============================================================
-- gm_email_preferences - GM manages own
-- ============================================================
ALTER TABLE gm_email_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gm_email_preferences_own" ON gm_email_preferences;
CREATE POLICY "gm_email_preferences_own" ON gm_email_preferences
  FOR ALL USING (auth.uid() = user_id AND is_gm())
  WITH CHECK (auth.uid() = user_id AND is_gm());

-- ============================================================
-- user_weekly_email_prefs - Users manage own, GM reads all
-- ============================================================
ALTER TABLE user_weekly_email_prefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_weekly_email_prefs_own" ON user_weekly_email_prefs;
CREATE POLICY "user_weekly_email_prefs_own" ON user_weekly_email_prefs
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_weekly_email_prefs_gm_select" ON user_weekly_email_prefs;
CREATE POLICY "user_weekly_email_prefs_gm_select" ON user_weekly_email_prefs
  FOR SELECT USING (is_gm());
