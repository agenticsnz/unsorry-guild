-- Add featured_image_url column to quests table
-- This stores the URL of the featured image displayed in quest detail view

ALTER TABLE quests ADD COLUMN IF NOT EXISTS featured_image_url TEXT;
COMMENT ON COLUMN quests.featured_image_url IS 'URL of the featured image displayed in quest detail view';
