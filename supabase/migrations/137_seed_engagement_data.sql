-- Migration: 137_seed_engagement_data.sql
-- Description: Seed engagement tables with initial data (ADR-012)
-- This migration ensures all engagement tables have required seed data

-- ============================================================
-- Seed skill_tier_config (if empty)
-- ============================================================
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
-- Seed philosophy_quotes (if empty)
-- ============================================================
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
-- Create user_streaks entries for existing users (if not exists)
-- ============================================================
INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, weekend_behavior)
SELECT
  u.id,
  0,
  0,
  NULL,
  'weekends_count'
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_streaks us WHERE us.user_id = u.id
);

-- ============================================================
-- Create user_weekly_email_prefs for existing users (if not exists)
-- ============================================================
INSERT INTO user_weekly_email_prefs (user_id, enabled, day_of_week, send_time, timezone)
SELECT
  u.id,
  true,
  1,  -- Monday
  '08:00',
  'Pacific/Auckland'
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_weekly_email_prefs p WHERE p.user_id = u.id
);

-- ============================================================
-- Ensure engagement columns exist on users table with defaults
-- ============================================================
UPDATE users SET
  show_activity_in_feed = COALESCE(show_activity_in_feed, true),
  show_streak_publicly = COALESCE(show_streak_publicly, true),
  enable_nudge_banners = COALESCE(enable_nudge_banners, true)
WHERE show_activity_in_feed IS NULL
   OR show_streak_publicly IS NULL
   OR enable_nudge_banners IS NULL;
