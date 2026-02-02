// GM Daily Digest Edge Function
// Sends daily digest email to GMs with activity summary, pending reviews, and upcoming deadlines
// ADR: ADR-012-Engagement-Improvements, SPEC-012-E

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

import {
  emailWrapper,
  formatDate,
  isSameDay,
  escapeHtml,
  sendEmailViaMailjet,
} from '../_shared/email-templates.ts'

// Types
interface GMPreference {
  user_id: string
  digest_time: string
  timezone: string
  last_digest_sent_at: string | null
  users: {
    email: string
    display_name: string
  }
}

interface ActivitySummary {
  newSubmissions: number
  objectivesApproved: number
  objectivesRejected: number
  questsCompleted: number
  questsAccepted: number
  newUsers: number
}

interface PendingReview {
  userName: string
  questTitle: string
  objectiveTitle: string
  submittedAt: string
  hoursWaiting: number
}

interface UpcomingDeadline {
  userName: string
  questTitle: string
  deadline: string
  daysRemaining: number
  progressPercent: number
}

interface RecentCompletion {
  userName: string
  questTitle: string
  pointsEarned: number
  completedAt: string
}

interface DigestData {
  activity: ActivitySummary
  pendingReviews: PendingReview[]
  upcomingDeadlines: UpcomingDeadline[]
  recentCompletions: RecentCompletion[]
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Gather digest data from the database
 */
async function gatherDigestData(supabase: SupabaseClient): Promise<DigestData> {
  const now = new Date()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Activity summary from activities table
  const { data: activities } = await supabase
    .from('activities')
    .select('type, points_earned')
    .gte('created_at', twentyFourHoursAgo.toISOString())

  const activityCounts = {
    newSubmissions: 0,
    objectivesApproved: 0,
    objectivesRejected: 0,
    questsCompleted: 0,
    questsAccepted: 0,
    newUsers: 0,
  }

  // Count user_objectives with status 'submitted' in last 24h
  const { count: submittedCount } = await supabase
    .from('user_objectives')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'submitted')
    .gte('submitted_at', twentyFourHoursAgo.toISOString())

  activityCounts.newSubmissions = submittedCount || 0

  // Count from activities
  for (const activity of activities || []) {
    switch (activity.type) {
      case 'objective_completed':
        activityCounts.objectivesApproved++
        break
      case 'quest_completed':
        activityCounts.questsCompleted++
        break
      case 'quest_accepted':
        activityCounts.questsAccepted++
        break
    }
  }

  // Count new users in last 24h
  const { count: newUsersCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', twentyFourHoursAgo.toISOString())

  activityCounts.newUsers = newUsersCount || 0

  // Pending reviews
  const { data: pendingData } = await supabase
    .from('user_objectives')
    .select(`
      submitted_at,
      objectives!inner(title),
      user_quests!inner(
        user_id,
        quests!inner(title),
        users!inner(display_name)
      )
    `)
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: true })
    .limit(10)

  const pendingReviews: PendingReview[] = (pendingData || []).map((item: Record<string, unknown>) => {
    const userQuest = item.user_quests as Record<string, unknown>
    const quest = userQuest.quests as Record<string, unknown>
    const user = userQuest.users as Record<string, unknown>
    const objective = item.objectives as Record<string, unknown>
    const submittedAt = new Date(item.submitted_at as string)
    const hoursWaiting = Math.floor((now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60))

    return {
      userName: user.display_name as string || 'Unknown User',
      questTitle: quest.title as string || 'Unknown Quest',
      objectiveTitle: objective.title as string || 'Unknown Objective',
      submittedAt: submittedAt.toISOString(),
      hoursWaiting,
    }
  })

  // Upcoming deadlines (next 7 days)
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const { data: deadlineData } = await supabase
    .from('user_quests')
    .select(`
      deadline,
      extended_deadline,
      users!inner(display_name),
      quests!inner(title)
    `)
    .in('status', ['accepted', 'in_progress'])
    .not('deadline', 'is', null)
    .lte('deadline', sevenDaysFromNow.toISOString())
    .gte('deadline', now.toISOString())
    .order('deadline', { ascending: true })
    .limit(10)

  const upcomingDeadlines: UpcomingDeadline[] = (deadlineData || []).map((item: Record<string, unknown>) => {
    const user = item.users as Record<string, unknown>
    const quest = item.quests as Record<string, unknown>
    const effectiveDeadline = item.extended_deadline || item.deadline
    const deadlineDate = new Date(effectiveDeadline as string)
    const daysRemaining = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    return {
      userName: user.display_name as string || 'Unknown User',
      questTitle: quest.title as string || 'Unknown Quest',
      deadline: deadlineDate.toISOString(),
      daysRemaining,
      progressPercent: 0, // Would need additional query to calculate
    }
  })

  // Recent completions (last 24h)
  const { data: completionData } = await supabase
    .from('user_quests')
    .select(`
      completed_at,
      users!inner(display_name),
      quests!inner(title, points)
    `)
    .eq('status', 'completed')
    .gte('completed_at', twentyFourHoursAgo.toISOString())
    .order('completed_at', { descending: true })
    .limit(10)

  const recentCompletions: RecentCompletion[] = (completionData || []).map((item: Record<string, unknown>) => {
    const user = item.users as Record<string, unknown>
    const quest = item.quests as Record<string, unknown>

    return {
      userName: user.display_name as string || 'Unknown User',
      questTitle: quest.title as string || 'Unknown Quest',
      pointsEarned: quest.points as number || 0,
      completedAt: item.completed_at as string,
    }
  })

  return {
    activity: activityCounts,
    pendingReviews,
    upcomingDeadlines,
    recentCompletions,
  }
}

/**
 * Render the GM digest email HTML
 */
function renderDigestEmail(
  data: DigestData,
  displayName: string,
  date: Date,
  baseUrl: string
): string {
  const { activity, pendingReviews, upcomingDeadlines, recentCompletions } = data

  // Build sections
  let content = `
    <div class="header">
      <h1>GM Daily Digest</h1>
      <p>${formatDate(date)}</p>
    </div>

    <!-- Greeting -->
    <div class="card">
      <p style="font-size: 18px; margin: 0;">Kia ora, ${escapeHtml(displayName)}!</p>
      <p class="muted" style="margin: 8px 0 0 0;">Here's your daily summary of Guild Hall activity.</p>
    </div>

    <!-- Activity Summary -->
    <div class="card">
      <p class="section-title">Activity Summary (Last 24h)</p>
      <div class="stat-grid">
        <div class="stat-item">
          <div class="stat-value">${activity.newSubmissions}</div>
          <div class="stat-label">New Submissions</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${activity.objectivesApproved}</div>
          <div class="stat-label">Objectives Approved</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${activity.questsCompleted}</div>
          <div class="stat-label">Quests Completed</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${activity.questsAccepted}</div>
          <div class="stat-label">Quests Accepted</div>
        </div>
      </div>
      ${activity.newUsers > 0 ? `
        <p style="margin: 16px 0 0 0; text-align: center;">
          <span class="tier-badge">+${activity.newUsers} new guild member${activity.newUsers > 1 ? 's' : ''}</span>
        </p>
      ` : ''}
    </div>`

  // Pending Reviews section
  if (pendingReviews.length > 0) {
    content += `
    <div class="alert-card">
      <p class="section-title" style="color: #92400e;">Pending Reviews (${pendingReviews.length})</p>
      ${pendingReviews.map((review) => `
        <div class="list-item">
          <strong>${escapeHtml(review.userName)}</strong>
          <br>
          <span class="muted">${escapeHtml(review.questTitle)} / ${escapeHtml(review.objectiveTitle)}</span>
          <br>
          <span class="muted" style="font-size: 12px;">Waiting ${review.hoursWaiting}h</span>
        </div>
      `).join('')}
      <a href="${baseUrl}/gm/review" class="button">Review Now</a>
    </div>`
  }

  // Upcoming Deadlines section
  if (upcomingDeadlines.length > 0) {
    content += `
    <div class="card">
      <p class="section-title">Upcoming Deadlines</p>
      ${upcomingDeadlines.map((deadline) => `
        <div class="list-item">
          <strong>${escapeHtml(deadline.userName)}</strong>
          <span class="muted"> - ${escapeHtml(deadline.questTitle)}</span>
          <br>
          <span class="muted" style="font-size: 12px;">
            ${deadline.daysRemaining === 0 ? 'Due today!' : `${deadline.daysRemaining} day${deadline.daysRemaining > 1 ? 's' : ''} remaining`}
          </span>
        </div>
      `).join('')}
    </div>`
  }

  // Recent Completions section
  if (recentCompletions.length > 0) {
    content += `
    <div class="success-card">
      <p class="section-title" style="color: #166534;">Recent Completions</p>
      ${recentCompletions.map((completion) => `
        <div class="list-item">
          <strong>${escapeHtml(completion.userName)}</strong> completed <strong>${escapeHtml(completion.questTitle)}</strong>
          <br>
          <span class="muted" style="font-size: 12px;">+${completion.pointsEarned} points</span>
        </div>
      `).join('')}
    </div>`
  }

  // Quick Links section
  content += `
    <div class="card">
      <p class="section-title">Quick Links</p>
      <p style="text-align: center;">
        <a href="${baseUrl}/gm/review" style="margin: 0 8px;">Review Submissions</a> |
        <a href="${baseUrl}/gm/quests" style="margin: 0 8px;">Manage Quests</a> |
        <a href="${baseUrl}/gm/users" style="margin: 0 8px;">View Users</a>
      </p>
    </div>`

  return emailWrapper(content, 'Guild Hall - GM Daily Digest').replace(
    /\{\{baseUrl\}\}/g,
    baseUrl
  )
}

/**
 * Main handler
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const mailjetApiKey = Deno.env.get('MAILJET_API_KEY')
    const mailjetSecretKey = Deno.env.get('MAILJET_SECRET_KEY')
    const fromEmail = Deno.env.get('EMAIL_FROM_ADDRESS') || 'agentics@cgee.nz'
    const baseUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://guild-hall.agentics.nz'

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    if (!mailjetApiKey || !mailjetSecretKey) {
      throw new Error('Missing MAILJET_API_KEY or MAILJET_SECRET_KEY environment variable')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse optional request body for manual trigger
    let forceUserId: string | null = null
    try {
      const body = await req.json()
      forceUserId = body?.userId || null
    } catch {
      // No body or invalid JSON - that's fine for scheduled runs
    }

    // Get GMs who should receive digest
    let query = supabase
      .from('gm_email_preferences')
      .select(`
        user_id,
        digest_time,
        timezone,
        last_digest_sent_at,
        users!inner(email, display_name)
      `)
      .eq('daily_digest_enabled', true)

    if (forceUserId) {
      query = query.eq('user_id', forceUserId)
    }

    const { data: gms, error: gmError } = await query

    if (gmError) {
      console.error('Error fetching GM preferences:', gmError)
      throw gmError
    }

    const now = new Date()
    const emailsSent: string[] = []
    const errors: string[] = []

    for (const gm of (gms as GMPreference[]) || []) {
      try {
        // Check if current hour matches preferred time in GM's timezone
        const gmLocalTime = new Date(
          now.toLocaleString('en-US', { timeZone: gm.timezone })
        )
        const gmHour = gmLocalTime.getHours()
        const preferredHour = parseInt(gm.digest_time.split(':')[0], 10)

        // Skip if not the right time (unless forced)
        if (!forceUserId && gmHour !== preferredHour) {
          continue
        }

        // Check if already sent today (unless forced)
        if (!forceUserId && gm.last_digest_sent_at) {
          const lastSent = new Date(gm.last_digest_sent_at)
          if (isSameDay(lastSent, now, gm.timezone)) {
            console.log(`Skipping ${gm.user_id} - already sent today`)
            continue
          }
        }

        // Gather digest data
        const digestData = await gatherDigestData(supabase)

        // Render email
        const html = renderDigestEmail(
          digestData,
          gm.users.display_name || 'Game Master',
          now,
          baseUrl
        )

        // Send email via Mailjet
        const sendResult = await sendEmailViaMailjet(
          mailjetApiKey,
          mailjetSecretKey,
          gm.users.email,
          gm.users.display_name || 'Game Master',
          `GM Daily Digest - ${formatDate(now)}`,
          html,
          fromEmail
        )

        if (!sendResult.success) {
          console.error(`Error sending email to ${gm.user_id}:`, sendResult.error)
          errors.push(`${gm.user_id}: ${sendResult.error}`)
          continue
        }

        // Update last sent timestamp
        await supabase
          .from('gm_email_preferences')
          .update({ last_digest_sent_at: now.toISOString() })
          .eq('user_id', gm.user_id)

        emailsSent.push(gm.user_id)
        console.log(`Sent digest to GM ${gm.user_id}`)
      } catch (err) {
        console.error(`Error processing GM ${gm.user_id}:`, err)
        errors.push(`${gm.user_id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent: emailsSent.length,
        userIds: emailsSent,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('GM Daily Digest Error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
