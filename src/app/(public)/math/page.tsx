import { SurfaceCards } from '@/components/layout/surface-cards'

export const metadata = { title: 'Math · unsorry-guild' }

export default function MathHome() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Math</h1>
        <p className="text-foreground/70 max-w-2xl">
          The unsorry swarm proves theorems. Climb the leaderboard by contributing
          verified proofs to the Math corpus.
        </p>
      </div>
      <SurfaceCards />
    </div>
  )
}
