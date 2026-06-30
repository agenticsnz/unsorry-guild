import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TargetProgressView } from '@/components/prizes/target-progress'
import { getPrizes } from '@/lib/prizes/prizes'
import { getGoalEffort, getRecentProofs, getLeaderboardExtras } from '@/lib/unsorry/standings'
import { computeTargetProgress } from '@/lib/unsorry/subtree'
import { proofVelocity } from '@/lib/unsorry/velocity'
import { Plus, Trophy, ExternalLink, Sparkles } from 'lucide-react'

export const metadata = { title: 'Admin · unsorry-guild' }
export const dynamic = 'force-dynamic'

export default async function AdminOverviewPage() {
  const [prizes, goalEffort, recent, extras] = await Promise.all([
    getPrizes('math'),
    getGoalEffort(),
    getRecentProofs(8),
    getLeaderboardExtras(),
  ])

  const goals = prizes.map((prize) => ({
    prize,
    progress: computeTargetProgress(prize.headlineGoalId, goalEffort),
  }))
  const velocity = proofVelocity(extras.timelines?.merge ?? [], new Date())

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Admin</h1>
          <p className="text-sm text-foreground/70">
            Curate the Goals the swarm proves and track the proofs landing against them.
          </p>
        </div>
        <Button asChild>
          <Link href="/gm/prizes">
            <Plus className="mr-2 h-4 w-4" />
            New goal
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Goals status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-brand" />
              Goals status
            </CardTitle>
            <CardDescription>Live progress of each curated Goal over its subtree.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {goals.length === 0 ? (
              <p className="text-sm text-foreground/70">
                No goals yet.{' '}
                <Link href="/gm/prizes" className="text-brand hover:underline">
                  Create one
                </Link>
                .
              </p>
            ) : (
              goals.map(({ prize, progress }) => (
                <div key={prize.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {prize.badgeEmoji} {prize.title}
                      </div>
                      <code className="text-xs text-foreground/50">{prize.headlineGoalId}</code>
                    </div>
                    <Badge variant={prize.status === 'active' ? 'default' : 'secondary'}>
                      {prize.status}
                    </Badge>
                  </div>
                  <TargetProgressView progress={progress} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent proof activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand" />
              Recent proof activity
            </CardTitle>
            <CardDescription>
              {velocity.last7d > 0 ? (
                <>
                  <span className="font-medium text-foreground">{velocity.last24h}</span> proofs in
                  the last 24 h ·{' '}
                  <span className="font-medium text-foreground">{velocity.last7d}</span> in 7 d
                </>
              ) : (
                'Verified proofs landing on main.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="py-6 text-center text-sm text-foreground/60">
                No recently dated proofs to show.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((p) => (
                  <li key={p.goal} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <div className="min-w-0">
                      <Link
                        href={`/math/proofs/${p.goal}`}
                        className="block truncate font-medium hover:underline"
                      >
                        {p.name ?? p.goal}
                      </Link>
                      <div className="text-xs text-foreground/60">
                        {p.solver ? (
                          <Link href={`/math/contributors/${p.solver}`} className="hover:underline">
                            @{p.solver}
                          </Link>
                        ) : (
                          'inferred'
                        )}
                        {p.provider && (
                          <span>
                            {' · '}
                            {p.provider}
                            {p.model ? ` / ${p.model}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-foreground/50">{p.provedOn}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>Common admin tasks</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href="/gm/prizes">
              <Plus className="mr-2 h-4 w-4" />
              New goal / open–close season
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/math/goals">
              <ExternalLink className="mr-2 h-4 w-4" />
              View public Goals
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
