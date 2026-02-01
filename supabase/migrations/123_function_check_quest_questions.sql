-- Migration: 123_function_check_quest_questions
-- Description: Functions for quest question validation
-- Feature: Challenge questions (Issue #9)

-- Function to check if all quest questions are answered correctly
CREATE OR REPLACE FUNCTION all_questions_answered_correctly(p_user_quest_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quest_id UUID;
  v_total_questions INTEGER;
  v_correct_answers INTEGER;
BEGIN
  -- Get the quest_id for this user_quest
  SELECT quest_id INTO v_quest_id
  FROM user_quests
  WHERE id = p_user_quest_id;

  IF v_quest_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Count total questions for the quest
  SELECT COUNT(*)
  INTO v_total_questions
  FROM quest_questions
  WHERE quest_id = v_quest_id;

  -- If no questions, consider them "answered"
  IF v_total_questions = 0 THEN
    RETURN TRUE;
  END IF;

  -- Count correct answers for this user_quest
  SELECT COUNT(*)
  INTO v_correct_answers
  FROM user_quest_answers
  WHERE user_quest_id = p_user_quest_id
    AND is_correct = TRUE;

  RETURN v_correct_answers >= v_total_questions;
END;
$$;

-- Function to submit an answer and check if correct
CREATE OR REPLACE FUNCTION submit_quest_answer(
  p_user_quest_id UUID,
  p_question_id UUID,
  p_answer TEXT
)
RETURNS TABLE (
  is_correct BOOLEAN,
  all_questions_complete BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_correct_answer TEXT;
  v_is_correct BOOLEAN;
  v_all_complete BOOLEAN;
BEGIN
  -- Get the correct answer
  SELECT correct_answer INTO v_correct_answer
  FROM quest_questions
  WHERE id = p_question_id;

  IF v_correct_answer IS NULL THEN
    RAISE EXCEPTION 'Question not found';
  END IF;

  -- Case-insensitive comparison, trim whitespace
  v_is_correct := LOWER(TRIM(p_answer)) = LOWER(TRIM(v_correct_answer));

  -- Upsert the answer
  INSERT INTO user_quest_answers (user_quest_id, question_id, answer, is_correct, answered_at)
  VALUES (p_user_quest_id, p_question_id, p_answer, v_is_correct, now())
  ON CONFLICT (user_quest_id, question_id)
  DO UPDATE SET
    answer = p_answer,
    is_correct = v_is_correct,
    answered_at = now();

  -- Check if all questions are now complete
  v_all_complete := all_questions_answered_correctly(p_user_quest_id);

  RETURN QUERY SELECT v_is_correct, v_all_complete;
END;
$$;

-- Function to get question status for a user_quest
CREATE OR REPLACE FUNCTION get_quest_question_status(p_user_quest_id UUID)
RETURNS TABLE (
  question_id UUID,
  question TEXT,
  order_index INTEGER,
  is_answered BOOLEAN,
  is_correct BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quest_id UUID;
BEGIN
  -- Get the quest_id
  SELECT quest_id INTO v_quest_id
  FROM user_quests
  WHERE id = p_user_quest_id;

  RETURN QUERY
  SELECT
    qq.id AS question_id,
    qq.question,
    qq.order_index,
    (uqa.id IS NOT NULL) AS is_answered,
    COALESCE(uqa.is_correct, FALSE) AS is_correct
  FROM quest_questions qq
  LEFT JOIN user_quest_answers uqa ON uqa.question_id = qq.id AND uqa.user_quest_id = p_user_quest_id
  WHERE qq.quest_id = v_quest_id
  ORDER BY qq.order_index;
END;
$$;

-- Comments
COMMENT ON FUNCTION all_questions_answered_correctly IS 'Returns TRUE if all quest questions have been answered correctly, or if quest has no questions';
COMMENT ON FUNCTION submit_quest_answer IS 'Submits an answer to a quest question and returns whether it was correct';
COMMENT ON FUNCTION get_quest_question_status IS 'Returns all questions for a user_quest with their answer status';
