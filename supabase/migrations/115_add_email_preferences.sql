-- Migration: 115_add_email_preferences
-- Description: Add email notification preferences to privacy_settings
-- Feature: Email Notification System for approval/rejection/completion emails

-- Add email_notifications column to privacy_settings
ALTER TABLE privacy_settings
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE;

-- Comment
COMMENT ON COLUMN privacy_settings.email_notifications IS 'Whether to receive email notifications for quest-related events (approvals, completions, messages)';

-- Update existing rows to have email_notifications enabled by default
UPDATE privacy_settings
SET email_notifications = TRUE
WHERE email_notifications IS NULL;
