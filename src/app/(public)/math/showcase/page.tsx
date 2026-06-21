import Link from 'next/link'
import { getGoalEffort, getGoalSolverMap } from '@/lib/unsorry/standings'
import { buildShowcase } from '@/lib/unsorry/showcase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = { title: 'Showcase · Math · unsorry-guild' }
export const revalidate = 60

export default async function ShowcasePage() {
  const [goalEffort, solverMap] = await Promise.all([getGoalEffort(), getGoalSolverMap()])
  const items = buildShowcase(goalEffort, solverMap)

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Showcase</h1>
        <p className="text-sm text-foreground/70">
          The hardest proofs the swarm has discharged from the Math corpus, by difficulty.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-foreground/70">No proofs to showcase right now.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.goal} className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2 text-base">
                  <span className="truncate font-mono">{item.name}</span>
                  <span
                    className="shrink-0 rounded-full bg-brand/15 px-2 py-0.5 text-xs font-medium text-brand"
                    title="Difficulty"
                  >
                    δ {item.difficulty}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-foreground/70">
                Proved by{' '}
                <Link
                  href={`/math/contributors/${item.solver}`}
                  className="font-medium text-foreground hover:underline"
                >
                  @{item.solver}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
