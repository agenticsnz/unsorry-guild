import { fetchSourcing } from '@/lib/unsorry/fetchers'
import { getGlobalLeaderboard, getLeaderboardExtras } from '@/lib/unsorry/standings'
import { SummaryStats } from '@/components/leaderboard/summary-stats'
import { LeaderboardTabs } from '@/components/leaderboard/leaderboard-tabs'
import type { GuildLeaderboardEntry, SourcingEntry } from '@/lib/unsorry/types'

export const metadata = { title: 'Leaderboard · Math · unsorry-guild' }
// Short revalidate: standings recompute from the git snapshot on read (ADR-024).
export const revalidate = 60

export default async function LeaderboardPage() {
  let entries: GuildLeaderboardEntry[] = []
  let sourcing: SourcingEntry[] = []
  try {
    entries = await getGlobalLeaderboard()
  } catch {
    entries = []
  }
  try {
    sourcing = await fetchSourcing()
  } catch {
    sourcing = []
  }
  const { models, timelines, summary } = await getLeaderboardExtras()

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-sm text-foreground/70">
          Difficulty-weighted contribution to the unsorry Math corpus. Source: unsorry git.
        </p>
      </div>

      {summary && <SummaryStats summary={summary} />}

      {entries.length > 0 ? (
        <LeaderboardTabs
          entries={entries}
          models={models}
          timelines={timelines}
          sourcing={sourcing}
        />
      ) : (
        <p className="text-sm text-foreground/70">Couldn&rsquo;t load leaderboard data right now.</p>
      )}
    </div>
  )
}
