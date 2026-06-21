import Image from 'next/image'
import Link from 'next/link'
import { fetchLeaderboardUi } from '@/lib/unsorry/fetchers'
import { Button } from '@/components/ui/button'
import { SummaryStats } from '@/components/leaderboard/summary-stats'
import { SurfaceCards } from '@/components/layout/surface-cards'
import type { LeaderboardSummary } from '@/lib/unsorry/types'

export const metadata = { title: 'unsorry swarm' }
export const revalidate = 600

export default async function LandingPage() {
  let summary: LeaderboardSummary | undefined
  try {
    summary = (await fetchLeaderboardUi()).summary
  } catch {
    summary = undefined
  }

  return (
    <div className="space-y-12">
      <section className="flex flex-col items-center gap-5 py-8 text-center">
        <Image
          src="/logo.png"
          alt="Agentics"
          width={72}
          height={72}
          priority
          className="h-16 w-16 object-contain sm:h-18 sm:w-18"
        />
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          unsorry <span className="font-normal text-brand">swarm</span>
        </h1>
        <p className="max-w-2xl text-base text-foreground/70 sm:text-lg">
          The engagement layer for the unsorry theorem-proving swarm — live leaderboards,
          flagship goals, and badges, all computed straight from git.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/math/leaderboard">View the leaderboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/math/goals">Browse goals</Link>
          </Button>
        </div>
      </section>

      {summary && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">The swarm so far</h2>
          <SummaryStats summary={summary} />
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Explore</h2>
        <SurfaceCards />
      </section>
    </div>
  )
}
