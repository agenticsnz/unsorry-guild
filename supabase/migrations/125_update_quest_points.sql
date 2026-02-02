-- Migration: 125_update_quest_points.sql
-- Description: Update quest points to support tier progression (ADR-012)
--
-- Quest point adjustments to enable meaningful tier progression:
-- - First Steps: 25 → 50 (entry quest)
-- - Agent Swarm Commander: 100 → 150 (technical challenge)
-- - The Sovereign Engine: 150 → 250 (advanced build)
-- - She'll Be Right Compliance: 125 → 350 (comprehensive compliance)
-- - The Mentor's Path: 150 → 500 (community contribution)
-- - Gorse Bot 3000: 200 → 500 (advanced project)
--
-- Total available: 2,100 points (Legend tier at 2,400 encourages future quests)

-- First Steps in the Realm: 25 → 50
UPDATE quests
SET points = 50, updated_at = now()
WHERE title = 'First Steps in the Realm'
  AND points = 25;

-- Also update objectives to sum to 50 (was 25)
-- Original: 5 + 5 + 10 + 5 = 25
-- New: 10 + 10 + 20 + 10 = 50
UPDATE objectives o
SET points = 10, updated_at = now()
FROM quests q
WHERE o.quest_id = q.id
  AND q.title = 'First Steps in the Realm'
  AND o.title = 'Join the Tribe'
  AND o.points = 5;

UPDATE objectives o
SET points = 10, updated_at = now()
FROM quests q
WHERE o.quest_id = q.id
  AND q.title = 'First Steps in the Realm'
  AND o.title = 'Know the Foundation'
  AND o.points = 5;

UPDATE objectives o
SET points = 20, updated_at = now()
FROM quests q
WHERE o.quest_id = q.id
  AND q.title = 'First Steps in the Realm'
  AND o.title = 'Attend Your First Hackerspace'
  AND o.points = 10;

UPDATE objectives o
SET points = 10, updated_at = now()
FROM quests q
WHERE o.quest_id = q.id
  AND q.title = 'First Steps in the Realm'
  AND o.title = 'Share a Spark'
  AND o.points = 5;

-- Agent Swarm Commander: 100 → 150
UPDATE quests
SET points = 150, updated_at = now()
WHERE title = 'Agent Swarm Commander'
  AND points = 100;

-- The Sovereign Engine: 150 → 250
UPDATE quests
SET points = 250, updated_at = now()
WHERE title = 'The Sovereign Engine'
  AND points = 150;

-- She'll Be Right Compliance: 125 → 350
UPDATE quests
SET points = 350, updated_at = now()
WHERE title = 'She''ll Be Right Compliance'
  AND points = 125;

-- The Mentor's Path: 150 → 500
UPDATE quests
SET points = 500, updated_at = now()
WHERE title = 'The Mentor''s Path'
  AND points = 150;

-- Gorse Bot 3000: 200 → 500
UPDATE quests
SET points = 500, updated_at = now()
WHERE title LIKE 'Gorse Bot 3000%'
  AND points = 200;

-- Add comment
COMMENT ON TABLE quests IS 'Quest definitions with engagement-optimized point values (ADR-012)';
