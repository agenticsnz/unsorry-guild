-- Migration: 132_add_hidden_achievements.sql
-- Description: Add hidden achievements support (ADR-012)
--
-- Hidden achievements are not revealed until earned.
-- Hint text can provide clues without revealing the full criteria.

-- Add columns for hidden achievements
ALTER TABLE achievements
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS hint TEXT;

COMMENT ON COLUMN achievements.is_hidden IS 'Whether achievement is hidden until earned';
COMMENT ON COLUMN achievements.hint IS 'Hint text for hidden achievements (shown before earned)';

-- Update existing achievements to not be hidden (explicit default)
UPDATE achievements SET is_hidden = false WHERE is_hidden IS NULL;
