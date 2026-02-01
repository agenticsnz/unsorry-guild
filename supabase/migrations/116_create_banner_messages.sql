-- Migration: 116_create_banner_messages
-- Description: Create banner_messages and banner_dismissals tables
-- ADR: ADR-011-Banner-Message-System
-- Feature: Global announcements, private messages, and system celebration banners

-- Create banner_messages table
CREATE TABLE banner_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Targeting
  target_type TEXT NOT NULL CHECK (target_type IN ('global', 'user', 'system')),
  target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- NULL for global

  -- Content
  title TEXT,
  message TEXT NOT NULL,
  variant TEXT DEFAULT 'info' CHECK (variant IN ('info', 'success', 'warning', 'celebration')),

  -- Email toggle
  also_send_email BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,

  -- Lifecycle
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,  -- Optional expiry

  -- Reference (for system banners like quest completion)
  reference_type TEXT,  -- 'quest_completion', 'achievement', etc.
  reference_id UUID     -- The related entity ID
);

-- Create banner_dismissals table
CREATE TABLE banner_dismissals (
  banner_id UUID NOT NULL REFERENCES banner_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (banner_id, user_id)
);

-- Indexes for efficient querying
CREATE INDEX idx_banner_messages_target_type ON banner_messages(target_type);
CREATE INDEX idx_banner_messages_target_user ON banner_messages(target_user_id) WHERE target_user_id IS NOT NULL;
CREATE INDEX idx_banner_messages_created_at ON banner_messages(created_at DESC);
CREATE INDEX idx_banner_messages_expires_at ON banner_messages(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_banner_dismissals_user ON banner_dismissals(user_id);

-- Comments
COMMENT ON TABLE banner_messages IS 'Banner messages for announcements, private messages, and system notifications';
COMMENT ON COLUMN banner_messages.target_type IS 'global = all users, user = specific user, system = auto-generated';
COMMENT ON COLUMN banner_messages.target_user_id IS 'Target user for private messages (NULL for global/system)';
COMMENT ON COLUMN banner_messages.variant IS 'Visual style: info (blue), success (green), warning (amber), celebration (gold)';
COMMENT ON COLUMN banner_messages.also_send_email IS 'Whether to also send an email notification';
COMMENT ON COLUMN banner_messages.reference_type IS 'For system banners: quest_completion, achievement, etc.';
COMMENT ON COLUMN banner_messages.reference_id IS 'The ID of the referenced entity (quest, achievement, etc.)';

COMMENT ON TABLE banner_dismissals IS 'Tracks which users have dismissed which banners';
