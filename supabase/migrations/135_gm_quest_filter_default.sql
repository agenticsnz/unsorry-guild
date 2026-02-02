-- Migration: 135_gm_quest_filter_default.sql
-- Description: Add default quest filter preference for GM view (ADR-012)
--
-- GMs requested default view to show "published" quests instead of "all".
-- This column stores the GM's preferred default filter.

-- Add column to store GM's preferred quest filter default
ALTER TABLE gm_email_preferences
ADD COLUMN IF NOT EXISTS default_quest_filter TEXT NOT NULL DEFAULT 'published'
  CHECK (default_quest_filter IN ('all', 'draft', 'published', 'archived'));

COMMENT ON COLUMN gm_email_preferences.default_quest_filter IS 'Default status filter for GM quest list view';
