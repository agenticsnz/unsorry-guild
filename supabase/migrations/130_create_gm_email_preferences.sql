-- Migration: 130_create_gm_email_preferences.sql
-- Description: Create GM email preferences table (ADR-012, SPEC-012-E)
--
-- GM preferences for daily digest email including send time and timezone.

-- Drop if exists for idempotency
DROP TABLE IF EXISTS gm_email_preferences CASCADE;

CREATE TABLE gm_email_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  daily_digest_enabled BOOLEAN NOT NULL DEFAULT true,
  digest_time TIME NOT NULL DEFAULT '08:00',
  timezone TEXT NOT NULL DEFAULT 'Pacific/Auckland',
  last_digest_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE gm_email_preferences IS 'Email preferences for Game Masters (ADR-012)';
COMMENT ON COLUMN gm_email_preferences.daily_digest_enabled IS 'Whether to receive daily digest email';
COMMENT ON COLUMN gm_email_preferences.digest_time IS 'Preferred time to receive daily digest';
COMMENT ON COLUMN gm_email_preferences.timezone IS 'Timezone for scheduling email delivery';
COMMENT ON COLUMN gm_email_preferences.last_digest_sent_at IS 'Timestamp of last digest email sent';

-- Initialize preferences for existing GMs
INSERT INTO gm_email_preferences (user_id)
SELECT ur.user_id
FROM user_roles ur
WHERE ur.role = 'gm'
  AND NOT EXISTS (SELECT 1 FROM gm_email_preferences WHERE user_id = ur.user_id)
ON CONFLICT (user_id) DO NOTHING;

-- Function to auto-create preferences for new GMs
CREATE OR REPLACE FUNCTION auto_create_gm_email_preferences()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'gm' THEN
    INSERT INTO gm_email_preferences (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_gm_email_preferences_on_role ON user_roles;
CREATE TRIGGER create_gm_email_preferences_on_role
  AFTER INSERT ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_gm_email_preferences();

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_gm_email_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gm_email_preferences_updated_at
  BEFORE UPDATE ON gm_email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_gm_email_preferences_updated_at();
