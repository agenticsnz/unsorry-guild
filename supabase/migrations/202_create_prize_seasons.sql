-- Migration: 202_create_prize_seasons
-- Description: A prize season; closes when the headline goal is proved (admin-confirmed). ADR-018.
-- Specification: SPEC-018-A-Prize-Model

CREATE TABLE prize_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prize_id UUID NOT NULL REFERENCES prizes(id) ON DELETE CASCADE,
  opened_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  headline_status_at_close TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_prize_seasons_prize ON prize_seasons(prize_id);

ALTER TABLE prize_seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY prize_seasons_select_all ON prize_seasons FOR SELECT USING (true);
CREATE POLICY prize_seasons_write_admin ON prize_seasons FOR ALL USING (is_gm()) WITH CHECK (is_gm());
