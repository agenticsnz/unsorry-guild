// Shared email template utilities for Edge Functions
// ADR: ADR-012-Engagement-Improvements

/**
 * Base email wrapper with Guild Hall branding
 */
export function emailWrapper(content: string, title: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background-color: #f1f5f9;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
      color: white;
      padding: 32px;
      border-radius: 12px 12px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header p {
      margin: 0;
      opacity: 0.9;
      font-size: 14px;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin: 16px 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .section-title {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 12px 0;
    }
    .button {
      display: inline-block;
      background: #1e3a5f;
      color: white !important;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 500;
      margin-top: 12px;
    }
    .button:hover {
      background: #2d5a87;
    }
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .stat-item {
      text-align: center;
      padding: 16px 12px;
      background: #f8fafc;
      border-radius: 8px;
    }
    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #1e3a5f;
    }
    .stat-label {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }
    .alert-card {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 0 12px 12px 0;
      padding: 16px 20px;
      margin: 16px 0;
    }
    .success-card {
      background: #dcfce7;
      border-left: 4px solid #22c55e;
      border-radius: 0 12px 12px 0;
      padding: 16px 20px;
      margin: 16px 0;
    }
    .info-card {
      background: #f0f9ff;
      border: 2px solid #0ea5e9;
      border-radius: 8px;
      padding: 16px;
    }
    .info-card h3 {
      margin: 0 0 8px 0;
      color: #0369a1;
      font-size: 16px;
    }
    .list-item {
      padding: 12px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .list-item:last-child {
      border-bottom: none;
    }
    .muted {
      color: #64748b;
      font-size: 14px;
    }
    .footer {
      text-align: center;
      color: #94a3b8;
      font-size: 12px;
      padding: 24px 20px;
    }
    .footer a {
      color: #64748b;
      text-decoration: underline;
    }
    .progress-bar {
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
      margin: 8px 0;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #22c55e, #16a34a);
      border-radius: 4px;
    }
    .encouragement {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      padding: 20px;
      border-radius: 12px;
      text-align: center;
    }
    .tier-badge {
      display: inline-block;
      padding: 4px 12px;
      background: #1e3a5f;
      color: white;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="container">
    ${content}
    <div class="footer">
      <p>Guild Hall - Agentics NZ</p>
      <p>
        <a href="{{baseUrl}}/settings">Manage email preferences</a>
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
