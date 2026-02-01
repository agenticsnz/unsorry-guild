'use client'

import { useState, useEffect } from 'react'
import { Clock, Globe, Bell, Save } from 'lucide-react'
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
import { useGMEmailPreferences, useUpdateGMEmailPreferences } from '@/lib/hooks/use-gm-email-preferences'
import type { GMEmailPreferences } from '@/lib/types/engagement'

const TIMEZONES = [
  'Pacific/Auckland',
  'Pacific/Fiji',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Brisbane',
  'Australia/Perth',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
]

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0')
  return `${hour}:00`
})

export default function GMEmailSettingsPage() {
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

  const { data: preferences, isLoading } = useGMEmailPreferences(userId || undefined)
  const { mutate: updatePreferences, isPending: saving } = useUpdateGMEmailPreferences()

  const [formData, setFormData] = useState<Partial<GMEmailPreferences>>({
    daily_digest_enabled: true,
    digest_time: '08:00',
    timezone: 'Pacific/Auckland',
    default_quest_filter: 'published',
  })

  // Initialize form when preferences load
  useEffect(() => {
    if (preferences) {
      setFormData({
        daily_digest_enabled: preferences.daily_digest_enabled,
        digest_time: preferences.digest_time,
        timezone: preferences.timezone,
        default_quest_filter: preferences.default_quest_filter,
      })
    }
  }, [preferences])

  const handleSave = () => {
    if (!userId) return

    updatePreferences({
      user_id: userId,
      ...formData,
    })
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Settings</h1>
          <p className="text-muted-foreground">
            Configure your GM email preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Daily Digest</CardTitle>
              </div>
              <CardDescription>
                Receive a daily summary of guild activity, pending reviews, and upcoming deadlines.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="digest-enabled">Enable Daily Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email summaries each day
                  </p>
                </div>
                <Switch
                  id="digest-enabled"
                  checked={formData.daily_digest_enabled}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, daily_digest_enabled: checked }))
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="digest-time" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Preferred Time
                  </Label>
                  <Select
                    value={formData.digest_time}
                    onValueChange={(value) =>
                      setFormData(prev => ({ ...prev, digest_time: value }))
                    }
                    disabled={!formData.daily_digest_enabled}
                  >
                    <SelectTrigger id="digest-time">
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
                    value={formData.timezone}
                    onValueChange={(value) =>
                      setFormData(prev => ({ ...prev, timezone: value }))
                    }
                    disabled={!formData.daily_digest_enabled}
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quest Dashboard Default</CardTitle>
              <CardDescription>
                Choose the default filter when viewing the GM quest list.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="quest-filter">Default Quest Filter</Label>
                <Select
                  value={formData.default_quest_filter}
                  onValueChange={(value) =>
                    setFormData(prev => ({
                      ...prev,
                      default_quest_filter: value as 'all' | 'draft' | 'published' | 'archived'
                    }))
                  }
                >
                  <SelectTrigger id="quest-filter" className="w-48">
                    <SelectValue placeholder="Select filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Quests</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Drafts</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
