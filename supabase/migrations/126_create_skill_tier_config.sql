-- Migration: 126_create_skill_tier_config.sql
-- Description: Create skill tier configuration table (ADR-012, SPEC-012-A)
--
-- Tier thresholds are GM-configurable:
-- - Apprentice: 0 points (starting tier)
-- - Journeyman: 300 points
-- - Expert: 600 points
-- - Master: 1,200 points
-- - Legend: 2,400 points

-- Drop if exists for idempotency
DROP TABLE IF EXISTS skill_tier_config CASCADE;

CREATE TABLE skill_tier_config (
  tier_level INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  min_points INTEGER NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'gray',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE skill_tier_config IS 'GM-configurable skill tier thresholds and display settings (ADR-012)';
COMMENT ON COLUMN skill_tier_config.tier_level IS 'Tier level (1-5), lower = beginner';
COMMENT ON COLUMN skill_tier_config.name IS 'Display name for the tier';
COMMENT ON COLUMN skill_tier_config.min_points IS 'Minimum points required to achieve this tier';
COMMENT ON COLUMN skill_tier_config.icon IS 'Lucide icon name for tier display';
COMMENT ON COLUMN skill_tier_config.color IS 'Tailwind color name for tier styling';

-- Seed default tier configuration
INSERT INTO skill_tier_config (tier_level, name, min_points, icon, color) VALUES
  (1, 'Apprentice', 0, 'Sprout', 'green'),
  (2, 'Journeyman', 300, 'TreeDeciduous', 'emerald'),
  (3, 'Expert', 600, 'Trees', 'teal'),
  (4, 'Master', 1200, 'Mountain', 'cyan'),
  (5, 'Legend', 2400, 'Crown', 'amber');

-- Create index for efficient tier lookup
CREATE INDEX idx_skill_tier_config_points ON skill_tier_config(min_points DESC);

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_skill_tier_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER skill_tier_config_updated_at
  BEFORE UPDATE ON skill_tier_config
  FOR EACH ROW
  EXECUTE FUNCTION update_skill_tier_config_updated_at();
