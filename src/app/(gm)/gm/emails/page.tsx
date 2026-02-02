'use client'

import { useState } from 'react'
import { Send, Mail, Users, CheckCircle, AlertCircle, TestTube } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function GMEmailsPage() {
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success: boolean; count?: number; message?: string; error?: string } | null>(null)

  // Test email state
  const [testEmail, setTestEmail] = useState('')
  const [testDisplayName, setTestDisplayName] = useState('')
  const [sendingTest, setSendingTest] = useState<'gm-digest' | 'weekly-progress' | null>(null)

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

  const handleSendTestEmail = async (type: 'gm-digest' | 'weekly-progress') => {
    if (!testEmail) {
      setResult({ success: false, error: 'Please enter an email address' })
      return
    }

    setSendingTest(type)
    setResult(null)

    try {
      const response = await fetch('/api/emails/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          email: testEmail,
          displayName: testDisplayName || 'Test User',
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: data.message })
      } else {
        setResult({ success: false, error: data.error || 'Unknown error' })
      }
    } catch (error) {
      setResult({ success: false, error: 'Failed to send test email' })
    } finally {
      setSendingTest(null)
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
            {result.success ? 'Success' : 'Failed'}
          </AlertTitle>
          <AlertDescription>
            {result.success
              ? result.message || `Successfully sent ${result.count} email${result.count !== 1 ? 's' : ''}.`
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

      {/* Test Email Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-purple-500" />
            <CardTitle>Send Test Emails</CardTitle>
          </div>
          <CardDescription>
            Send test emails to preview templates before sending to users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="test-email">Email Address</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="test-name">Display Name (optional)</Label>
              <Input
                id="test-name"
                placeholder="Test User"
                value={testDisplayName}
                onChange={(e) => setTestDisplayName(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => handleSendTestEmail('gm-digest')}
              disabled={sendingTest !== null || !testEmail}
            >
              <Mail className="mr-2 h-4 w-4" />
              {sendingTest === 'gm-digest' ? 'Sending...' : 'Test GM Digest'}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSendTestEmail('weekly-progress')}
              disabled={sendingTest !== null || !testEmail}
            >
              <Users className="mr-2 h-4 w-4" />
              {sendingTest === 'weekly-progress' ? 'Sending...' : 'Test Weekly Progress'}
            </Button>
          </div>
        </CardContent>
      </Card>

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
              When creating banners with &ldquo;Also send email&rdquo; enabled, users receive
              email notifications if they have email notifications enabled.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
