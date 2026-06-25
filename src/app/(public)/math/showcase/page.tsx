import Link from 'next/link'
import { getGoalMetaMap, getShowcaseSolverMap } from '@/lib/unsorry/standings'
import { buildShowcase, DEFAULT_MIN_DIFFICULTY } from '@/lib/unsorry/showcase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = { title: 'Showcase · Math · unsorry-guild' }
export const dynamic = 'force-dynamic'

export default async function ShowcasePage() {
  const [solverMap, goalMeta] = await Promise.all([getShowcaseSolverMap(), getGoalMetaMap()])
  const items = buildShowcase(solverMap, goalMeta, { minDifficulty: DEFAULT_MIN_DIFFICULTY })

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Showcase</h1>
        <p className="text-sm text-foreground/70">
          The hardest proofs the swarm has discharged — difficulty {DEFAULT_MIN_DIFFICULTY} and
          above, across the whole proved corpus. Open a card for the proof&apos;s target and stats.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-foreground/70">No proofs to showcase right now.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link key={item.goal} href={`/math/proofs/${item.goal}`} className="group block">
              <Card className="h-full transition-colors group-hover:border-brand/50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2 text-base">
                    <span className="truncate font-mono group-hover:text-brand">{item.name}</span>
                    <span
                      className="shrink-0 rounded-full bg-brand/15 px-2 py-0.5 text-xs font-medium text-brand"
                      title="Difficulty"
                    >
                      δ {item.difficulty}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-foreground/70">
                  Proved by <span className="font-medium text-foreground">@{item.solver}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
