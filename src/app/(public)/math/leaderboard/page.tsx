import { fetchLeaderboardUi, fetchSourcing } from '@/lib/unsorry/fetchers'
import { toGuildLeaderboard } from '@/lib/unsorry/leaderboard-mapper'
import { SummaryStats } from '@/components/leaderboard/summary-stats'
import { LeaderboardTabs } from '@/components/leaderboard/leaderboard-tabs'
import type { LeaderboardUi, SourcingEntry } from '@/lib/unsorry/types'

export const metadata = { title: 'Leaderboard · Math · unsorry-guild' }
export const revalidate = 600

export default async function LeaderboardPage() {
  let ui: LeaderboardUi | null = null
  let sourcing: SourcingEntry[] = []
  try {
    ui = await fetchLeaderboardUi()
  } catch {
    ui = null
  }
  try {
    sourcing = await fetchSourcing()
  } catch {
    sourcing = []
  }

  const entries = ui ? toGuildLeaderboard(ui.contributors) : []

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-sm text-foreground/70">
          Difficulty-weighted contribution to the unsorry Math corpus. Source: unsorry git.
        </p>
      </div>

      {ui?.summary && <SummaryStats summary={ui.summary} />}

      {ui ? (
        <LeaderboardTabs
          entries={entries}
          models={ui.models ?? []}
          timelines={ui.timelines ?? null}
          sourcing={sourcing}
        />
      ) : (
        <p className="text-sm text-foreground/70">Couldn&rsquo;t load leaderboard data right now.</p>
      )}
    </div>
  )
}
