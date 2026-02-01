-- Migration: 114_fix_first_steps_deadline
-- Description: Remove deadline from First Steps quest (Issue #10)
-- Problem: Quest has 7-day deadline but Objective 3 requires monthly event attendance
-- Solution: Set completion_days to NULL for self-paced progression

-- Update existing First Steps quest to have no deadline
UPDATE quests
SET
  completion_days = NULL,
  updated_at = now()
WHERE title = 'First Steps in the Realm';

-- Also update any active user_quests to remove deadline
UPDATE user_quests uq
SET
  deadline = NULL,
  updated_at = now()
FROM quests q
WHERE uq.quest_id = q.id
  AND q.title = 'First Steps in the Realm'
  AND uq.status NOT IN ('completed', 'abandoned');

COMMENT ON TABLE quests IS 'Quests available for users to accept. Note: completion_days = NULL means self-paced with no deadline.';
