'use client'

import { useState } from 'react'
import { Send, Mail, Users, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function GMEmailsPage() {
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success: boolean; count: number; error?: string } | null>(null)

  const handleSendWeeklyEmails = async () => {
    if (!confirm('This will send the weekly progress email to all users who have enabled it. Continue?')) {
      return
    }

    setSending(true)
    setResult(null)

    try {
      const response = await fetch('/api/emails/weekly-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manual: true }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, count: data.emailsSent || 0 })
      } else {
        setResult({ success: false, count: 0, error: data.error || 'Unknown error' })
      }
    } catch (error) {
      setResult({ success: false, count: 0, error: 'Failed to send emails' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email Management</h1>
        <p className="text-muted-foreground">
          Manage email communications with guild members
        </p>
      </div>

      {result && (
        <Alert variant={result.success ? 'default' : 'destructive'}>
          {result.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {result.success ? 'Emails Sent Successfully' : 'Failed to Send Emails'}
          </AlertTitle>
          <AlertDescription>
            {result.success
              ? `Successfully sent ${result.count} weekly progress email${result.count !== 1 ? 's' : ''}.`
              : result.error}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Weekly Progress Email</CardTitle>
            </div>
            <CardDescription>
              Send the weekly progress email to all users with the feature enabled.
              Useful for special announcements or pre-event reminders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleSendWeeklyEmails}
              disabled={sending}
              className="w-full"
            >
              <Send className="mr-2 h-4 w-4" />
              {sending ? 'Sending...' : 'Send Weekly Progress to All Users'}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              This sends immediately, bypassing the scheduled send time.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <CardTitle>GM Daily Digest</CardTitle>
            </div>
            <CardDescription>
              The daily digest is sent automatically to GMs based on their preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full">
              <a href="/gm/settings/email">
                Configure Digest Settings
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email System Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">GM Daily Digest</h4>
            <p className="text-sm text-muted-foreground">
              Sent daily to GMs at their preferred time. Contains activity summary,
              pending reviews, upcoming deadlines, and quick links.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">User Weekly Progress</h4>
            <p className="text-sm text-muted-foreground">
              Sent weekly to users (default: Monday 8am). Contains next steps,
              recommended actions, progress summary, and encouragement.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Banner Email Notifications</h4>
            <p className="text-sm text-muted-foreground">
              When creating banners with "Also send email" enabled, users receive
              email notifications if they have email notifications enabled.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
