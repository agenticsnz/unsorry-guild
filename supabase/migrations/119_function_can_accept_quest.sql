-- Migration: 119_function_can_accept_quest
-- Description: Function to check if a user can accept a quest based on prerequisites
-- ADR: ADR-010-Quest-Dependencies

-- Function to check if user has completed all prerequisites for a quest
CREATE OR REPLACE FUNCTION can_accept_quest(p_user_id UUID, p_quest_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_missing_count INTEGER;
BEGIN
  -- Count prerequisites that the user has NOT completed
  SELECT COUNT(*)
  INTO v_missing_count
  FROM quest_prerequisites qp
  WHERE qp.quest_id = p_quest_id
    AND NOT EXISTS (
      -- Check if user has completed this prerequisite quest
      SELECT 1
      FROM user_quests uq
      WHERE uq.user_id = p_user_id
        AND uq.quest_id = qp.prerequisite_quest_id
        AND uq.status = 'completed'
    );

  -- User can accept if no missing prerequisites
  RETURN v_missing_count = 0;
END;
$$;

-- Function to get incomplete prerequisites for a quest
CREATE OR REPLACE FUNCTION get_incomplete_prerequisites(p_user_id UUID, p_quest_id UUID)
RETURNS TABLE (
  prerequisite_quest_id UUID,
  prerequisite_title TEXT,
  user_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    qp.prerequisite_quest_id,
    q.title AS prerequisite_title,
    COALESCE(uq.status::TEXT, 'not_started') AS user_status
  FROM quest_prerequisites qp
  JOIN quests q ON q.id = qp.prerequisite_quest_id
  LEFT JOIN user_quests uq ON uq.quest_id = qp.prerequisite_quest_id AND uq.user_id = p_user_id
  WHERE qp.quest_id = p_quest_id
    AND (uq.status IS NULL OR uq.status != 'completed')
  ORDER BY q.title;
END;
$$;

-- Function to get all prerequisites for a quest (for display)
CREATE OR REPLACE FUNCTION get_quest_prerequisites(p_user_id UUID, p_quest_id UUID)
RETURNS TABLE (
  prerequisite_quest_id UUID,
  prerequisite_title TEXT,
  is_completed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    qp.prerequisite_quest_id,
    q.title AS prerequisite_title,
    CASE
      WHEN uq.status = 'completed' THEN TRUE
      ELSE FALSE
    END AS is_completed
  FROM quest_prerequisites qp
  JOIN quests q ON q.id = qp.prerequisite_quest_id
  LEFT JOIN user_quests uq ON uq.quest_id = qp.prerequisite_quest_id AND uq.user_id = p_user_id
  WHERE qp.quest_id = p_quest_id
  ORDER BY q.title;
END;
$$;

-- Comments
COMMENT ON FUNCTION can_accept_quest IS 'Returns TRUE if user has completed all prerequisites for the quest, or if quest has no prerequisites';
COMMENT ON FUNCTION get_incomplete_prerequisites IS 'Returns list of prerequisites the user has not yet completed';
COMMENT ON FUNCTION get_quest_prerequisites IS 'Returns all prerequisites with completion status for display';
