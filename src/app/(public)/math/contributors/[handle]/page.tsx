import { getContributor } from '@/lib/profiles/contributor'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Stat } from '@/components/ui/stat'
import { ScoreBreakdown } from '@/components/leaderboard/score-breakdown'
import { TargetBadges } from '@/components/profile/target-badges'

export const dynamic = 'force-dynamic'

export default async function ContributorPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params
  const profile = await getContributor(handle)
  const g = profile.global

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />
          <AvatarFallback>{profile.github.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{profile.displayName}</h1>
          <a
            href={profile.profileUrl}
            className="text-sm text-foreground/70 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            github.com/{profile.github}
          </a>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Standing</h2>
        {g ? (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
            <Stat label="Rank" value={`#${g.rank}`} />
            <Stat label="Score" value={g.score.toLocaleString()} />
            <Stat label="Proofs" value={g.creditedProofs.toLocaleString()} />
            <Stat label="Difficulty" value={g.difficultyPoints.toLocaleString()} />
            <Stat label="Dispatched PRs" value={g.dispatchProofs.toLocaleString()} />
          </div>
        ) : (
          <p className="text-sm text-foreground/70">Not yet ranked on the Math leaderboard.</p>
        )}
      </section>

      {g && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Score breakdown</h2>
          <ScoreBreakdown entry={g} />
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Prize badges</h2>
        <TargetBadges badges={profile.badges} />
      </section>
    </div>
  )
}
