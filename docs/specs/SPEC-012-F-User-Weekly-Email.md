# SPEC-012-F: User Weekly Email

| Field | Value |
|-------|-------|
| **Specification ID** | SPEC-012-F |
| **Parent ADR** | [ADR-012: Engagement Improvements](../adrs/ADR-012-Engagement-Improvements.md) |
| **Version** | 1.0 |
| **Status** | Active |
| **Last Updated** | 2025-02-01 |

---

## Overview

This specification defines the user weekly progress email including database schema, content sections, nudge logic reuse (DRY), template design, scheduling, and GM manual push capability.

---

## Database Schema

### user_weekly_email_prefs Table

```sql
CREATE TABLE user_weekly_email_prefs (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  day_of_week INTEGER NOT NULL DEFAULT 1 CHECK (day_of_week BETWEEN 0 AND 6),
  send_time TIME NOT NULL DEFAULT '08:00',
  timezone TEXT NOT NULL DEFAULT 'Pacific/Auckland',
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE user_weekly_email_prefs IS 'User preferences for weekly progress email';
COMMENT ON COLUMN user_weekly_email_prefs.day_of_week IS 'Day to send: 0=Sunday, 1=Monday, ..., 6=Saturday';
COMMENT ON COLUMN user_weekly_email_prefs.send_time IS 'Preferred send time in user timezone';

CREATE INDEX idx_user_weekly_email_enabled ON user_weekly_email_prefs(enabled, day_of_week) WHERE enabled = true;
```

---

## Email Content Sections

### 1. Next Steps (Action Required)

Shows objectives that have been approved and are ready to progress.

```typescript
interface NextStep {
  questTitle: string
  objectiveTitle: string
  approvedAt: string
  questProgress: string  // e.g., "3/5 objectives"
}
```

**Query:**
```sql
SELECT
  q.title as quest_title,
  o.title as objective_title,
  uo.reviewed_at as approved_at,
  (
    SELECT COUNT(*) FROM user_objectives uo2
    WHERE uo2.user_quest_id = uq.id AND uo2.status = 'approved'
  )::text || '/' || (
    SELECT COUNT(*) FROM objectives o2 WHERE o2.quest_id = q.id
  )::text as quest_progress
FROM user_objectives uo
JOIN user_quests uq ON uq.id = uo.user_quest_id
JOIN quests q ON q.id = uq.quest_id
JOIN objectives o ON o.id = uo.objective_id
WHERE uq.user_id = $1
  AND uo.status = 'approved'
  AND uq.status IN ('accepted', 'in_progress')
  AND EXISTS (
    -- Has unlocked next objectives
    SELECT 1 FROM user_objectives uo3
    WHERE uo3.user_quest_id = uq.id
      AND uo3.status = 'available'
  )
ORDER BY uo.reviewed_at DESC
LIMIT 5;
```

### 2. Recommended Action (DRY: Reuses Nudge Logic)

The recommended action uses the **same priority logic** as the NudgeBanner component:

```typescript
// Shared priority logic - reused from useNudgeBanner hook
type NudgePriority =
  | 'approved_ready'      // Approved submissions ready to progress
  | 'deadline_soon'       // Quest deadline < 3 days
  | 'celebration'         // Recent milestone (tier up, quest complete)
  | 'quest_recommendation' // No active quests, suggest one

interface RecommendedAction {
  priority: NudgePriority
  message: string
  actionUrl: string
  actionLabel: string
}

// This function is shared between:
// 1. useNudgeBanner hook (dashboard)
// 2. User weekly email (recommended action section)
function getRecommendedAction(context: UserContext): RecommendedAction | null {
  // Priority 1: Approved submissions ready to continue
  if (context.approvedObjectivesCount > 0) {
    return {
      priority: 'approved_ready',
      message: `You have ${context.approvedObjectivesCount} objective(s) approved and ready to continue!`,
      actionUrl: '/quests/active',
      actionLabel: 'Continue Quest'
    }
  }

  // Priority 2: Approaching deadline
  const urgentDeadline = context.upcomingDeadlines.find(d => d.daysRemaining <= 3)
  if (urgentDeadline) {
    return {
      priority: 'deadline_soon',
      message: `"${urgentDeadline.questTitle}" is due in ${urgentDeadline.daysRemaining} day(s)!`,
      actionUrl: `/quests/${urgentDeadline.questId}`,
      actionLabel: 'View Quest'
    }
  }

  // Priority 3: Recent celebration (not used in email, only dashboard)

  // Priority 4: Quest recommendation
  if (context.activeQuestsCount === 0) {
    const recommended = context.recommendedQuest
    if (recommended) {
      return {
        priority: 'quest_recommendation',
        message: `Ready for a new challenge? "${recommended.title}" might be perfect for you.`,
        actionUrl: `/quests/${recommended.id}`,
        actionLabel: 'View Quest'
      }
    }
  }

  return null
}
```

**DRY Implementation:**

```typescript
// src/lib/utils/nudge-priority.ts
// Shared between useNudgeBanner hook and email generation

export { getRecommendedAction, NudgePriority, RecommendedAction }
```

### 3. Progress Summary (Week's Activity)

```typescript
interface WeeklyProgress {
  objectivesSubmitted: number
  objectivesApproved: number
  questsCompleted: number
  pointsEarned: number
  currentStreak: number
  tierProgress: {
    currentTier: string
    pointsToNext: number
    nextTier: string | null
  }
}
```

### 4. Encouragement

Personalized message based on activity:

| Condition | Message |
|-----------|---------|
| Streak ≥ 7 days | "Amazing! {streak} day streak and counting!" |
| Quest completed | "Congratulations on completing {questName}!" |
| Tier progress > 50% | "You're over halfway to {nextTier}!" |
| Points earned > 0 | "Great work! You earned {points} points this week." |
| No activity | "Ready to jump back in? The guild awaits!" |

---

## Email Template

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Guild Hall - Your Weekly Progress</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f1f5f9; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: white; border-radius: 12px; padding: 24px; margin: 16px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 32px; border-radius: 12px; text-align: center; }
    .header h1 { margin: 0 0 8px 0; }
    .header p { margin: 0; opacity: 0.9; }
    .section-title { font-size: 14px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .action-card { background: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 8px; padding: 16px; }
    .action-card h3 { margin: 0 0 8px 0; color: #0369a1; }
    .button { display: inline-block; background: #1e3a5f; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; }
    .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .stat-item { text-align: center; padding: 12px; background: #f8fafc; border-radius: 8px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #1e3a5f; }
    .stat-label { font-size: 12px; color: #64748b; }
    .encouragement { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 16px; border-radius: 8px; text-align: center; }
    .next-step { padding: 12px; border-bottom: 1px solid #e2e8f0; }
    .next-step:last-child { border-bottom: none; }
    .tier-progress { background: #f8fafc; padding: 16px; border-radius: 8px; }
    .progress-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin: 8px 0; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #22c55e, #16a34a); border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>Your Weekly Progress</h1>
      <p>Week of {{weekStart}} - {{weekEnd}}</p>
    </div>

    <!-- Greeting -->
    <div class="card">
      <p style="font-size: 18px;">Kia ora, {{displayName}}!</p>
      <p>{{encouragementMessage}}</p>
    </div>

    <!-- Recommended Action (if any) -->
    {{#if recommendedAction}}
    <div class="card">
      <div class="section-title">Recommended Action</div>
      <div class="action-card">
        <h3>{{recommendedAction.message}}</h3>
        <a href="{{baseUrl}}{{recommendedAction.actionUrl}}" class="button">{{recommendedAction.actionLabel}}</a>
      </div>
    </div>
    {{/if}}

    <!-- Next Steps (if any) -->
    {{#if nextSteps.length}}
    <div class="card">
      <div class="section-title">Ready to Continue</div>
      {{#each nextSteps}}
      <div class="next-step">
        <strong>{{questTitle}}</strong>
        <br>
        <span style="color: #64748b;">{{objectiveTitle}} ({{questProgress}})</span>
      </div>
      {{/each}}
      <a href="{{baseUrl}}/quests/active" class="button" style="margin-top: 12px;">View Active Quests</a>
    </div>
    {{/if}}

    <!-- Weekly Stats -->
    <div class="card">
      <div class="section-title">This Week's Progress</div>
      <div class="stat-grid">
        <div class="stat-item">
          <div class="stat-value">{{progress.objectivesSubmitted}}</div>
          <div class="stat-label">Objectives Submitted</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{progress.objectivesApproved}}</div>
          <div class="stat-label">Objectives Approved</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{progress.questsCompleted}}</div>
          <div class="stat-label">Quests Completed</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">+{{progress.pointsEarned}}</div>
          <div class="stat-label">Points Earned</div>
        </div>
      </div>
    </div>

    <!-- Tier Progress -->
    {{#if tierProgress.nextTier}}
    <div class="card">
      <div class="section-title">Tier Progress</div>
      <div class="tier-progress">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>{{tierProgress.currentTier}}</span>
          <span style="color: #64748b;">{{tierProgress.pointsToNext}} pts to {{tierProgress.nextTier}}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: {{tierProgress.progressPercent}}%"></div>
        </div>
      </div>
    </div>
    {{/if}}

    <!-- Streak -->
    {{#if progress.currentStreak}}
    <div class="card encouragement">
      <span style="font-size: 32px;">🔥</span>
      <p style="margin: 8px 0 0 0; font-weight: 600;">{{progress.currentStreak}} Day Streak!</p>
    </div>
    {{/if}}

    <!-- Footer -->
    <footer style="text-align: center; color: #94a3b8; font-size: 12px; padding: 20px;">
      <p>Guild Hall - Agentics NZ</p>
      <p><a href="{{baseUrl}}/settings">Manage email preferences</a></p>
    </footer>
  </div>
</body>
</html>
```

---

## Edge Function: user-weekly-progress

### Scheduled Trigger

```sql
-- Run hourly, check which users should receive email
SELECT cron.schedule(
  'user-weekly-progress',
  '0 * * * *',  -- Every hour
  $$
  SELECT net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/user-weekly-progress',
    headers := '{"Authorization": "Bearer <service-role-key>"}'::jsonb
  )
  $$
);
```

### Function Implementation

```typescript
// supabase/functions/user-weekly-progress/index.ts
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { getRecommendedAction } from '../_shared/nudge-priority.ts'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

  // Check if this is a manual push from GM
  const { manual, userIds } = await req.json().catch(() => ({}))

  let usersToEmail: any[]

  if (manual && userIds) {
    // Manual push to specific users
    const { data } = await supabase
      .from('user_weekly_email_prefs')
      .select('*, users!inner(id, email, display_name, points)')
      .in('user_id', userIds)
      .eq('enabled', true)
    usersToEmail = data || []
  } else {
    // Scheduled: Get users whose preferred time matches now
    const now = new Date()
    const currentDayOfWeek = now.getUTCDay()

    const { data } = await supabase
      .from('user_weekly_email_prefs')
      .select('*, users!inner(id, email, display_name, points)')
      .eq('enabled', true)
      .eq('day_of_week', currentDayOfWeek)

    usersToEmail = (data || []).filter(pref => {
      const userLocalTime = new Date(now.toLocaleString('en-US', { timeZone: pref.timezone }))
      const userHour = userLocalTime.getHours()
      const preferredHour = parseInt(pref.send_time.split(':')[0])
      return userHour === preferredHour
    })
  }

  for (const pref of usersToEmail) {
    // Skip if already sent this week (unless manual)
    if (!manual && pref.last_sent_at) {
      const lastSent = new Date(pref.last_sent_at)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      if (lastSent > weekAgo) continue
    }

    // Gather user data
    const userData = await gatherUserData(supabase, pref.user_id)

    // Get recommended action using shared nudge logic (DRY)
    const recommendedAction = getRecommendedAction(userData)

    // Render and send email
    const html = renderWeeklyEmail({
      ...userData,
      recommendedAction,
      displayName: pref.users.display_name
    })

    await resend.emails.send({
      from: 'Guild Hall <noreply@guildhall.agentics.nz>',
      to: pref.users.email,
      subject: `Your Weekly Progress - Guild Hall`,
      html
    })

    // Update last sent timestamp
    await supabase
      .from('user_weekly_email_prefs')
      .update({ last_sent_at: new Date().toISOString() })
      .eq('user_id', pref.user_id)
  }

  return new Response(JSON.stringify({
    success: true,
    emailsSent: usersToEmail.length
  }))
})
```

---

## GM Manual Push

### Admin Page: `/gm/emails`

**Features:**
1. "Send Weekly Progress to All Users" button
2. Preview of email template
3. Statistics: Last sent, emails queued, delivery status
4. Optional: Select specific users

**Implementation:**

```typescript
// src/app/(gm)/gm/emails/page.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

export default function GMEmailsPage() {
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success: boolean; count: number } | null>(null)

  const handleSendAll = async () => {
    setSending(true)
    try {
      const supabase = createClient()

      // Get all enabled users
      const { data: users } = await supabase
        .from('user_weekly_email_prefs')
        .select('user_id')
        .eq('enabled', true)

      // Trigger edge function with manual flag
      const response = await fetch('/api/send-weekly-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manual: true,
          userIds: users?.map(u => u.user_id)
        })
      })

      const data = await response.json()
      setResult({ success: true, count: data.emailsSent })
    } catch (error) {
      setResult({ success: false, count: 0 })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Email Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Progress Email</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Send the weekly progress email to all users who have enabled it.
            This is useful for special announcements or pre-event reminders.
          </p>

          <Button
            onClick={handleSendAll}
            disabled={sending}
          >
            {sending ? 'Sending...' : 'Send Weekly Progress to All Users'}
          </Button>

          {result && (
            <p className={`mt-4 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
              {result.success
                ? `Successfully sent ${result.count} emails!`
                : 'Failed to send emails. Check logs.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## User Settings

**Location:** `/settings` (add section)

**Fields:**
- Weekly progress email enabled (toggle)
- Preferred day (dropdown: Sunday-Saturday)
- Preferred time (time picker)
- Timezone (dropdown with auto-detect)

---

## RLS Policies

```sql
ALTER TABLE user_weekly_email_prefs ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own preferences
CREATE POLICY "user_weekly_email_prefs_own" ON user_weekly_email_prefs
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- GMs can view all preferences (for admin purposes)
CREATE POLICY "user_weekly_email_prefs_gm_select" ON user_weekly_email_prefs
  FOR SELECT USING (is_gm());
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-02-01 | Initial specification |
