-- Migration: 201_create_prizes
-- Description: Prizes = flagship targets (a headline goal id + its subtree). ADR-018.
-- Specification: SPEC-018-A-Prize-Model

CREATE TABLE prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id TEXT NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  headline_goal_id TEXT NOT NULL UNIQUE,   -- git join key (unsorry goal id)
  title TEXT NOT NULL,
  description TEXT,
  badge_emoji TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_prizes_domain ON prizes(domain_id);

ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY prizes_select_all ON prizes FOR SELECT USING (true);
CREATE POLICY prizes_write_admin ON prizes FOR ALL USING (is_gm()) WITH CHECK (is_gm());
