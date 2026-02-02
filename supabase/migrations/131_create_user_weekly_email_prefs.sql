-- Migration: 131_create_user_weekly_email_prefs.sql
-- Description: Create user weekly progress email preferences (ADR-012, SPEC-012-F)
--
-- User preferences for weekly progress email including day of week, time, and timezone.
-- Default: Monday at 08:00 Pacific/Auckland

-- Drop if exists for idempotency
DROP TABLE IF EXISTS user_weekly_email_prefs CASCADE;

CREATE TABLE user_weekly_email_prefs (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  day_of_week INTEGER NOT NULL DEFAULT 1 CHECK (day_of_week BETWEEN 0 AND 6),
  send_time TIME NOT NULL DEFAULT '08:00',
  timezone TEXT NOT NULL DEFAULT 'Pacific/Auckland',
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE user_weekly_email_prefs IS 'User preferences for weekly progress email (ADR-012)';
COMMENT ON COLUMN user_weekly_email_prefs.enabled IS 'Whether user wants to receive weekly progress email';
COMMENT ON COLUMN user_weekly_email_prefs.day_of_week IS 'Day to send: 0=Sunday, 1=Monday, ..., 6=Saturday';
COMMENT ON COLUMN user_weekly_email_prefs.send_time IS 'Preferred send time in user timezone';
COMMENT ON COLUMN user_weekly_email_prefs.timezone IS 'Timezone for scheduling email delivery';
COMMENT ON COLUMN user_weekly_email_prefs.last_sent_at IS 'Timestamp of last weekly email sent';

-- Index for efficient scheduling queries
CREATE INDEX idx_user_weekly_email_schedule ON user_weekly_email_prefs(enabled, day_of_week) WHERE enabled = true;

-- Initialize preferences for existing users
INSERT INTO user_weekly_email_prefs (user_id)
SELECT id FROM users
WHERE NOT EXISTS (SELECT 1 FROM user_weekly_email_prefs WHERE user_id = users.id)
ON CONFLICT (user_id) DO NOTHING;

-- Function to auto-create preferences for new users
CREATE OR REPLACE FUNCTION auto_create_user_weekly_email_prefs()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_weekly_email_prefs (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_weekly_email_prefs_on_user ON users;
CREATE TRIGGER create_weekly_email_prefs_on_user
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_user_weekly_email_prefs();

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_user_weekly_email_prefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_weekly_email_prefs_updated_at
  BEFORE UPDATE ON user_weekly_email_prefs
  FOR EACH ROW
  EXECUTE FUNCTION update_user_weekly_email_prefs_updated_at();
