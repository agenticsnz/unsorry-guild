-- Migration: 129_add_engagement_preferences.sql
-- Description: Add engagement preferences to users (ADR-012)
--
-- User preferences for engagement features like activity sharing and nudge banners.

-- Add engagement preference columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS show_activity_in_feed BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS show_streak_publicly BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_nudge_banners BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN users.show_activity_in_feed IS 'Whether user activity appears in guild activity feed';
COMMENT ON COLUMN users.show_streak_publicly IS 'Whether streak is visible on public profile';
COMMENT ON COLUMN users.enable_nudge_banners IS 'Whether to show nudge banners on dashboard';
