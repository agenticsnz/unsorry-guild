import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Brand colors from the Guild Hall theme (matching shared email-templates.ts)
const BRAND = {
  gold: '#B8860B',
  cream: '#FDF8E8',
  accentGold: '#C9A857',
  textDark: '#3D2E1F',
  success: '#16a34a',
  warning: '#d97706',
  error: '#dc2626',
}

const LOGO_URL = 'https://cdn.disco.co/media/agentics-logo-enhanced-removebg-preview_2949fb89-758d-4d9d-ae30-a51cea979427.png'

// Email template wrapper (matching shared email-templates.ts)
function emailWrapper(content: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: ${BRAND.cream};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: ${BRAND.textDark};
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background-color: #F5F0E6;
      padding: 16px 24px;
      border-bottom: 1px solid #E5DDD0;
    }
    .header-text {
      font-size: 18px;
      font-weight: 600;
      color: ${BRAND.textDark};
    }
    .header-logo {
      height: 28px;
      vertical-align: middle;
      margin: 0 8px;
    }
    .content {
      padding: 32px 24px;
      color: ${BRAND.textDark};
    }
    .hero {
      text-align: center;
      padding: 24px 0;
    }
    .hero-icon {
      font-size: 48px;
    }
    .hero-text {
      font-size: 28px;
      font-weight: bold;
      color: ${BRAND.textDark};
      margin: 16px 0 8px 0;
    }
    .hero-subtitle {
      font-size: 16px;
      color: #666666;
      margin: 0;
    }
    .card {
      background: #f8f8f8;
      border-radius: 8px;
      padding: 20px;
      margin: 16px 0;
    }
    .section-title {
      font-size: 12px;
      font-weight: 600;
      color: #888888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 12px 0;
    }
    .button {
      display: inline-block;
      background-color: ${BRAND.gold};
      color: #ffffff !important;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 16px 0;
    }
    .stat-grid {
      display: flex;
      justify-content: center;
      gap: 24px;
      flex-wrap: wrap;
      margin: 16px 0;
    }
    .stat-item {
      text-align: center;
      padding: 16px;
      background: #ffffff;
      border-radius: 8px;
      min-width: 100px;
    }
    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: ${BRAND.gold};
    }
    .stat-label {
      font-size: 12px;
      color: #666666;
      margin-top: 4px;
    }
    .alert-card {
      background: #FEF9E7;
      border-left: 4px solid ${BRAND.warning};
      border-radius: 0 8px 8px 0;
      padding: 16px 20px;
      margin: 16px 0;
    }
    .success-card {
      background: #E8F5E9;
      border-left: 4px solid ${BRAND.success};
      border-radius: 0 8px 8px 0;
      padding: 16px 20px;
      margin: 16px 0;
    }
    .info-card {
      background: #f5f5f5;
      border-left: 4px solid ${BRAND.gold};
      border-radius: 0 8px 8px 0;
      padding: 16px 20px;
      margin: 16px 0;
    }
    .info-card h3 {
      margin: 0 0 8px 0;
      color: ${BRAND.textDark};
      font-size: 16px;
    }
    .list-item {
      padding: 12px 0;
      border-bottom: 1px solid #e5e5e5;
    }
    .list-item:last-child {
      border-bottom: none;
    }
    .muted {
      color: #666666;
      font-size: 14px;
    }
    .footer {
      background-color: #f5f5f5;
      text-align: center;
      color: #666666;
      font-size: 12px;
      padding: 24px 20px;
    }
    .footer a {
      color: #666666;
      text-decoration: underline;
    }
    .progress-bar {
      height: 8px;
      background: #e5e5e5;
      border-radius: 4px;
      overflow: hidden;
      margin: 8px 0;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, ${BRAND.gold}, ${BRAND.accentGold});
      border-radius: 4px;
    }
    .encouragement {
      background: linear-gradient(135deg, #FEF9E7 0%, #FDF5D6 100%);
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin: 16px 0;
    }
    .tier-badge {
      display: inline-block;
      padding: 4px 12px;
      background: ${BRAND.gold};
      color: white;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }
    @media only screen and (max-width: 600px) {
      .content { padding: 24px 16px; }
      .stat-grid { flex-direction: column; gap: 12px; }
      .stat-item { min-width: auto; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="header-text">Guild Hall</span>
      <img src="${LOGO_URL}" alt="Logo" class="header-logo">
      <span class="header-text">Agentics NZ</span>
    </div>

    <div class="content">
      ${content}
    </div>

    <div class="footer">
      <p>This email was sent by Guild Hall - Agentics NZ</p>
      <p>
        <a href="{{baseUrl}}/settings">Email Preferences</a> |
        <a href="{{baseUrl}}">Visit Guild Hall</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-NZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-NZ', {
    month: 'short',
    day: 'numeric',
  })
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * Render GM Daily Digest test email
 */
function renderGMDigestTestEmail(displayName: string, baseUrl: string): string {
  const now = new Date()

  const content = `
    <div class="header">
      <h1>GM Daily Digest</h1>
      <p>${formatDate(now)}</p>
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
          <div class="stat-value">3</div>
          <div class="stat-label">New Submissions</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">5</div>
          <div class="stat-label">Objectives Approved</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">2</div>
          <div class="stat-label">Quests Completed</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">4</div>
          <div class="stat-label">Quests Accepted</div>
        </div>
      </div>
      <p style="margin: 16px 0 0 0; text-align: center;">
        <span class="tier-badge">+2 new guild members</span>
      </p>
    </div>

    <div class="alert-card">
      <p class="section-title" style="color: #92400e;">Pending Reviews (3)</p>
      <div class="list-item">
        <strong>Alice Smith</strong>
        <br>
        <span class="muted">First Steps in the Realm / Complete Profile</span>
        <br>
        <span class="muted" style="font-size: 12px;">Waiting 4h</span>
      </div>
      <div class="list-item">
        <strong>Bob Johnson</strong>
        <br>
        <span class="muted">Agent Swarm Commander / Deploy First Agent</span>
        <br>
        <span class="muted" style="font-size: 12px;">Waiting 12h</span>
      </div>
      <a href="${baseUrl}/gm/review" class="button">Review Now</a>
    </div>

    <div class="card">
      <p class="section-title">Upcoming Deadlines</p>
      <div class="list-item">
        <strong>Charlie Davis</strong>
        <span class="muted"> - The Sovereign Engine</span>
        <br>
        <span class="muted" style="font-size: 12px;">3 days remaining</span>
      </div>
    </div>

    <div class="success-card">
      <p class="section-title" style="color: #166534;">Recent Completions</p>
      <div class="list-item">
        <strong>Diana Evans</strong> completed <strong>First Steps in the Realm</strong>
        <br>
        <span class="muted" style="font-size: 12px;">+50 points</span>
      </div>
      <div class="list-item">
        <strong>Edward Foster</strong> completed <strong>Agent Swarm Commander</strong>
        <br>
        <span class="muted" style="font-size: 12px;">+150 points</span>
      </div>
    </div>

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
 * Render User Weekly Progress test email
 */
function renderWeeklyProgressTestEmail(displayName: string, baseUrl: string): string {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const content = `
    <div class="header">
      <h1>Your Weekly Progress</h1>
      <p>Week of ${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}</p>
    </div>

    <!-- Greeting -->
    <div class="card">
      <p style="font-size: 18px; margin: 0;">Kia ora, ${escapeHtml(displayName)}!</p>
      <p style="margin: 12px 0 0 0;">Great work! You earned 125 points this week.</p>
    </div>

    <div class="card">
      <p class="section-title">Recommended Action</p>
      <div class="info-card">
        <h3>You have 2 approved objectives ready to continue!</h3>
        <a href="${baseUrl}/my-quests" class="button">
          Continue Your Quest
        </a>
      </div>
    </div>

    <div class="card">
      <p class="section-title">Ready to Continue</p>
      <div class="list-item">
        <strong>Agent Swarm Commander</strong>
        <br>
        <span class="muted">Deploy First Agent (2/5 objectives)</span>
      </div>
      <div class="list-item">
        <strong>The Sovereign Engine</strong>
        <br>
        <span class="muted">Configure AI Model (1/4 objectives)</span>
      </div>
      <a href="${baseUrl}/my-quests" class="button">View Active Quests</a>
    </div>

    <div class="card">
      <p class="section-title">This Week's Progress</p>
      <div class="stat-grid">
        <div class="stat-item">
          <div class="stat-value">4</div>
          <div class="stat-label">Objectives Submitted</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">3</div>
          <div class="stat-label">Objectives Approved</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">1</div>
          <div class="stat-label">Quests Completed</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">+125</div>
          <div class="stat-label">Points Earned</div>
        </div>
      </div>
    </div>

    <div class="card">
      <p class="section-title">Tier Progress</p>
      <div style="background: #f8fafc; padding: 16px; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="tier-badge">Journeyman</span>
          <span class="muted">175 pts to Expert</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: 42%"></div>
        </div>
      </div>
    </div>

    <div class="encouragement">
      <span style="font-size: 32px;">&#128293;</span>
      <p style="margin: 8px 0 0 0; font-weight: 600;">5 Day Streak!</p>
    </div>`

  return emailWrapper(content, 'Guild Hall - Your Weekly Progress').replace(
    /\{\{baseUrl\}\}/g,
    baseUrl
  )
}

/**
 * POST /api/emails/test
 *
 * Send test emails to specified addresses.
 * Requires GM authentication.
 *
 * Body:
 * {
 *   type: 'gm-digest' | 'weekly-progress',
 *   email: string,
 *   displayName?: string
 * }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated and is a GM
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is GM (using user_roles table)
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const isGm = roles?.some((r: { role: string }) => r.role === 'gm' || r.role === 'admin')

    if (!isGm) {
      return NextResponse.json({ error: 'Forbidden - GM access required' }, { status: 403 })
    }

    // Get request body
    const body = await request.json()
    const { type, email, displayName = 'Test User' } = body

    if (!type || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: type and email' },
        { status: 400 }
      )
    }

    if (!['gm-digest', 'weekly-progress'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid email type. Use "gm-digest" or "weekly-progress"' },
        { status: 400 }
      )
    }

    // Check for Mailjet API keys (configured in Netlify environment variables)
    const mailjetApiKey = process.env.MAILJET_API_KEY
    const mailjetSecretKey = process.env.MAILJET_SECRET_KEY
    if (!mailjetApiKey || !mailjetSecretKey) {
      return NextResponse.json(
        { error: 'MAILJET_API_KEY or MAILJET_SECRET_KEY not configured. Add them to Netlify environment variables.' },
        { status: 500 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://guild-hall.agentics.nz'
    const fromEmail = process.env.EMAIL_FROM_ADDRESS || 'agentics@cgee.nz'

    // Render the appropriate email
    let html: string
    let subject: string

    if (type === 'gm-digest') {
      html = renderGMDigestTestEmail(displayName, baseUrl)
      subject = `[TEST] GM Daily Digest - ${formatDate(new Date())}`
    } else {
      html = renderWeeklyProgressTestEmail(displayName, baseUrl)
      subject = '[TEST] Your Weekly Progress - Guild Hall'
    }

    // Send via Mailjet API
    const mailjetResponse = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${mailjetApiKey}:${mailjetSecretKey}`).toString('base64')}`,
      },
      body: JSON.stringify({
        Messages: [
          {
            From: {
              Email: fromEmail,
              Name: 'Guild Hall',
            },
            To: [
              {
                Email: email,
                Name: displayName,
              },
            ],
            Subject: subject,
            HTMLPart: html,
          },
        ],
      }),
    })

    const mailjetResult = await mailjetResponse.json()

    if (!mailjetResponse.ok || mailjetResult.Messages?.[0]?.Status === 'error') {
      console.error('Error sending test email:', mailjetResult)
      const errorMsg = mailjetResult.Messages?.[0]?.Errors?.[0]?.ErrorMessage || 'Unknown error'
      return NextResponse.json(
        { error: `Failed to send email: ${errorMsg}` },
        { status: 500 }
      )
    }

    console.log(`[Test Email] Sent ${type} to ${email} by ${user.email}`)

    return NextResponse.json({
      success: true,
      message: `Test ${type} email sent to ${email}`,
      messageId: mailjetResult.Messages?.[0]?.To?.[0]?.MessageID,
    })
  } catch (error) {
    console.error('Error in test email endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    )
  }
}
