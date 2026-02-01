-- Migration: 118_create_quest_prerequisites
-- Description: Create quest_prerequisites table for quest dependency chains
-- ADR: ADR-010-Quest-Dependencies
-- Feature: Quest dependencies with AND logic (must complete ALL prerequisites)

-- Create quest_prerequisites junction table
CREATE TABLE quest_prerequisites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  prerequisite_quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent duplicate entries
  UNIQUE(quest_id, prerequisite_quest_id),

  -- Prevent self-reference
  CHECK (quest_id != prerequisite_quest_id)
);

-- Indexes for efficient lookups
CREATE INDEX idx_quest_prerequisites_quest ON quest_prerequisites(quest_id);
CREATE INDEX idx_quest_prerequisites_prereq ON quest_prerequisites(prerequisite_quest_id);

-- Comments
COMMENT ON TABLE quest_prerequisites IS 'Quest prerequisite relationships. A quest requires ALL its prerequisites to be completed (AND logic).';
COMMENT ON COLUMN quest_prerequisites.quest_id IS 'The quest that has prerequisites';
COMMENT ON COLUMN quest_prerequisites.prerequisite_quest_id IS 'The quest that must be completed first';
