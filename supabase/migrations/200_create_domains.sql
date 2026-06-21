-- Migration: 200_create_domains
-- Description: Domain registry for the guild overlay (ADR-017 / ADR-030 seam)
-- Specification: SPEC-018-A-Prize-Model

CREATE TABLE domains (
  id TEXT PRIMARY KEY,            -- e.g. 'math'
  name TEXT NOT NULL,
  url_slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE domains ENABLE ROW LEVEL SECURITY;

-- Public read; admin/gm write.
CREATE POLICY domains_select_all ON domains FOR SELECT USING (true);
CREATE POLICY domains_write_admin ON domains FOR ALL USING (is_gm()) WITH CHECK (is_gm());

INSERT INTO domains (id, name, url_slug, sort_order)
VALUES ('math', 'Math', 'math', 0)
ON CONFLICT (id) DO NOTHING;
