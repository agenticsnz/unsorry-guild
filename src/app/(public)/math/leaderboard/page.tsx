import { fetchGlobalLeaderboard } from '@/lib/unsorry/fetchers'
import { toGuildLeaderboard } from '@/lib/unsorry/leaderboard-mapper'
import { GlobalLeaderboard } from '@/components/leaderboard/global-leaderboard'
import type { GuildLeaderboardEntry } from '@/lib/unsorry/types'

export const metadata = { title: 'Leaderboard · Math · unsorry-guild' }
export const revalidate = 600

export default async function LeaderboardPage() {
  let entries: GuildLeaderboardEntry[] = []
  let failed = false
  try {
    entries = toGuildLeaderboard(await fetchGlobalLeaderboard())
  } catch {
    failed = true
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-sm text-foreground/70">
          Difficulty-weighted contribution to the unsorry Math corpus. Source: unsorry git.
        </p>
      </div>
      {failed ? (
        <p className="text-sm text-foreground/70">Couldn&rsquo;t load leaderboard data right now.</p>
      ) : (
        <GlobalLeaderboard entries={entries} />
      )}
    </div>
  )
}
