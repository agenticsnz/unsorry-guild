-- REPAIR SCRIPT: Run this in Supabase SQL Editor if engagement tables don't exist
-- This creates all engagement tables (ADR-012) if they were not properly created by migrations

-- ============================================================
-- 1. skill_tier_config (Migration 126)
-- ============================================================
CREATE TABLE IF NOT EXISTS skill_tier_config (
  tier_level INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  min_points INTEGER NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'gray',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO skill_tier_config (tier_level, name, min_points, icon, color) VALUES
  (1, 'Apprentice', 0, 'Sprout', 'green'),
  (2, 'Journeyman', 300, 'TreeDeciduous', 'emerald'),
  (3, 'Expert', 600, 'Trees', 'teal'),
  (4, 'Master', 1200, 'Mountain', 'cyan'),
  (5, 'Legend', 2400, 'Crown', 'amber')
ON CONFLICT (tier_level) DO UPDATE SET
  name = EXCLUDED.name,
  min_points = EXCLUDED.min_points,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color;

-- ============================================================
-- 2. user_streaks (Migration 127)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_streaks (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  weekend_behavior TEXT NOT NULL DEFAULT 'weekends_count'
    CHECK (weekend_behavior IN ('weekends_count', 'weekends_freeze', 'weekends_optional')),
  timezone TEXT NOT NULL DEFAULT 'Pacific/Auckland',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_streaks_current ON user_streaks(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_user_streaks_longest ON user_streaks(longest_streak DESC);

-- ============================================================
-- 3. philosophy_quotes (Migration 128)
-- ============================================================
CREATE TABLE IF NOT EXISTS philosophy_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote TEXT NOT NULL,
  attribution TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_philosophy_quotes_active ON philosophy_quotes(is_active) WHERE is_active = true;

-- Seed quotes if table is empty
INSERT INTO philosophy_quotes (quote, attribution, is_active)
SELECT * FROM (VALUES
  ('The best way to predict the future is to create it.', 'Peter Drucker', true),
  ('In the age of AI, the most human skills become the most valuable.', 'Agentics NZ', true),
  ('Agents don''t replace humans; they amplify human potential.', 'Agentics NZ', true),
  ('The guild grows stronger when each member grows stronger.', NULL::TEXT, true),
  ('Every quest completed is a step toward mastery.', NULL::TEXT, true),
  ('Build with AI, build for humanity.', 'Agentics NZ', true),
  ('The future belongs to those who learn to work alongside intelligent systems.', 'Agentics NZ', true),
  ('Progress over perfection. Ship, learn, iterate.', NULL::TEXT, true),
  ('She''ll be right - but only if we make it right.', 'Agentics NZ', true),
  ('From apprentice to legend, one objective at a time.', NULL::TEXT, true),
  ('Your AI is only as good as your understanding of the problem.', 'Agentics NZ', true),
  ('Collaboration beats competition. The guild thrives together.', NULL::TEXT, true),
  ('Think global, build local. Kiwi innovation for the world.', 'Agentics NZ', true),
  ('The journey of a thousand tokens begins with a single prompt.', NULL::TEXT, true),
  ('Embrace the chaos of creation. Order emerges from iteration.', NULL::TEXT, true)
) AS v(quote, attribution, is_active)
WHERE NOT EXISTS (SELECT 1 FROM philosophy_quotes LIMIT 1);

-- ============================================================
-- 4. user_weekly_email_prefs (Migration 131)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_weekly_email_prefs (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  day_of_week INTEGER NOT NULL DEFAULT 1 CHECK (day_of_week BETWEEN 0 AND 6),
  send_time TIME NOT NULL DEFAULT '08:00',
  timezone TEXT NOT NULL DEFAULT 'Pacific/Auckland',
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_weekly_email_schedule ON user_weekly_email_prefs(enabled, day_of_week) WHERE enabled = true;

-- ============================================================
-- 5. gm_email_preferences (Migration 130)
-- ============================================================
CREATE TABLE IF NOT EXISTS gm_email_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  daily_digest_enabled BOOLEAN NOT NULL DEFAULT true,
  digest_send_time TIME NOT NULL DEFAULT '08:00',
  digest_timezone TEXT NOT NULL DEFAULT 'Pacific/Auckland',
  include_pending_reviews BOOLEAN NOT NULL DEFAULT true,
  include_upcoming_deadlines BOOLEAN NOT NULL DEFAULT true,
  include_recent_completions BOOLEAN NOT NULL DEFAULT true,
  include_activity_summary BOOLEAN NOT NULL DEFAULT true,
  last_digest_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. Add engagement columns to users table (Migration 129)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'show_activity_in_feed') THEN
    ALTER TABLE users ADD COLUMN show_activity_in_feed BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'show_streak_publicly') THEN
    ALTER TABLE users ADD COLUMN show_streak_publicly BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'enable_nudge_banners') THEN
    ALTER TABLE users ADD COLUMN enable_nudge_banners BOOLEAN DEFAULT true;
  END IF;
END $$;

-- ============================================================
-- 7. Initialize data for existing users
-- ============================================================
INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, weekend_behavior)
SELECT id, 0, 0, NULL, 'weekends_count'
FROM users
WHERE NOT EXISTS (SELECT 1 FROM user_streaks WHERE user_streaks.user_id = users.id)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_weekly_email_prefs (user_id, enabled, day_of_week, send_time, timezone)
SELECT id, true, 1, '08:00', 'Pacific/Auckland'
FROM users
WHERE NOT EXISTS (SELECT 1 FROM user_weekly_email_prefs WHERE user_weekly_email_prefs.user_id = users.id)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- 8. RLS Policies (Migration 134)
-- ============================================================
ALTER TABLE skill_tier_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE philosophy_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_weekly_email_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gm_email_preferences ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is GM (uses user_roles table)
CREATE OR REPLACE FUNCTION is_gm_or_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = check_user_id
    AND role IN ('gm', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- skill_tier_config: Read by anyone, write by GMs only
DROP POLICY IF EXISTS "Anyone can read skill tiers" ON skill_tier_config;
CREATE POLICY "Anyone can read skill tiers" ON skill_tier_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "GMs can manage skill tiers" ON skill_tier_config;
CREATE POLICY "GMs can manage skill tiers" ON skill_tier_config FOR ALL
  USING (is_gm_or_admin(auth.uid()));

-- user_streaks: Users can read/update their own
DROP POLICY IF EXISTS "Users can read own streak" ON user_streaks;
CREATE POLICY "Users can read own streak" ON user_streaks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own streak" ON user_streaks;
CREATE POLICY "Users can update own streak" ON user_streaks FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own streak" ON user_streaks;
CREATE POLICY "Users can insert own streak" ON user_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "GMs can read all streaks" ON user_streaks;
CREATE POLICY "GMs can read all streaks" ON user_streaks FOR SELECT
  USING (is_gm_or_admin(auth.uid()));

-- philosophy_quotes: Read by anyone, write by GMs
DROP POLICY IF EXISTS "Anyone can read active quotes" ON philosophy_quotes;
CREATE POLICY "Anyone can read active quotes" ON philosophy_quotes FOR SELECT
  USING (is_active = true OR is_gm_or_admin(auth.uid()));

DROP POLICY IF EXISTS "GMs can manage quotes" ON philosophy_quotes;
CREATE POLICY "GMs can manage quotes" ON philosophy_quotes FOR ALL
  USING (is_gm_or_admin(auth.uid()));

-- user_weekly_email_prefs: Users can manage their own
DROP POLICY IF EXISTS "Users can read own email prefs" ON user_weekly_email_prefs;
CREATE POLICY "Users can read own email prefs" ON user_weekly_email_prefs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own email prefs" ON user_weekly_email_prefs;
CREATE POLICY "Users can update own email prefs" ON user_weekly_email_prefs FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own email prefs" ON user_weekly_email_prefs;
CREATE POLICY "Users can insert own email prefs" ON user_weekly_email_prefs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "GMs can read all email prefs" ON user_weekly_email_prefs;
CREATE POLICY "GMs can read all email prefs" ON user_weekly_email_prefs FOR SELECT
  USING (is_gm_or_admin(auth.uid()));

-- gm_email_preferences: GMs can manage their own
DROP POLICY IF EXISTS "GMs can read own email prefs" ON gm_email_preferences;
CREATE POLICY "GMs can read own email prefs" ON gm_email_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "GMs can update own email prefs" ON gm_email_preferences;
CREATE POLICY "GMs can update own email prefs" ON gm_email_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Mark migration 137 as applied
INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('137')
ON CONFLICT DO NOTHING;

SELECT 'Engagement tables repair complete!' as result;
