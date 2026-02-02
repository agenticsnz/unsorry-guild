import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Brand colors from the Guild Hall theme
const BRAND = {
  gold: '#B8860B',
  cream: '#FDF8E8',
  accentGold: '#C9A857',
  textDark: '#3D2E1F',
  success: '#16a34a',
  warning: '#d97706',
}

const LOGO_URL = 'https://cdn.disco.co/media/agentics-logo-enhanced-removebg-preview_2949fb89-758d-4d9d-ae30-a51cea979427.png'

function emailWrapper(content: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: ${BRAND.cream}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: ${BRAND.textDark}; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #F5F0E6; padding: 16px 24px; border-bottom: 1px solid #E5DDD0; }
    .header-text { font-size: 18px; font-weight: 600; color: ${BRAND.textDark}; }
    .header-logo { height: 28px; vertical-align: middle; margin: 0 8px; }
    .content { padding: 32px 24px; }
    .card { background: #f8f8f8; border-radius: 8px; padding: 20px; margin: 16px 0; }
    .section-title { font-size: 12px; font-weight: 600; color: #888888; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0; }
    .button { display: inline-block; background-color: ${BRAND.gold}; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0; }
    .stat-grid { display: flex; justify-content: center; gap: 24px; flex-wrap: wrap; margin: 16px 0; }
    .stat-item { text-align: center; padding: 16px; background: #ffffff; border-radius: 8px; min-width: 100px; }
    .stat-value { font-size: 28px; font-weight: bold; color: ${BRAND.gold}; }
    .stat-label { font-size: 12px; color: #666666; margin-top: 4px; }
    .info-card { background: #f5f5f5; border-left: 4px solid ${BRAND.gold}; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 16px 0; }
    .info-card h3 { margin: 0 0 8px 0; font-size: 16px; }
    .list-item { padding: 12px 0; border-bottom: 1px solid #e5e5e5; }
    .list-item:last-child { border-bottom: none; }
    .muted { color: #666666; font-size: 14px; }
    .footer { background-color: #f5f5f5; text-align: center; color: #666666; font-size: 12px; padding: 24px 20px; }
    .footer a { color: #666666; text-decoration: underline; }
    .progress-bar { height: 8px; background: #e5e5e5; border-radius: 4px; overflow: hidden; margin: 8px 0; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, ${BRAND.gold}, ${BRAND.accentGold}); border-radius: 4px; }
    .tier-badge { display: inline-block; padding: 4px 12px; background: ${BRAND.gold}; color: white; border-radius: 16px; font-size: 12px; font-weight: 500; }
    .encouragement { background: linear-gradient(135deg, #FEF9E7 0%, #FDF5D6 100%); padding: 20px; border-radius: 8px; text-align: center; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="header-text">Guild Hall</span>
      <img src="${LOGO_URL}" alt="Logo" class="header-logo">
      <span class="header-text">Agentics NZ</span>
    </div>
    <div class="content">${content}</div>
    <div class="footer">
      <p>This email was sent by Guild Hall - Agentics NZ</p>
      <p><a href="{{baseUrl}}/settings">Email Preferences</a> | <a href="{{baseUrl}}">Visit Guild Hall</a></p>
    </div>
  </div>
</body>
</html>`
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' })
}

interface UserData {
  userId: string
  email: string
  displayName: string
  totalPoints: number
}

interface WeeklyStats {
  objectivesSubmitted: number
  objectivesApproved: number
  questsCompleted: number
  pointsEarned: number
  currentStreak: number
}

interface TierInfo {
  currentTier: string
  nextTier: string | null
  pointsToNext: number
  progressPercent: number
}

interface TierConfig {
  id: string
  name: string
  min_points: number
}

interface UserEmailPref {
  user_id: string
  enabled: boolean
}

interface UserRecord {
  id: string
  email: string
  display_name: string | null
  total_points: number | null
}

interface ActivityRecord {
  type: string
  points_earned: number | null
}

interface StreakRecord {
  current_streak: number
}

async function sendEmailViaMailjet(
  email: string,
  name: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  const mailjetApiKey = process.env.MAILJET_API_KEY
  const mailjetSecretKey = process.env.MAILJET_SECRET_KEY
  const fromEmail = process.env.EMAIL_FROM_ADDRESS || 'agentics@cgee.nz'

  if (!mailjetApiKey || !mailjetSecretKey) {
    return { success: false, error: 'Mailjet credentials not configured' }
  }

  try {
    const response = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${mailjetApiKey}:${mailjetSecretKey}`).toString('base64')}`,
      },
      body: JSON.stringify({
        Messages: [{
          From: { Email: fromEmail, Name: 'Guild Hall' },
          To: [{ Email: email, Name: name }],
          Subject: subject,
          HTMLPart: html,
        }],
      }),
    })

    const result = await response.json()

    if (!response.ok || result.Messages?.[0]?.Status === 'error') {
      return { success: false, error: result.Messages?.[0]?.Errors?.[0]?.ErrorMessage || 'Mailjet error' }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

function renderWeeklyEmail(
  user: UserData,
  stats: WeeklyStats,
  tierInfo: TierInfo,
  baseUrl: string
): string {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  // Generate encouragement message
  let encouragement = "Ready to jump back in? The guild awaits!"
  if (stats.currentStreak >= 7) {
    encouragement = `Amazing! You're on a ${stats.currentStreak} day streak!`
  } else if (stats.questsCompleted > 0) {
    encouragement = `Congratulations on completing ${stats.questsCompleted} quest${stats.questsCompleted > 1 ? 's' : ''} this week!`
  } else if (stats.pointsEarned > 0) {
    encouragement = `Great work! You earned ${stats.pointsEarned} points this week.`
  }

  let content = `
    <div class="header">
      <h1>Your Weekly Progress</h1>
      <p>Week of ${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}</p>
    </div>
    <div class="card">
      <p style="font-size: 18px; margin: 0;">Kia ora, ${escapeHtml(user.displayName)}!</p>
      <p style="margin: 12px 0 0 0;">${escapeHtml(encouragement)}</p>
    </div>
    <div class="card">
      <p class="section-title">This Week's Progress</p>
      <div class="stat-grid">
        <div class="stat-item">
          <div class="stat-value">${stats.objectivesSubmitted}</div>
          <div class="stat-label">Objectives Submitted</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.objectivesApproved}</div>
          <div class="stat-label">Objectives Approved</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${stats.questsCompleted}</div>
          <div class="stat-label">Quests Completed</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">+${stats.pointsEarned}</div>
          <div class="stat-label">Points Earned</div>
        </div>
      </div>
    </div>`

  // Tier progress
  if (tierInfo.nextTier) {
    content += `
    <div class="card">
      <p class="section-title">Tier Progress</p>
      <div style="background: #f8fafc; padding: 16px; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="tier-badge">${tierInfo.currentTier}</span>
          <span class="muted">${tierInfo.pointsToNext} pts to ${tierInfo.nextTier}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${tierInfo.progressPercent}%"></div>
        </div>
      </div>
    </div>`
  }

  // Streak
  if (stats.currentStreak > 0) {
    content += `
    <div class="encouragement">
      <span style="font-size: 32px;">&#128293;</span>
      <p style="margin: 8px 0 0 0; font-weight: 600;">${stats.currentStreak} Day Streak!</p>
    </div>`
  }

  content += `
    <div style="text-align: center; margin-top: 24px;">
      <a href="${baseUrl}/dashboard" class="button">View Dashboard</a>
    </div>`

  return emailWrapper(content, 'Guild Hall - Your Weekly Progress').replace(/\{\{baseUrl\}\}/g, baseUrl)
}

/**
 * POST /api/emails/weekly-progress
 *
 * Sends weekly progress emails to all users who have enabled the feature.
 * GM-only access. Sends directly via Mailjet API.
 */
export async function POST() {
  try {
    const supabase = await createClient()

    // Check if user is authenticated and is a GM
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const isGm = roles?.some((r: { role: string }) => r.role === 'gm' || r.role === 'admin')
    if (!isGm) {
      return NextResponse.json({ error: 'Forbidden - GM access required' }, { status: 403 })
    }

    console.log(`[Weekly Progress] Manual push triggered by ${user.email}`)

    // Check Mailjet config
    if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
      return NextResponse.json({ error: 'Mailjet not configured' }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://guild-hall.netlify.app'

    // Get users with weekly email enabled
    const { data: prefsData, error: prefsError } = await supabase
      .from('user_weekly_email_prefs')
      .select('user_id, enabled')
      .eq('enabled', true)

    if (prefsError) {
      console.error('Error fetching prefs:', prefsError)
      return NextResponse.json({ error: 'Failed to fetch user preferences' }, { status: 500 })
    }

    const prefs: UserEmailPref[] = (prefsData as UserEmailPref[]) || []

    if (prefs.length === 0) {
      return NextResponse.json({ success: true, emailsSent: 0, message: 'No users have weekly emails enabled' })
    }

    // Get tier config for tier calculations
    const { data: tiersData } = await supabase
      .from('skill_tier_config')
      .select('id, name, min_points')
      .order('min_points', { ascending: true })

    const tiers: TierConfig[] = (tiersData as TierConfig[]) || []

    const getTierInfo = (points: number): TierInfo => {
      if (tiers.length === 0) {
        return { currentTier: 'Apprentice', nextTier: 'Journeyman', pointsToNext: 300 - points, progressPercent: Math.min(100, (points / 300) * 100) }
      }
      let currentTier = tiers[0]
      let nextTier: TierConfig | null = tiers[1] || null
      for (let i = tiers.length - 1; i >= 0; i--) {
        if (points >= tiers[i].min_points) {
          currentTier = tiers[i]
          nextTier = tiers[i + 1] || null
          break
        }
      }
      const pointsToNext = nextTier ? nextTier.min_points - points : 0
      const progressPercent = nextTier
        ? Math.min(100, ((points - currentTier.min_points) / (nextTier.min_points - currentTier.min_points)) * 100)
        : 100
      return { currentTier: currentTier.name, nextTier: nextTier?.name || null, pointsToNext, progressPercent: Math.round(progressPercent) }
    }

    const emailsSent: string[] = []
    const errors: string[] = []
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    for (const pref of prefs) {
      try {
        // Get user info
        const { data: userDataRaw } = await supabase
          .from('users')
          .select('id, email, display_name, total_points')
          .eq('id', pref.user_id)
          .single()

        const userData = userDataRaw as UserRecord | null

        if (!userData?.email) {
          errors.push(`${pref.user_id}: No email found`)
          continue
        }

        // Get weekly stats
        const { data: activitiesRaw } = await supabase
          .from('activities')
          .select('type, points_earned')
          .eq('user_id', pref.user_id)
          .gte('created_at', weekAgo.toISOString())

        const activities = (activitiesRaw as ActivityRecord[]) || []

        const stats: WeeklyStats = {
          objectivesSubmitted: 0,
          objectivesApproved: 0,
          questsCompleted: 0,
          pointsEarned: 0,
          currentStreak: 0,
        }

        for (const act of activities) {
          stats.pointsEarned += act.points_earned || 0
          if (act.type === 'objective_completed') stats.objectivesApproved++
          if (act.type === 'quest_completed') stats.questsCompleted++
        }

        // Get streak
        const { data: streakDataRaw } = await supabase
          .from('user_streaks')
          .select('current_streak')
          .eq('user_id', pref.user_id)
          .maybeSingle()

        const streakData = streakDataRaw as StreakRecord | null
        stats.currentStreak = streakData?.current_streak || 0

        // Get tier info
        const tierInfo = getTierInfo(userData.total_points || 0)

        // Render and send email
        const html = renderWeeklyEmail(
          {
            userId: userData.id,
            email: userData.email,
            displayName: userData.display_name || 'Guild Member',
            totalPoints: userData.total_points || 0,
          },
          stats,
          tierInfo,
          baseUrl
        )

        const result = await sendEmailViaMailjet(
          userData.email,
          userData.display_name || 'Guild Member',
          'Your Weekly Progress - Guild Hall',
          html
        )

        if (result.success) {
          emailsSent.push(pref.user_id)
          console.log(`[Weekly Progress] Sent to ${userData.email}`)
        } else {
          errors.push(`${pref.user_id}: ${result.error}`)
        }
      } catch (err) {
        errors.push(`${pref.user_id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent: emailsSent.length,
      userIds: emailsSent,
      errors: errors.length > 0 ? errors : undefined,
      message: `Weekly progress email sent to ${emailsSent.length} users`,
    })
  } catch (error) {
    console.error('Error sending weekly progress emails:', error)
    return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 })
  }
}
