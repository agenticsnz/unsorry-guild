-- Migration: 121_create_quest_questions
-- Description: Create quest_questions and user_quest_answers tables
-- Feature: Challenge questions that users must answer correctly to complete quests (Issue #9)

-- Create quest_questions table
CREATE TABLE quest_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_quest_answers table
CREATE TABLE user_quest_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_quest_id UUID NOT NULL REFERENCES user_quests(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES quest_questions(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT now(),

  -- One answer per question per user_quest
  UNIQUE(user_quest_id, question_id)
);

-- Indexes
CREATE INDEX idx_quest_questions_quest ON quest_questions(quest_id);
CREATE INDEX idx_quest_questions_order ON quest_questions(quest_id, order_index);
CREATE INDEX idx_user_quest_answers_user_quest ON user_quest_answers(user_quest_id);
CREATE INDEX idx_user_quest_answers_question ON user_quest_answers(question_id);

-- Trigger to update updated_at on quest_questions
CREATE OR REPLACE FUNCTION update_quest_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_quest_questions_updated_at
  BEFORE UPDATE ON quest_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_quest_questions_updated_at();

-- Comments
COMMENT ON TABLE quest_questions IS 'Challenge questions that users must answer correctly to complete a quest';
COMMENT ON COLUMN quest_questions.question IS 'The question text displayed to the user';
COMMENT ON COLUMN quest_questions.correct_answer IS 'The correct answer (case-insensitive comparison)';
COMMENT ON COLUMN quest_questions.order_index IS 'Display order of questions within a quest';

COMMENT ON TABLE user_quest_answers IS 'User answers to quest challenge questions';
COMMENT ON COLUMN user_quest_answers.is_correct IS 'Whether the answer was correct at time of submission';
