# SPEC-012-C: Streak Calculation

| Field | Value |
|-------|-------|
| **Specification ID** | SPEC-012-C |
| **Parent ADR** | [ADR-012: Engagement Improvements](../adrs/ADR-012-Engagement-Improvements.md) |
| **Version** | 1.0 |
| **Status** | Active |
| **Last Updated** | 2025-02-01 |

---

## Overview

This specification defines the streak tracking system including activity definitions, weekend behavior options, database schema, calculation triggers, and display requirements.

---

## Activity Definition

An "activity" that counts toward streak maintenance is any of the following:

| Activity Type | Description | Database Event |
|---------------|-------------|----------------|
| Submit Evidence | User submits objective evidence | `user_objectives.status` changes to `'pending_review'` |
| Complete Quest | User completes all objectives | `user_quests.status` changes to `'completed'` |
| Accept Quest | User accepts a new quest | New row in `user_quests` |

### What Does NOT Count

- Logging in without action
- Viewing the dashboard
- Receiving notifications
- GM approval/rejection (GM action, not user)

---

## Weekend Behavior Options

Users can configure how weekends affect their streak:

| Option | Value | Behavior |
|--------|-------|----------|
| Weekends Count | `weekends_count` | Saturday/Sunday require activity (default) |
| Weekends Freeze | `weekends_freeze` | Saturday/Sunday don't affect streak |
| Weekends Optional | `weekends_optional` | Activity on weekends is bonus, missing doesn't break |

### Weekend Detection

```typescript
function isWeekend(date: Date, timezone: string): boolean {
  // Convert to user's timezone
  const localDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }))
  const day = localDate.getDay()
  return day === 0 || day === 6  // Sunday = 0, Saturday = 6
}
```

---

## Database Schema

### user_streaks Table

```sql
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

COMMENT ON TABLE user_streaks IS 'Tracks user activity streaks for engagement';
COMMENT ON COLUMN user_streaks.current_streak IS 'Current consecutive days of activity';
COMMENT ON COLUMN user_streaks.longest_streak IS 'Longest streak ever achieved';
COMMENT ON COLUMN user_streaks.last_activity_date IS 'Date of last qualifying activity (user timezone)';
COMMENT ON COLUMN user_streaks.weekend_behavior IS 'How weekends affect streak calculation';

CREATE INDEX idx_user_streaks_current ON user_streaks(current_streak DESC);
```

---

## Streak Calculation Logic

### Update Streak Function

```sql
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_streak RECORD;
  v_today DATE;
  v_yesterday DATE;
  v_is_weekend BOOLEAN;
  v_last_activity DATE;
BEGIN
  -- Get user's streak record
  SELECT * INTO v_streak FROM user_streaks WHERE user_id = p_user_id;

  -- Create if not exists
  IF v_streak IS NULL THEN
    INSERT INTO user_streaks (user_id) VALUES (p_user_id);
    SELECT * INTO v_streak FROM user_streaks WHERE user_id = p_user_id;
  END IF;

  -- Calculate today in user's timezone
  v_today := (now() AT TIME ZONE v_streak.timezone)::DATE;
  v_yesterday := v_today - INTERVAL '1 day';
  v_last_activity := v_streak.last_activity_date;

  -- Already counted today
  IF v_last_activity = v_today THEN
    RETURN;
  END IF;

  -- Check weekend handling
  v_is_weekend := EXTRACT(DOW FROM v_today) IN (0, 6);

  -- Calculate new streak
  IF v_last_activity IS NULL THEN
    -- First activity ever
    UPDATE user_streaks SET
      current_streak = 1,
      longest_streak = GREATEST(longest_streak, 1),
      last_activity_date = v_today,
      updated_at = now()
    WHERE user_id = p_user_id;

  ELSIF v_last_activity = v_yesterday THEN
    -- Consecutive day
    UPDATE user_streaks SET
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      last_activity_date = v_today,
      updated_at = now()
    WHERE user_id = p_user_id;

  ELSIF v_last_activity < v_yesterday THEN
    -- Gap - check weekend behavior
    IF v_streak.weekend_behavior = 'weekends_freeze' THEN
      -- Check if all missed days were weekends
      IF all_days_are_weekends(v_last_activity + 1, v_yesterday, v_streak.timezone) THEN
        -- Streak continues
        UPDATE user_streaks SET
          current_streak = current_streak + 1,
          longest_streak = GREATEST(longest_streak, current_streak + 1),
          last_activity_date = v_today,
          updated_at = now()
        WHERE user_id = p_user_id;
        RETURN;
      END IF;
    ELSIF v_streak.weekend_behavior = 'weekends_optional' THEN
      -- Check if missed weekday
      IF no_weekdays_missed(v_last_activity + 1, v_yesterday, v_streak.timezone) THEN
        -- Streak continues
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
```

### Helper Functions

```sql
-- Check if all days in range are weekends
CREATE OR REPLACE FUNCTION all_days_are_weekends(
  start_date DATE,
  end_date DATE,
  tz TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  d DATE;
BEGIN
  d := start_date;
  WHILE d <= end_date LOOP
    IF EXTRACT(DOW FROM d) NOT IN (0, 6) THEN
      RETURN FALSE;
    END IF;
    d := d + 1;
  END LOOP;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Check if no weekdays were missed
CREATE OR REPLACE FUNCTION no_weekdays_missed(
  start_date DATE,
  end_date DATE,
  tz TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  d DATE;
BEGIN
  d := start_date;
  WHILE d <= end_date LOOP
    IF EXTRACT(DOW FROM d) NOT IN (0, 6) THEN
      RETURN FALSE;
    END IF;
    d := d + 1;
  END LOOP;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

---

## Trigger Configuration

### Streak Update Triggers

```sql
-- Trigger on objective submission
CREATE OR REPLACE FUNCTION trigger_streak_on_objective_submit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending_review' AND (OLD.status IS NULL OR OLD.status != 'pending_review') THEN
    PERFORM update_user_streak(
      (SELECT user_id FROM user_quests WHERE id = NEW.user_quest_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER streak_on_objective_submit
  AFTER INSERT OR UPDATE ON user_objectives
  FOR EACH ROW
  EXECUTE FUNCTION trigger_streak_on_objective_submit();

-- Trigger on quest acceptance
CREATE OR REPLACE FUNCTION trigger_streak_on_quest_accept()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM update_user_streak(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER streak_on_quest_accept
  AFTER INSERT ON user_quests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_streak_on_quest_accept();

-- Trigger on quest completion
CREATE OR REPLACE FUNCTION trigger_streak_on_quest_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM update_user_streak(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER streak_on_quest_complete
  AFTER UPDATE ON user_quests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_streak_on_quest_complete();
```

---

## React Hook: useUserStreak

```typescript
interface StreakInfo {
  currentStreak: number
  longestStreak: number
  lastActivityDate: string | null
  weekendBehavior: WeekendBehavior
  isStreakAtRisk: boolean  // No activity yesterday (weekday)
}

export function useUserStreak() {
  const { data: user } = useUser()

  return useQuery({
    queryKey: ['user-streak', user?.id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user!.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error  // PGRST116 = not found

      const streak = data ?? {
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: null,
        weekend_behavior: 'weekends_count'
      }

      return {
        currentStreak: streak.current_streak,
        longestStreak: streak.longest_streak,
        lastActivityDate: streak.last_activity_date,
        weekendBehavior: streak.weekend_behavior as WeekendBehavior,
        isStreakAtRisk: calculateStreakRisk(streak)
      }
    },
    enabled: !!user?.id,
  })
}
```

---

## Display Component: StreakBadge

**Props:**
- `streak: number` - Current streak count
- `isAtRisk?: boolean` - Show warning styling
- `size?: 'sm' | 'md' | 'lg'`

**Visual Requirements:**
1. Fire/flame icon for active streaks
2. Number prominently displayed
3. At-risk state: amber/orange coloring, exclamation icon
4. Milestone celebrations: Special styling at 7, 14, 30, 100 days

**Milestone Thresholds:**
- 7 days: "Week Warrior"
- 14 days: "Fortnight Fighter"
- 30 days: "Monthly Master"
- 100 days: "Century Champion"

---

## RLS Policies

```sql
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- Users can view their own streak
CREATE POLICY "user_streaks_select_own" ON user_streaks
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own weekend_behavior
CREATE POLICY "user_streaks_update_own" ON user_streaks
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- System can insert/update via SECURITY DEFINER function
-- (No direct insert policy needed - triggers handle it)

-- GMs can view all streaks
CREATE POLICY "user_streaks_gm_select" ON user_streaks
  FOR SELECT USING (is_gm());
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-02-01 | Initial specification |
