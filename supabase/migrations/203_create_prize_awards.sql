-- Migration: 203_create_prize_awards
-- Description: Frozen podium/contributor awards for a closed season. ADR-018.
-- Specification: SPEC-018-A-Prize-Model

CREATE TABLE prize_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES prize_seasons(id) ON DELETE CASCADE,
  github TEXT NOT NULL,                       -- GitHub handle (identity per ADR-016)
  place INTEGER CHECK (place BETWEEN 1 AND 3), -- 1/2/3, NULL for plain contributor
  is_contributor BOOLEAN NOT NULL DEFAULT false,
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (season_id, github)
);

CREATE INDEX idx_prize_awards_season ON prize_awards(season_id);
CREATE INDEX idx_prize_awards_github ON prize_awards(github);

ALTER TABLE prize_awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY prize_awards_select_all ON prize_awards FOR SELECT USING (true);
CREATE POLICY prize_awards_write_admin ON prize_awards FOR ALL USING (is_gm()) WITH CHECK (is_gm());
