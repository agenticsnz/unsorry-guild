import Link from 'next/link'
import { getPrizes, getLatestSeasons, isSupabaseConfigured } from '@/lib/prizes/prizes'
import {
  getGoalEffort,
  getRegisteredTargets,
  getGoalSolverMap,
} from '@/lib/unsorry/standings'
import { computeTargetProgress } from '@/lib/unsorry/subtree'
import { computeTargetLeaderboard } from '@/lib/unsorry/target-leaderboard'
import { buildGoalCandidates } from '@/lib/prizes/goal-candidates'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TargetProgressView } from '@/components/prizes/target-progress'
import {
  GoalCandidatesDatalist,
} from '@/components/gm/goals/goal-candidates-datalist'
import { GoalForm } from '@/components/gm/goals/goal-form'
import { GoalRowActions } from '@/components/gm/goals/goal-row-actions'
import { GoalAuthoringGuide } from '@/components/gm/goals/goal-authoring-guide'

export const metadata = { title: 'Goals · Admin · unsorry-guild' }
export const dynamic = 'force-dynamic'

// Bound the datalist DOM — the picker still accepts any free id beyond the cap.
const CANDIDATE_CAP = 500

export default async function GmGoalsPage() {
  const [prizes, goalEffort, suites, solverMap] = await Promise.all([
    getPrizes('math'),
    getGoalEffort(),
    getRegisteredTargets(),
    getGoalSolverMap(),
  ])

  const seasons = await getLatestSeasons(prizes.map((p) => p.id))
  const writable = isSupabaseConfigured()
  const candidates = buildGoalCandidates(goalEffort, suites).slice(0, CANDIDATE_CAP)
  const goals = prizes.map((prize) => ({
    prize,
    progress: computeTargetProgress(prize.headlineGoalId, goalEffort),
    podium: computeTargetLeaderboard(prize.headlineGoalId, goalEffort, solverMap).slice(0, 3),
    season: seasons.get(prize.id) ?? null,
  }))

  return (
    <div className="max-w-3xl space-y-8">
      <GoalCandidatesDatalist candidates={candidates} />

      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Goals</h1>
        <p className="text-sm text-foreground/70">
          Curate the flagship targets the swarm proves: pick a goal, track its progress, and award
          the podium when it lands. Goals wrap unsorry&rsquo;s read-only proof goals — they are
          authored upstream, never here.
        </p>
      </div>

      {!writable && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          <strong>Read-only:</strong> Supabase isn&rsquo;t configured for this deployment, so creating,
          editing, and season/award actions won&rsquo;t persist. The Goals shown are the in-repo
          fallback. Set <code>NEXT_PUBLIC_SUPABASE_URL</code> / <code>…_ANON_KEY</code> /{' '}
          <code>SUPABASE_SERVICE_ROLE_KEY</code> to enable the admin overlay.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>New goal</CardTitle>
        </CardHeader>
        <CardContent>
          <GoalForm />
        </CardContent>
      </Card>

      <GoalAuthoringGuide />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Goals</h2>
        {goals.length === 0 ? (
          <p className="text-sm text-foreground/70">No goals yet — create one above.</p>
        ) : (
          goals.map(({ prize, progress, podium, season }) => (
            <Card key={prize.id}>
              <CardContent className="space-y-4 pt-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium">
                      {prize.badgeEmoji} {prize.title}
                    </div>
                    <Link
                      href={`/math/goals/${prize.headlineGoalId}`}
                      className="text-xs text-foreground/60 hover:underline"
                    >
                      <code>{prize.headlineGoalId}</code>
                    </Link>
                  </div>
                  <Badge variant={prize.status === 'active' ? 'default' : 'secondary'}>
                    {prize.status}
                  </Badge>
                </div>

                <TargetProgressView progress={progress} />

                <div className="text-xs text-foreground/70">
                  {podium.length === 0 ? (
                    <span className="text-foreground/50">No credited contributors yet.</span>
                  ) : (
                    <span>
                      Leading:{' '}
                      {podium.map((e, i) => (
                        <span key={e.github}>
                          {i > 0 && ' · '}
                          {['🥇', '🥈', '🥉'][i]}{' '}
                          <Link href={`/math/contributors/${e.github}`} className="hover:underline">
                            @{e.github}
                          </Link>{' '}
                          ({e.score})
                        </span>
                      ))}
                    </span>
                  )}
                </div>

                <GoalRowActions prize={prize} season={season} />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
