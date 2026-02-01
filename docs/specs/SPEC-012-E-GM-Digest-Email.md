# SPEC-012-E: GM Digest Email

| Field | Value |
|-------|-------|
| **Specification ID** | SPEC-012-E |
| **Parent ADR** | [ADR-012: Engagement Improvements](../adrs/ADR-012-Engagement-Improvements.md) |
| **Version** | 1.0 |
| **Status** | Active |
| **Last Updated** | 2025-02-01 |

---

## Overview

This specification defines the GM daily digest email including database schema for preferences, email content sections, template design, and trigger logic.

---

## Database Schema

### gm_email_preferences Table

```sql
CREATE TABLE gm_email_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  daily_digest_enabled BOOLEAN NOT NULL DEFAULT true,
  digest_time TIME NOT NULL DEFAULT '08:00',
  timezone TEXT NOT NULL DEFAULT 'Pacific/Auckland',
  last_digest_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT user_must_be_gm CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = gm_email_preferences.user_id AND role = 'gm')
  )
);

COMMENT ON TABLE gm_email_preferences IS 'Email preferences for Game Masters';
COMMENT ON COLUMN gm_email_preferences.digest_time IS 'Preferred time to receive daily digest';
COMMENT ON COLUMN gm_email_preferences.timezone IS 'Timezone for scheduling';
```

---

## Email Content Sections

### 1. Activity Summary (Last 24 Hours)

```typescript
interface ActivitySummary {
  newSubmissions: number        // Objectives submitted for review
  objectivesApproved: number    // Objectives GM approved
  objectivesRejected: number    // Objectives GM rejected
  questsCompleted: number       // Quests fully completed
  questsAccepted: number        // New quest acceptances
  newUsers: number              // New guild members
  extensionRequests: number     // New extension requests
}
```

**Query:**
```sql
SELECT
  COUNT(*) FILTER (WHERE type = 'objective_submitted' AND created_at > NOW() - INTERVAL '24 hours') as new_submissions,
  COUNT(*) FILTER (WHERE type = 'objective_approved' AND created_at > NOW() - INTERVAL '24 hours') as approved,
  COUNT(*) FILTER (WHERE type = 'objective_rejected' AND created_at > NOW() - INTERVAL '24 hours') as rejected,
  COUNT(*) FILTER (WHERE type = 'quest_completed' AND created_at > NOW() - INTERVAL '24 hours') as completed,
  COUNT(*) FILTER (WHERE type = 'quest_accepted' AND created_at > NOW() - INTERVAL '24 hours') as accepted
FROM activity_feed
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### 2. Pending Reviews

```typescript
interface PendingReview {
  userName: string
  questTitle: string
  objectiveTitle: string
  submittedAt: string
  hoursWaiting: number
}
```

**Query:**
```sql
SELECT
  u.display_name as user_name,
  q.title as quest_title,
  o.title as objective_title,
  uo.updated_at as submitted_at,
  EXTRACT(EPOCH FROM (NOW() - uo.updated_at)) / 3600 as hours_waiting
FROM user_objectives uo
JOIN user_quests uq ON uq.id = uo.user_quest_id
JOIN users u ON u.id = uq.user_id
JOIN quests q ON q.id = uq.quest_id
JOIN objectives o ON o.id = uo.objective_id
WHERE uo.status = 'pending_review'
ORDER BY uo.updated_at ASC
LIMIT 10;
```

### 3. Upcoming Deadlines (Next 7 Days)

```typescript
interface UpcomingDeadline {
  userName: string
  questTitle: string
  deadline: string
  daysRemaining: number
  progressPercent: number
}
```

### 4. Recent Completions (Celebration Highlights)

```typescript
interface RecentCompletion {
  userName: string
  questTitle: string
  pointsEarned: number
  completedAt: string
}
```

### 5. Quick Links

- Review Submissions: `/gm/review`
- Manage Quests: `/gm/quests`
- View Users: `/gm/users`
- Extension Requests: `/gm/extensions`

---

## Email Template

### HTML Structure

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Guild Hall - GM Daily Digest</title>
  <style>
    /* Inline styles for email compatibility */
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 24px; border-radius: 8px 8px 0 0; }
    .section { background: #f8fafc; padding: 16px; margin: 16px 0; border-radius: 8px; }
    .stat { display: inline-block; text-align: center; padding: 8px 16px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #1e3a5f; }
    .stat-label { font-size: 12px; color: #64748b; }
    .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 8px 0; }
    .success { background: #dcfce7; border-left: 4px solid #22c55e; }
    .button { display: inline-block; background: #1e3a5f; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>GM Daily Digest</h1>
      <p>{{date}} - Guild Hall Activity Summary</p>
    </div>

    <!-- Activity Summary -->
    <div class="section">
      <h2>Activity Summary (Last 24h)</h2>
      <div class="stats">
        <div class="stat">
          <div class="stat-value">{{newSubmissions}}</div>
          <div class="stat-label">New Submissions</div>
        </div>
        <div class="stat">
          <div class="stat-value">{{questsCompleted}}</div>
          <div class="stat-label">Quests Completed</div>
        </div>
        <div class="stat">
          <div class="stat-value">{{newUsers}}</div>
          <div class="stat-label">New Members</div>
        </div>
      </div>
    </div>

    <!-- Pending Reviews -->
    {{#if pendingReviews.length}}
    <div class="section alert">
      <h2>Pending Reviews ({{pendingReviews.length}})</h2>
      <ul>
        {{#each pendingReviews}}
        <li><strong>{{userName}}</strong> - {{questTitle}} / {{objectiveTitle}} ({{hoursWaiting}}h ago)</li>
        {{/each}}
      </ul>
      <a href="{{baseUrl}}/gm/review" class="button">Review Now</a>
    </div>
    {{/if}}

    <!-- Upcoming Deadlines -->
    {{#if upcomingDeadlines.length}}
    <div class="section">
      <h2>Upcoming Deadlines</h2>
      <ul>
        {{#each upcomingDeadlines}}
        <li><strong>{{userName}}</strong> - {{questTitle}} ({{daysRemaining}} days)</li>
        {{/each}}
      </ul>
    </div>
    {{/if}}

    <!-- Recent Completions -->
    {{#if recentCompletions.length}}
    <div class="section success">
      <h2>Recent Completions</h2>
      <ul>
        {{#each recentCompletions}}
        <li><strong>{{userName}}</strong> completed {{questTitle}} (+{{pointsEarned}} pts)</li>
        {{/each}}
      </ul>
    </div>
    {{/if}}

    <!-- Quick Links -->
    <div class="section">
      <h2>Quick Links</h2>
      <p>
        <a href="{{baseUrl}}/gm/review">Review Submissions</a> |
        <a href="{{baseUrl}}/gm/quests">Manage Quests</a> |
        <a href="{{baseUrl}}/gm/users">View Users</a>
      </p>
    </div>

    <footer style="text-align: center; color: #94a3b8; font-size: 12px; padding: 20px;">
      <p>Guild Hall - Agentics NZ</p>
      <p><a href="{{baseUrl}}/gm/settings/email">Manage email preferences</a></p>
    </footer>
  </div>
</body>
</html>
```

---

## Edge Function: gm-daily-digest

### Trigger Options

**Option A: Supabase pg_cron (Recommended)**

```sql
-- Run every hour, function checks if it's time for each GM
SELECT cron.schedule(
  'gm-daily-digest',
  '0 * * * *',  -- Every hour
  $$
  SELECT net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/gm-daily-digest',
    headers := '{"Authorization": "Bearer <service-role-key>"}'::jsonb
  )
  $$
);
```

**Option B: External Cron (Vercel/GitHub Actions)**

```yaml
# .github/workflows/gm-digest.yml
name: GM Daily Digest
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
jobs:
  send-digest:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST https://<project-ref>.supabase.co/functions/v1/gm-daily-digest \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_KEY }}"
```

### Function Logic

```typescript
// supabase/functions/gm-daily-digest/index.ts
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)
const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

Deno.serve(async () => {
  // Get GMs who should receive digest now
  const { data: gms } = await supabase
    .from('gm_email_preferences')
    .select(`
      user_id,
      digest_time,
      timezone,
      users!inner(email, display_name)
    `)
    .eq('daily_digest_enabled', true)

  const now = new Date()

  for (const gm of gms || []) {
    // Check if current hour matches preferred time in GM's timezone
    const gmLocalTime = new Date(now.toLocaleString('en-US', { timeZone: gm.timezone }))
    const gmHour = gmLocalTime.getHours()
    const preferredHour = parseInt(gm.digest_time.split(':')[0])

    if (gmHour !== preferredHour) continue

    // Check if already sent today
    const { data: lastSent } = await supabase
      .from('gm_email_preferences')
      .select('last_digest_sent_at')
      .eq('user_id', gm.user_id)
      .single()

    if (lastSent?.last_digest_sent_at) {
      const lastSentDate = new Date(lastSent.last_digest_sent_at)
      if (isSameDay(lastSentDate, now, gm.timezone)) continue
    }

    // Gather data and send email
    const digestData = await gatherDigestData()
    const html = renderDigestEmail(digestData, gm.users.display_name)

    await resend.emails.send({
      from: 'Guild Hall <noreply@guildhall.agentics.nz>',
      to: gm.users.email,
      subject: `GM Daily Digest - ${formatDate(now)}`,
      html
    })

    // Update last sent timestamp
    await supabase
      .from('gm_email_preferences')
      .update({ last_digest_sent_at: now.toISOString() })
      .eq('user_id', gm.user_id)
  }

  return new Response(JSON.stringify({ success: true }))
})
```

---

## GM Settings Page

**Location:** `/gm/settings/email`

**Fields:**
- Daily digest enabled (toggle)
- Preferred send time (time picker)
- Timezone (dropdown with auto-detect)
- "Send Test Email" button

---

## RLS Policies

```sql
ALTER TABLE gm_email_preferences ENABLE ROW LEVEL SECURITY;

-- GMs can view and update their own preferences
CREATE POLICY "gm_email_preferences_own" ON gm_email_preferences
  FOR ALL USING (auth.uid() = user_id AND is_gm())
  WITH CHECK (auth.uid() = user_id AND is_gm());
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-02-01 | Initial specification |
