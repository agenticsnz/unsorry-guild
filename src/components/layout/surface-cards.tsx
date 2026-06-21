import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/** The public surfaces, linked from the landing page and the /math home (DRY). */
export const SURFACES = [
  {
    href: '/math/leaderboard',
    title: 'Leaderboard',
    blurb: 'Top contributors ranked by difficulty-weighted verified proofs.',
  },
  {
    href: '/math/goals',
    title: 'Goals',
    blurb: 'Flagship targets with per-goal leaderboards, podiums, and badges.',
  },
  {
    href: '/math/showcase',
    title: 'Showcase',
    blurb: 'Highlighted proofs from the Math corpus.',
  },
  {
    href: '/math/proof-graph',
    title: 'Proof graph',
    blurb: 'Proofs and contributors, visualised.',
  },
  {
    href: '/math/queue',
    title: 'Queue',
    blurb: 'In-flight proving work waiting to merge.',
  },
] as const

export function SurfaceCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {SURFACES.map((s) => (
        <Link key={s.href} href={s.href}>
          <Card className="hover:border-primary transition-colors h-full">
            <CardHeader>
              <CardTitle>{s.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-foreground/70">{s.blurb}</CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
