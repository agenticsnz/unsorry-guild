-- Migration: 122_rls_quest_questions
-- Description: Row Level Security for quest_questions and user_quest_answers
-- Feature: Challenge questions (Issue #9)

-- Enable RLS
ALTER TABLE quest_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quest_answers ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- QUEST QUESTIONS POLICIES
-- ===========================================

-- Users can read questions for quests they've accepted
CREATE POLICY "Users can read questions for their quests"
  ON quest_questions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_quests uq
      WHERE uq.quest_id = quest_questions.quest_id
        AND uq.user_id = auth.uid()
    )
  );

-- GMs can read all questions
CREATE POLICY "GMs can read all questions"
  ON quest_questions
  FOR SELECT
  TO authenticated
  USING (is_gm());

-- GMs can create questions
CREATE POLICY "GMs can create questions"
  ON quest_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (is_gm());

-- GMs can update questions
CREATE POLICY "GMs can update questions"
  ON quest_questions
  FOR UPDATE
  TO authenticated
  USING (is_gm())
  WITH CHECK (is_gm());

-- GMs can delete questions
CREATE POLICY "GMs can delete questions"
  ON quest_questions
  FOR DELETE
  TO authenticated
  USING (is_gm());

-- ===========================================
-- USER QUEST ANSWERS POLICIES
-- ===========================================

-- Users can read their own answers
CREATE POLICY "Users can read own answers"
  ON user_quest_answers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_quests uq
      WHERE uq.id = user_quest_answers.user_quest_id
        AND uq.user_id = auth.uid()
    )
  );

-- Users can submit answers for their quests
CREATE POLICY "Users can submit answers"
  ON user_quest_answers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_quests uq
      WHERE uq.id = user_quest_answers.user_quest_id
        AND uq.user_id = auth.uid()
        AND uq.status IN ('accepted', 'in_progress')
    )
  );

-- Users can update their answers (retry)
CREATE POLICY "Users can update own answers"
  ON user_quest_answers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_quests uq
      WHERE uq.id = user_quest_answers.user_quest_id
        AND uq.user_id = auth.uid()
        AND uq.status IN ('accepted', 'in_progress')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_quests uq
      WHERE uq.id = user_quest_answers.user_quest_id
        AND uq.user_id = auth.uid()
        AND uq.status IN ('accepted', 'in_progress')
    )
  );

-- GMs can read all answers
CREATE POLICY "GMs can read all answers"
  ON user_quest_answers
  FOR SELECT
  TO authenticated
  USING (is_gm());
