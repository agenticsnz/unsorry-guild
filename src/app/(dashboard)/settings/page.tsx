'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Globe, Mail, Bell, Save, User } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { useUserWeeklyEmailPrefs, useUpdateUserWeeklyEmailPrefs } from '@/lib/hooks/use-user-weekly-email-prefs'
import { useUserStreak, useUpdateWeekendBehavior } from '@/lib/hooks/use-user-streak'
import { DAYS_OF_WEEK, type WeekendBehavior } from '@/lib/types/engagement'

const TIMEZONES = [
  // Pacific
  'Pacific/Auckland',
  'Pacific/Fiji',
  'Pacific/Honolulu',
  // Australia
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Brisbane',
  'Australia/Perth',
  'Australia/Adelaide',
  // Asia
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Asia/Dubai',
  // Europe
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Amsterdam',
  // Americas
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Vancouver',
]

/**
 * Get user's timezone from browser
 */
function getUserTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    // Return if it's in our list, otherwise default to Auckland
    return TIMEZONES.includes(tz) ? tz : 'Pacific/Auckland'
  } catch {
    return 'Pacific/Auckland'
  }
}

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0')
  return `${hour}:00`
})

const WEEKEND_BEHAVIORS: Array<{ value: WeekendBehavior; label: string; description: string }> = [
  {
    value: 'weekends_count',
    label: 'Weekends Count',
    description: 'Activity required on weekends to maintain streak',
  },
  {
    value: 'weekends_freeze',
    label: 'Weekends Freeze',
    description: 'Weekends don\'t affect your streak',
  },
  {
    value: 'weekends_optional',
    label: 'Weekends Optional',
    description: 'Weekend activity is bonus, missing doesn\'t break streak',
  },
]

export default function SettingsPage() {
  const [userId, setUserId] = useState<string | null>(null)

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    getUser()
  }, [])

  // Email preferences
  const { data: emailPrefs, isLoading: loadingEmail } = useUserWeeklyEmailPrefs(userId || undefined)
  const { mutate: updateEmailPrefs, isPending: savingEmail } = useUpdateUserWeeklyEmailPrefs()

  // Streak preferences
  const { data: streakInfo, isLoading: loadingStreak } = useUserStreak(userId || undefined)
  const { mutate: updateWeekendBehavior, isPending: savingStreak } = useUpdateWeekendBehavior()

  const [emailForm, setEmailForm] = useState(() => ({
    enabled: true,
    day_of_week: 1,
    send_time: '08:00',
    timezone: getUserTimezone(),
  }))

  const [weekendBehavior, setWeekendBehavior] = useState<WeekendBehavior>('weekends_count')

  // Initialize forms when data loads
  useEffect(() => {
    if (emailPrefs) {
      setEmailForm({
        enabled: emailPrefs.enabled,
        day_of_week: emailPrefs.day_of_week,
        send_time: emailPrefs.send_time,
        timezone: emailPrefs.timezone,
      })
    }
  }, [emailPrefs])

  useEffect(() => {
    if (streakInfo) {
      setWeekendBehavior(streakInfo.weekendBehavior)
    }
  }, [streakInfo])

  const handleSaveEmail = () => {
    if (!userId) return
    updateEmailPrefs({
      user_id: userId,
      ...emailForm,
    })
  }

  const handleSaveStreak = () => {
    if (!userId) return
    updateWeekendBehavior({
      userId,
      behavior: weekendBehavior,
    })
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const isLoading = loadingEmail || loadingStreak

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <>
          {/* Email Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <CardTitle>Weekly Progress Email</CardTitle>
              </div>
              <CardDescription>
                Receive a weekly summary of your progress, next steps, and encouragement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-enabled">Enable Weekly Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive progress summaries each week
                  </p>
                </div>
                <Switch
                  id="email-enabled"
                  checked={emailForm.enabled}
                  onCheckedChange={(checked) =>
                    setEmailForm(prev => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              {emailForm.enabled && (
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  Emails will be sent every <strong>{DAYS_OF_WEEK.find(d => d.value === emailForm.day_of_week)?.label}</strong> at{' '}
                  <strong>{emailForm.send_time}</strong> ({emailForm.timezone.replace(/_/g, ' ')})
                </p>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="day-of-week" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Day of Week
                  </Label>
                  <Select
                    value={emailForm.day_of_week.toString()}
                    onValueChange={(value) =>
                      setEmailForm(prev => ({ ...prev, day_of_week: parseInt(value) }))
                    }
                    disabled={!emailForm.enabled}
                  >
                    <SelectTrigger id="day-of-week">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map(day => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="send-time" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Preferred Time
                  </Label>
                  <Select
                    value={emailForm.send_time}
                    onValueChange={(value) =>
                      setEmailForm(prev => ({ ...prev, send_time: value }))
                    }
                    disabled={!emailForm.enabled}
                  >
                    <SelectTrigger id="send-time">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURS.map(hour => (
                        <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Timezone
                  </Label>
                  <Select
                    value={emailForm.timezone}
                    onValueChange={(value) =>
                      setEmailForm(prev => ({ ...prev, timezone: value }))
                    }
                    disabled={!emailForm.enabled}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map(tz => (
                        <SelectItem key={tz} value={tz}>{tz.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSaveEmail} disabled={savingEmail}>
                <Save className="mr-2 h-4 w-4" />
                {savingEmail ? 'Saving...' : 'Save Email Settings'}
              </Button>
            </CardContent>
          </Card>

          {/* Streak Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-500" />
                <CardTitle>Streak Settings</CardTitle>
              </div>
              <CardDescription>
                Configure how weekends affect your activity streak.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {WEEKEND_BEHAVIORS.map(behavior => (
                  <div
                    key={behavior.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      weekendBehavior === behavior.value
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setWeekendBehavior(behavior.value)}
                  >
                    <input
                      type="radio"
                      name="weekend-behavior"
                      value={behavior.value}
                      checked={weekendBehavior === behavior.value}
                      onChange={() => setWeekendBehavior(behavior.value)}
                      className="mt-1"
                    />
                    <div>
                      <Label className="font-medium">{behavior.label}</Label>
                      <p className="text-sm text-muted-foreground">
                        {behavior.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={handleSaveStreak} disabled={savingStreak}>
                <Save className="mr-2 h-4 w-4" />
                {savingStreak ? 'Saving...' : 'Save Streak Settings'}
              </Button>
            </CardContent>
          </Card>

          {/* Link to Profile */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Profile Settings</CardTitle>
              </div>
              <CardDescription>
                Update your display name, bio, and avatar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <a href="/profile">Go to Profile</a>
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
