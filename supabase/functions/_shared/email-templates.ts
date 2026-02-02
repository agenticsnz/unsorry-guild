// Shared email template utilities for Edge Functions
// ADR: ADR-012-Engagement-Improvements
// Based on original send-email template style

// Brand colors from the Guild Hall theme
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

/**
 * Base email wrapper with Guild Hall branding
 * Matches the established send-email template style
 */
export function emailWrapper(content: string, title: string, previewText?: string): string {
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
  ${previewText ? `<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</div>` : ''}

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

/**
 * Format a date for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-NZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format a short date
 */
export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-NZ', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Get week range string
 */
export function getWeekRange(date: Date): { start: string; end: string } {
  const weekStart = new Date(date)
  weekStart.setDate(date.getDate() - date.getDay()) // Sunday

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6) // Saturday

  return {
    start: formatShortDate(weekStart),
    end: formatShortDate(weekEnd),
  }
}

/**
 * Check if two dates are the same day in a given timezone
 */
export function isSameDay(date1: Date, date2: Date, timezone: string): boolean {
  const d1Str = date1.toLocaleDateString('en-US', { timeZone: timezone })
  const d2Str = date2.toLocaleDateString('en-US', { timeZone: timezone })
  return d1Str === d2Str
}

/**
 * Escape HTML entities
 */
export function escapeHtml(text: string): string {
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
 * Send email via Mailjet API
 */
export async function sendEmailViaMailjet(
  apiKey: string,
  secretKey: string,
  toEmail: string,
  toName: string,
  subject: string,
  html: string,
  fromEmail: string = 'agentics@cgee.nz'
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const response = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${apiKey}:${secretKey}`)}`,
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
                Email: toEmail,
                Name: toName,
              },
            ],
            Subject: subject,
            HTMLPart: html,
          },
        ],
      }),
    })

    const result = await response.json()

    if (!response.ok || result.Messages?.[0]?.Status === 'error') {
      const errorMsg = result.Messages?.[0]?.Errors?.[0]?.ErrorMessage || 'Unknown Mailjet error'
      return { success: false, error: errorMsg }
    }

    return {
      success: true,
      messageId: result.Messages?.[0]?.To?.[0]?.MessageID,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
