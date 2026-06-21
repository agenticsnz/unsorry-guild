'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GlobalLeaderboard } from './global-leaderboard'
import { LeaderboardBar } from './leaderboard-bar'
import { ModelDistribution } from './model-distribution'
import { ProofsOverTime } from './proofs-over-time'
import { SourcingBar } from './sourcing-bar'
import { SourcingTable } from './sourcing-table'
import type {
  GuildLeaderboardEntry,
  ModelStat,
  SourcingEntry,
  Timelines,
} from '@/lib/unsorry/types'

export function LeaderboardTabs({
  entries,
  models,
  timelines,
  sourcing,
}: {
  entries: GuildLeaderboardEntry[]
  models: ModelStat[]
  timelines: Timelines | null
  sourcing: SourcingEntry[]
}) {
  return (
    <Tabs defaultValue="leaderboard" className="space-y-4">
      <TabsList>
        <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        <TabsTrigger value="timeline">Proofs over time</TabsTrigger>
        <TabsTrigger value="sourcing">Sourcing</TabsTrigger>
      </TabsList>

      <TabsContent value="leaderboard" className="space-y-8">
        {entries.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Top contributors</h2>
            <LeaderboardBar entries={entries} />
          </section>
        )}
        <GlobalLeaderboard entries={entries} />
        {models.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Model distribution</h2>
            <p className="text-xs text-foreground/60">
              Verified proofs by provider/model. <code>python / sympy</code> is the deterministic
              (zero-LLM) solver.
            </p>
            <ModelDistribution models={models} />
          </section>
        )}
      </TabsContent>

      <TabsContent value="timeline" className="space-y-3">
        <h2 className="text-lg font-semibold">Proofs over time</h2>
        {timelines ? (
          <ProofsOverTime timelines={timelines} />
        ) : (
          <p className="text-sm text-foreground/70">No timeline data.</p>
        )}
      </TabsContent>

      <TabsContent value="sourcing" className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Goals sourced</h2>
          <p className="text-xs text-foreground/60">
            Who proposed the goals the swarm proves (from git provenance).
          </p>
          <SourcingBar entries={sourcing} />
        </div>
        <SourcingTable entries={sourcing} />
      </TabsContent>
    </Tabs>
  )
}
