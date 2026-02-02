'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Users, Bell, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { usePrivacySettings, useUpdatePrivacySettings } from '@/lib/hooks/use-privacy-settings'
import { useEngagementPreferences, useUpdateEngagementPreferences } from '@/lib/hooks/use-engagement-preferences'
import { createClient } from '@/lib/supabase/client'

export function PrivacyForm() {
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

  // Profile privacy settings
  const { data: privacySettings, isLoading: loadingPrivacy } = usePrivacySettings()
  const updatePrivacySettings = useUpdatePrivacySettings()

  // Engagement preferences
  const { data: engagementPrefs, isLoading: loadingEngagement } = useEngagementPreferences(userId || undefined)
  const { mutate: updateEngagementPrefs, isPending: savingEngagement } = useUpdateEngagementPreferences()

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Profile visibility form
  const [profileForm, setProfileForm] = useState({
    show_profile: true,
    show_stats: true,
    show_activity: true,
    allow_guild_invites: true,
  })

  // Engagement form
  const [engagementForm, setEngagementForm] = useState({
    show_activity_in_feed: true,
    show_streak_publicly: true,
    enable_nudge_banners: true,
  })

  // Update forms when data loads
  useEffect(() => {
    if (privacySettings) {
      setProfileForm({
        show_profile: privacySettings.show_profile,
        show_stats: privacySettings.show_stats,
        show_activity: privacySettings.show_activity,
        allow_guild_invites: privacySettings.allow_guild_invites,
      })
    }
  }, [privacySettings])

  useEffect(() => {
    if (engagementPrefs) {
      setEngagementForm({
        show_activity_in_feed: engagementPrefs.show_activity_in_feed,
        show_streak_publicly: engagementPrefs.show_streak_publicly,
        enable_nudge_banners: engagementPrefs.enable_nudge_banners,
      })
    }
  }, [engagementPrefs])

  const handleProfileToggle = (field: keyof typeof profileForm) => {
    setProfileForm((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const handleEngagementToggle = (field: keyof typeof engagementForm) => {
    setEngagementForm((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const handleSaveAll = async () => {
    setError(null)
    setSuccess(false)

    try {
      // Save profile privacy settings
      await updatePrivacySettings.mutateAsync(profileForm)

      // Save engagement preferences
      if (userId) {
        updateEngagementPrefs({
          userId,
          preferences: engagementForm,
        })
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings')
    }
  }

  const isLoading = loadingPrivacy || loadingEngagement
  const isSaving = updatePrivacySettings.isPending || savingEngagement

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Visibility */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Profile Visibility</CardTitle>
          </div>
          <CardDescription>Control what others can see about you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show_profile">Show Profile</Label>
              <p className="text-sm text-muted-foreground">Allow others to view your profile</p>
            </div>
            <Switch
              id="show_profile"
              checked={profileForm.show_profile}
              onCheckedChange={() => handleProfileToggle('show_profile')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show_stats">Show Stats</Label>
              <p className="text-sm text-muted-foreground">Display your points and quest completion</p>
            </div>
            <Switch
              id="show_stats"
              checked={profileForm.show_stats}
              onCheckedChange={() => handleProfileToggle('show_stats')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show_activity">Show Activity</Label>
              <p className="text-sm text-muted-foreground">Let others see your recent activity</p>
            </div>
            <Switch
              id="show_activity"
              checked={profileForm.show_activity}
              onCheckedChange={() => handleProfileToggle('show_activity')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allow_guild_invites">Allow Guild Invites</Label>
              <p className="text-sm text-muted-foreground">Receive invitations to join guilds</p>
            </div>
            <Switch
              id="allow_guild_invites"
              checked={profileForm.allow_guild_invites}
              onCheckedChange={() => handleProfileToggle('allow_guild_invites')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Activity & Engagement */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-teal-500" />
            <CardTitle>Activity & Engagement</CardTitle>
          </div>
          <CardDescription>
            Control how your activity is shared and what notifications you see
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="share-activity" className="flex items-center gap-2">
                {engagementForm.show_activity_in_feed ? (
                  <Eye className="h-4 w-4 text-green-500" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
                Share activity in guild feed
              </Label>
              <p className="text-sm text-muted-foreground">
                Show your quest completions and achievements in the guild activity feed
              </p>
            </div>
            <Switch
              id="share-activity"
              checked={engagementForm.show_activity_in_feed}
              onCheckedChange={() => handleEngagementToggle('show_activity_in_feed')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-streak">Show streak on profile</Label>
              <p className="text-sm text-muted-foreground">
                Display your activity streak on your public profile
              </p>
            </div>
            <Switch
              id="show-streak"
              checked={engagementForm.show_streak_publicly}
              onCheckedChange={() => handleEngagementToggle('show_streak_publicly')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-nudges">Enable nudge banners</Label>
              <p className="text-sm text-muted-foreground">
                Show helpful reminders and suggestions on your dashboard
              </p>
            </div>
            <Switch
              id="enable-nudges"
              checked={engagementForm.enable_nudge_banners}
              onCheckedChange={() => handleEngagementToggle('enable_nudge_banners')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button & Feedback */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">{error}</div>
      )}

      {success && (
        <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded">
          Privacy settings updated successfully!
        </div>
      )}

      <Button onClick={handleSaveAll} disabled={isSaving}>
        <Save className="mr-2 h-4 w-4" />
        {isSaving ? 'Saving...' : 'Save Privacy Settings'}
      </Button>
    </div>
  )
}
