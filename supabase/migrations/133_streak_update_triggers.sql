-- Migration: 133_streak_update_triggers.sql
-- Description: Create triggers to auto-update streaks on user activity (ADR-012, SPEC-012-C)
--
-- Streak-qualifying activities:
-- 1. Submit objective evidence (status → pending_review)
-- 2. Accept a new quest (INSERT into user_quests)
-- 3. Complete a quest (status → completed)

-- Drop existing triggers for idempotency
DROP TRIGGER IF EXISTS streak_on_objective_submit ON user_objectives;
DROP TRIGGER IF EXISTS streak_on_quest_accept ON user_quests;
DROP TRIGGER IF EXISTS streak_on_quest_complete ON user_quests;

-- Trigger function for objective submission
CREATE OR REPLACE FUNCTION trigger_streak_on_objective_submit()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Only trigger when status changes to pending_review
  IF NEW.status = 'pending_review' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'pending_review') THEN
    -- Get user_id from user_quests
    SELECT user_id INTO v_user_id FROM user_quests WHERE id = NEW.user_quest_id;

    IF v_user_id IS NOT NULL THEN
      PERFORM update_user_streak(v_user_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER streak_on_objective_submit
  AFTER INSERT OR UPDATE ON user_objectives
  FOR EACH ROW
  EXECUTE FUNCTION trigger_streak_on_objective_submit();

-- Trigger function for quest acceptance
CREATE OR REPLACE FUNCTION trigger_streak_on_quest_accept()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger on INSERT (new quest acceptance)
  IF TG_OP = 'INSERT' THEN
    PERFORM update_user_streak(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER streak_on_quest_accept
  AFTER INSERT ON user_quests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_streak_on_quest_accept();

-- Trigger function for quest completion
CREATE OR REPLACE FUNCTION trigger_streak_on_quest_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes to completed
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'completed') THEN
    PERFORM update_user_streak(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER streak_on_quest_complete
  AFTER UPDATE ON user_quests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_streak_on_quest_complete();
