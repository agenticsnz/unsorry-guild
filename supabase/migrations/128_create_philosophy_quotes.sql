-- Migration: 128_create_philosophy_quotes.sql
-- Description: Create philosophy quotes table with Agentics NZ seeds (ADR-012, SPEC-012-D)
--
-- Rotating quotes displayed on the dashboard to inspire guild members.
-- GM can manage quotes via admin interface.

-- Drop if exists for idempotency
DROP TABLE IF EXISTS philosophy_quotes CASCADE;

CREATE TABLE philosophy_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote TEXT NOT NULL,
  attribution TEXT,  -- NULL for anonymous/guild quotes
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER,  -- NULL for random rotation, set for fixed order
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE philosophy_quotes IS 'Rotating quotes displayed on the dashboard (ADR-012)';
COMMENT ON COLUMN philosophy_quotes.quote IS 'The quote text';
COMMENT ON COLUMN philosophy_quotes.attribution IS 'Quote author or source (NULL for anonymous)';
COMMENT ON COLUMN philosophy_quotes.is_active IS 'Whether quote is included in rotation';
COMMENT ON COLUMN philosophy_quotes.display_order IS 'Fixed order if set, random rotation if NULL';

-- Index for efficient active quote queries
CREATE INDEX idx_philosophy_quotes_active ON philosophy_quotes(is_active) WHERE is_active = true;
CREATE INDEX idx_philosophy_quotes_order ON philosophy_quotes(display_order) WHERE display_order IS NOT NULL;

-- Seed Agentics NZ quotes
INSERT INTO philosophy_quotes (quote, attribution, is_active) VALUES
  ('The best way to predict the future is to create it.', 'Peter Drucker', true),
  ('In the age of AI, the most human skills become the most valuable.', 'Agentics NZ', true),
  ('Agents don''t replace humans; they amplify human potential.', 'Agentics NZ', true),
  ('The guild grows stronger when each member grows stronger.', NULL, true),
  ('Every quest completed is a step toward mastery.', NULL, true),
  ('Build with AI, build for humanity.', 'Agentics NZ', true),
  ('The future belongs to those who learn to work alongside intelligent systems.', 'Agentics NZ', true),
  ('Progress over perfection. Ship, learn, iterate.', NULL, true),
  ('She''ll be right - but only if we make it right.', 'Agentics NZ', true),
  ('From apprentice to legend, one objective at a time.', NULL, true),
  ('Your AI is only as good as your understanding of the problem.', 'Agentics NZ', true),
  ('Collaboration beats competition. The guild thrives together.', NULL, true),
  ('Think global, build local. Kiwi innovation for the world.', 'Agentics NZ', true),
  ('The journey of a thousand tokens begins with a single prompt.', NULL, true),
  ('Embrace the chaos of creation. Order emerges from iteration.', NULL, true);

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_philosophy_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER philosophy_quotes_updated_at
  BEFORE UPDATE ON philosophy_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_philosophy_quotes_updated_at();
