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

## Email Template Style Guidelines

All Guild Hall emails must use consistent branding defined in the shared email templates module:
`supabase/functions/_shared/email-templates.ts`

### Brand Colors

```typescript
const BRAND = {
  gold: '#B8860B',      // Primary brand color for buttons, progress bars
  cream: '#FDF8E8',     // Background color
  accentGold: '#C9A857', // Secondary gold for gradients
  textDark: '#3D2E1F',  // Primary text color
  success: '#16a34a',   // Success states
  warning: '#d97706',   // Warning states
  error: '#dc2626',     // Error states
}
```

### Logo Asset

```typescript
const LOGO_URL = 'https://cdn.disco.co/media/agentics-logo-enhanced-removebg-preview_2949fb89-758d-4d9d-ae30-a51cea979427.png'
```

### Email Structure

All emails use the `emailWrapper()` function which provides:

1. **Header**: Cream background (#F5F0E6) with "Guild Hall" + Logo + "Agentics NZ"
2. **Content**: White background with 32px padding
3. **Footer**: Gray background with email preferences and site links

### Component Classes

| Class | Purpose |
|-------|---------|
| `.card` | Content sections with #f8f8f8 background |
| `.button` | Gold (#B8860B) CTA buttons |
| `.stat-grid` | Flex container for statistics |
| `.stat-item` | Individual stat cards with gold values |
| `.alert-card` | Warning sections with amber left border |
| `.success-card` | Success sections with green left border |
| `.info-card` | Information sections with gold left border |
| `.tier-badge` | Gold pill badges |
| `.progress-bar` | Gold gradient progress indicators |
| `.encouragement` | Cream gradient highlight boxes |

### HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Guild Hall - GM Daily Digest</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #FDF8E8;  /* cream */
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #3D2E1F;  /* textDark */
    }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header {
      background-color: #F5F0E6;
      padding: 16px 24px;
      border-bottom: 1px solid #E5DDD0;
      text-align: center;
    }
    .button {
      display: inline-block;
      background-color: #B8860B;  /* gold */
      color: #ffffff !important;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
    }
    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #B8860B;  /* gold */
    }
    .progress-fill {
      background: linear-gradient(90deg, #B8860B, #C9A857);  /* gold gradient */
    }
    /* ... see email-templates.ts for full styles */
  </style>
</head>
<body>
  <div class="container">
    <!-- Header with logo -->
    <div class="header">
      <span class="header-text">Guild Hall</span>
      <img src="{{logo}}" alt="Logo" class="header-logo">
      <span class="header-text">Agentics NZ</span>
    </div>

    <div class="content">
      <!-- Email content sections -->
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>This email was sent by Guild Hall - Agentics NZ</p>
      <p>
        <a href="{{baseUrl}}/settings">Email Preferences</a> |
        <a href="{{baseUrl}}">Visit Guild Hall</a>
      </p>
    </div>
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

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Email is sent via Mailjet (configured in Supabase secrets)
const MAILJET_API_KEY = Deno.env.get('MAILJET_API_KEY')!
const MAILJET_SECRET_KEY = Deno.env.get('MAILJET_SECRET_KEY')!
const EMAIL_FROM_ADDRESS = Deno.env.get('EMAIL_FROM_ADDRESS') || 'agentics@cgee.nz'

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

    // Gather data and send email via Mailjet
    const digestData = await gatherDigestData()
    const html = renderDigestEmail(digestData, gm.users.display_name)

    await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`)}`,
      },
      body: JSON.stringify({
        Messages: [{
          From: { Email: EMAIL_FROM_ADDRESS, Name: 'Guild Hall' },
          To: [{ Email: gm.users.email, Name: gm.users.display_name }],
          Subject: `GM Daily Digest - ${formatDate(now)}`,
          HTMLPart: html,
        }],
      }),
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
| 1.1 | 2025-02-02 | Updated email template style guidelines with gold/cream branding |
