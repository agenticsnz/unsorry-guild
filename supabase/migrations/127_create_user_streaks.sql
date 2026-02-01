-- Migration: 127_create_user_streaks.sql
-- Description: Create user streak tracking table (ADR-012, SPEC-012-C)
--
-- Tracks consecutive days of user activity with configurable weekend behavior:
-- - weekends_count: Weekends require activity (default)
-- - weekends_freeze: Weekends don't affect streak
-- - weekends_optional: Activity on weekends is bonus, missing doesn't break

-- Drop if exists for idempotency
DROP TABLE IF EXISTS user_streaks CASCADE;

CREATE TABLE user_streaks (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  weekend_behavior TEXT NOT NULL DEFAULT 'weekends_count'
    CHECK (weekend_behavior IN ('weekends_count', 'weekends_freeze', 'weekends_optional')),
  timezone TEXT NOT NULL DEFAULT 'Pacific/Auckland',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE user_streaks IS 'Tracks user activity streaks for engagement (ADR-012)';
COMMENT ON COLUMN user_streaks.current_streak IS 'Current consecutive days of activity';
COMMENT ON COLUMN user_streaks.longest_streak IS 'Longest streak ever achieved by this user';
COMMENT ON COLUMN user_streaks.last_activity_date IS 'Date of last qualifying activity (in user timezone)';
COMMENT ON COLUMN user_streaks.weekend_behavior IS 'How weekends affect streak: weekends_count, weekends_freeze, weekends_optional';
COMMENT ON COLUMN user_streaks.timezone IS 'User timezone for date calculations';

-- Create index for leaderboard queries
CREATE INDEX idx_user_streaks_current ON user_streaks(current_streak DESC);
CREATE INDEX idx_user_streaks_longest ON user_streaks(longest_streak DESC);

-- Helper function to check if all days in a range are weekends
CREATE OR REPLACE FUNCTION all_days_are_weekends(
  start_date DATE,
  end_date DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  d DATE;
BEGIN
  IF start_date > end_date THEN
    RETURN TRUE;
  END IF;

  d := start_date;
  WHILE d <= end_date LOOP
    -- DOW: 0 = Sunday, 6 = Saturday
    IF EXTRACT(DOW FROM d) NOT IN (0, 6) THEN
      RETURN FALSE;
    END IF;
    d := d + 1;
  END LOOP;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper function to check if no weekdays were missed
CREATE OR REPLACE FUNCTION no_weekdays_missed(
  start_date DATE,
  end_date DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  d DATE;
BEGIN
  IF start_date > end_date THEN
    RETURN TRUE;
  END IF;

  d := start_date;
  WHILE d <= end_date LOOP
    IF EXTRACT(DOW FROM d) NOT IN (0, 6) THEN
      RETURN FALSE;
    END IF;
    d := d + 1;
  END LOOP;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Main function to update user streak on activity
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_streak RECORD;
  v_today DATE;
  v_yesterday DATE;
  v_last_activity DATE;
BEGIN
  -- Get user's streak record (create if not exists)
  SELECT * INTO v_streak FROM user_streaks WHERE user_id = p_user_id;

  IF v_streak IS NULL THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date)
    VALUES (p_user_id, 1, 1, CURRENT_DATE)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN;
  END IF;

  -- Calculate today in user's timezone
  v_today := (now() AT TIME ZONE v_streak.timezone)::DATE;
  v_yesterday := v_today - INTERVAL '1 day';
  v_last_activity := v_streak.last_activity_date;

  -- Already counted today - no update needed
  IF v_last_activity = v_today THEN
    RETURN;
  END IF;

  -- First activity ever
  IF v_last_activity IS NULL THEN
    UPDATE user_streaks SET
      current_streak = 1,
      longest_streak = GREATEST(longest_streak, 1),
      last_activity_date = v_today,
      updated_at = now()
    WHERE user_id = p_user_id;
    RETURN;
  END IF;

  -- Consecutive day - increment streak
  IF v_last_activity = v_yesterday THEN
    UPDATE user_streaks SET
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      last_activity_date = v_today,
      updated_at = now()
    WHERE user_id = p_user_id;
    RETURN;
  END IF;

  -- Gap detected - check weekend behavior
  IF v_last_activity < v_yesterday THEN
    -- Check weekend_behavior
    IF v_streak.weekend_behavior = 'weekends_freeze' THEN
      -- All missed days were weekends? Continue streak
      IF all_days_are_weekends(v_last_activity + 1, v_yesterday) THEN
        UPDATE user_streaks SET
          current_streak = current_streak + 1,
          longest_streak = GREATEST(longest_streak, current_streak + 1),
          last_activity_date = v_today,
          updated_at = now()
        WHERE user_id = p_user_id;
        RETURN;
      END IF;
    ELSIF v_streak.weekend_behavior = 'weekends_optional' THEN
      -- No weekday missed? Continue streak
      IF no_weekdays_missed(v_last_activity + 1, v_yesterday) THEN
        UPDATE user_streaks SET
          current_streak = current_streak + 1,
          longest_streak = GREATEST(longest_streak, current_streak + 1),
          last_activity_date = v_today,
          updated_at = now()
        WHERE user_id = p_user_id;
        RETURN;
      END IF;
    END IF;

    -- Streak broken - reset to 1
    UPDATE user_streaks SET
      current_streak = 1,
      last_activity_date = v_today,
      updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
