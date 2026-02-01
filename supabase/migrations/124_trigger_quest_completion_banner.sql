-- Migration: 124_trigger_quest_completion_banner
-- Description: Automatically create a celebration banner when a user completes a quest
-- ADR: ADR-011-Banner-Message-System

-- Function to create celebration banner on quest completion
CREATE OR REPLACE FUNCTION create_quest_completion_banner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quest_title TEXT;
  v_quest_points INTEGER;
BEGIN
  -- Only trigger when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Get quest details
    SELECT title, points INTO v_quest_title, v_quest_points
    FROM quests
    WHERE id = NEW.quest_id;

    -- Create celebration banner for the user
    INSERT INTO banner_messages (
      target_type,
      target_user_id,
      title,
      message,
      variant,
      reference_type,
      reference_id
    ) VALUES (
      'system',
      NEW.user_id,
      'Quest Complete!',
      format('Congratulations! You completed "%s" and earned %s points!', v_quest_title, v_quest_points),
      'celebration',
      'quest_completion',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_quest_completed_create_banner ON user_quests;
CREATE TRIGGER on_quest_completed_create_banner
  AFTER UPDATE ON user_quests
  FOR EACH ROW
  EXECUTE FUNCTION create_quest_completion_banner();

-- Also trigger on insert (in case quest is marked complete on creation, though unlikely)
DROP TRIGGER IF EXISTS on_quest_completed_create_banner_insert ON user_quests;
CREATE TRIGGER on_quest_completed_create_banner_insert
  AFTER INSERT ON user_quests
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION create_quest_completion_banner();

COMMENT ON FUNCTION create_quest_completion_banner IS 'Creates a celebration banner when a user completes a quest';
