import Link from 'next/link'
import { fetchSourcing } from '@/lib/unsorry/fetchers'
import { getGlobalLeaderboard, getLeaderboardExtras } from '@/lib/unsorry/standings'
import { getModelRegistryMap, joinModels } from '@/lib/unsorry/model-registry'
import { SummaryStats } from '@/components/leaderboard/summary-stats'
import { FreshnessIndicator } from '@/components/leaderboard/freshness-indicator'
import { LeaderboardTabs } from '@/components/leaderboard/leaderboard-tabs'
import type { GuildLeaderboardEntry, SourcingEntry } from '@/lib/unsorry/types'

export const metadata = { title: 'Leaderboard · Math · unsorry-guild' }
// Standings recompute from the git snapshot on read — render per request (ADR-024).
export const dynamic = 'force-dynamic'

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
  const { models, timelines, summary, generatedAt } = await getLeaderboardExtras()
  const registryMap = await getModelRegistryMap()
  const modelsWithPokemon = joinModels(models, registryMap)

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <FreshnessIndicator generatedAt={generatedAt} />
        </div>
        <p className="text-sm text-foreground/70">
          Difficulty-weighted contribution to the unsorry Math corpus, plus dispatch credit for
          landing others&rsquo; proofs. Source: unsorry git.{' '}
          <Link href="/math/scoring" className="underline hover:text-foreground">
            How scores are calculated
          </Link>
        </p>
      </div>

      {summary && <SummaryStats summary={summary} />}

      {entries.length > 0 ? (
        <LeaderboardTabs
          entries={entries}
          models={modelsWithPokemon}
          timelines={timelines}
          sourcing={sourcing}
        />
      ) : (
        <p className="text-sm text-foreground/70">Couldn&rsquo;t load leaderboard data right now.</p>
      )}
    </div>
  )
}
