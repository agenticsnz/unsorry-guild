-- Migration: 120_rls_quest_prerequisites
-- Description: Row Level Security for quest_prerequisites
-- ADR: ADR-010-Quest-Dependencies

-- Enable RLS
ALTER TABLE quest_prerequisites ENABLE ROW LEVEL SECURITY;

-- Everyone can read prerequisites (needed to show locked quests)
CREATE POLICY "Anyone can read quest prerequisites"
  ON quest_prerequisites
  FOR SELECT
  TO authenticated
  USING (true);

-- Only GMs can create prerequisites
CREATE POLICY "GMs can create prerequisites"
  ON quest_prerequisites
  FOR INSERT
  TO authenticated
  WITH CHECK (is_gm());

-- Only GMs can delete prerequisites
CREATE POLICY "GMs can delete prerequisites"
  ON quest_prerequisites
  FOR DELETE
  TO authenticated
  USING (is_gm());

-- No update needed - delete and recreate instead
