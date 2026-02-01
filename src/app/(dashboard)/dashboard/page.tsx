import { createClient } from '@/lib/supabase/server'
import { EngagementDashboard } from '@/components/dashboard/engagement-dashboard'

export const metadata = {
  title: 'Dashboard | Guild Hall',
  description: 'Your Guild Hall dashboard',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch user profile - handle cases where profile may not exist yet
  let displayName = user?.email || 'User'
  let points = 0
  let userId = user?.id || ''

  if (user?.id) {
    const { data: profile } = await supabase
      .from('users')
      .select('display_name, total_points')
      .eq('id', user.id)
      .single()

    if (profile) {
      displayName = (profile as { display_name?: string; total_points?: number }).display_name || displayName
      points = (profile as { display_name?: string; total_points?: number }).total_points || 0
    }
  }

  // Fetch active quests with quest details for the smart quest section
  let activeQuests: Array<{
    id: string
    quest_id: string
    quests: {
      id: string
      title: string
      description: string
      points: number
      category_id: string | null
    }
  }> = []

  if (user?.id) {
    const { data: userQuests } = await supabase
      .from('user_quests')
      .select(`
        id,
        quest_id,
        quests!inner (
          id,
          title,
          description,
          points,
          category_id
        )
      `)
      .eq('user_id', user.id)
      .in('status', ['accepted', 'in_progress'])
      .order('updated_at', { ascending: false })
      .limit(5)

    if (userQuests) {
      activeQuests = userQuests as typeof activeQuests
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <EngagementDashboard
        userId={userId}
        displayName={displayName}
        userPoints={points}
        initialActiveQuests={activeQuests}
        guildEventsFeedUrl={process.env.NEXT_PUBLIC_GUILD_EVENTS_FEED_URL}
        mentorshipSignupUrl={process.env.NEXT_PUBLIC_MENTORSHIP_SIGNUP_URL}
      />
    </div>
  )
}
