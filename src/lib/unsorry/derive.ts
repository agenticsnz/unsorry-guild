import { assignRanks } from './ranking'
import { targetScore } from './target-leaderboard'
import type { UnsorrySnapshot } from './snapshot-parse'
import type {
  GoalEffort,
  GoalSolver,
  GuildLeaderboardEntry,
  LeaderboardSummary,
  ModelStat,
  TimelinePoint,
  Timelines,
} from './types'

/**
 * Derive every UI structure from the raw git snapshot (ADR-024). All pure and
 * unit-tested; the same score policy as the baked board (difficulty*100 +
 * proofs*25) so the recomputed numbers stay comparable.
 */

/** Goal status + difficulty, replacing the baked community-stats goal_effort. */
export function deriveGoalEffort(s: UnsorrySnapshot): GoalEffort[] {
  return s.goals.map((g) => ({ goal: g.goal, status: g.status, difficulty: g.difficulty }))
}

/** goal → credited solver, replacing the per-file library/index scan. */
export function deriveGoalSolverMap(s: UnsorrySnapshot): Map<string, GoalSolver> {
  const map = new Map<string, GoalSolver>()
  for (const p of s.proofs) {
    map.set(p.goal, { goal: p.goal, solver: p.solver, name: p.name })
  }
  return map
}

function runStatsBy<T>(runs: UnsorrySnapshot['runs'], key: (r: UnsorrySnapshot['runs'][number]) => T | undefined) {
  const stats = new Map<T, { runs: number; successes: number }>()
  for (const r of runs) {
    const k = key(r)
    if (k === undefined) continue
    const cur = stats.get(k) ?? { runs: 0, successes: 0 }
    cur.runs += 1
    if (r.success) cur.successes += 1
    stats.set(k, cur)
  }
  return stats
}

/** Global leaderboard: every verified proof credits its solver (difficulty-weighted). */
export function deriveGlobalLeaderboard(s: UnsorrySnapshot): GuildLeaderboardEntry[] {
  const difficulty = new Map(s.goals.map((g) => [g.goal, g.difficulty]))
  const byContributor = new Map<string, { difficultyPoints: number; creditedProofs: number }>()
  for (const p of s.proofs) {
    const cur = byContributor.get(p.solver) ?? { difficultyPoints: 0, creditedProofs: 0 }
    cur.difficultyPoints += difficulty.get(p.goal) ?? 0
    cur.creditedProofs += 1
    byContributor.set(p.solver, cur)
  }

  const runStats = runStatsBy(s.runs, (r) => r.solver)
  const rows = [...byContributor.entries()]
    .map(([github, v]) => {
      const rs = runStats.get(github)
      const successRate = rs && rs.runs > 0 ? rs.successes / rs.runs : 0
      return {
        github,
        displayName: `@${github}`,
        avatarUrl: `https://github.com/${github}.png?size=96`,
        profileUrl: `https://github.com/${github}`,
        score: targetScore(v.difficultyPoints, v.creditedProofs),
        difficultyPoints: v.difficultyPoints,
        creditedProofs: v.creditedProofs,
        verifiedProofs: v.creditedProofs,
        successRate,
        badges: {
          proofs: v.creditedProofs,
          difficulty: v.difficultyPoints,
          success_rate_percent: Math.round(successRate * 100),
        },
      }
    })
    .sort((a, b) => b.score - a.score || a.github.localeCompare(b.github))

  return assignRanks(rows, (e) => e.score)
}

/** Provider/model breakdown: verified proofs from library/index, run rates from proof-runs. */
export function deriveModels(s: UnsorrySnapshot): ModelStat[] {
  const verified = new Map<string, number>()
  for (const p of s.proofs) verified.set(p.providerModel, (verified.get(p.providerModel) ?? 0) + 1)

  const runStats = runStatsBy(s.runs, (r) => r.providerModel)

  return [...verified.entries()]
    .map(([provider_model, verified_proofs]) => {
      const rs = runStats.get(provider_model)
      return {
        provider_model,
        verified_proofs,
        runs: rs?.runs ?? 0,
        run_success_rate: rs && rs.runs > 0 ? rs.successes / rs.runs : null,
      }
    })
    .sort((a, b) => b.verified_proofs - a.verified_proofs)
}

function cumulativeByDay(dates: string[]): TimelinePoint[] {
  const byDay = new Map<string, number>()
  for (const d of dates) {
    const day = d.slice(0, 10)
    byDay.set(day, (byDay.get(day) ?? 0) + 1)
  }
  let cumulative = 0
  return [...byDay.keys()]
    .sort()
    .map((t) => {
      const proofs = byDay.get(t) ?? 0
      cumulative += proofs
      return { t, proofs, cumulative_proofs: cumulative }
    })
}

/** Cumulative proofs over time — merge = index date, solve = successful run date. */
export function deriveTimelines(s: UnsorrySnapshot): Timelines {
  const merge = cumulativeByDay(s.proofs.map((p) => p.date).filter((d): d is string => Boolean(d)))
  const solve = cumulativeByDay(
    s.runs.filter((r) => r.success && r.ended).map((r) => r.ended as string),
  )
  return { default: 'merge', merge, solve }
}

/** Headline summary cards, recomputed so they stay coherent with the fresh board. */
export function deriveSummary(s: UnsorrySnapshot): LeaderboardSummary {
  const contributors = new Set(s.proofs.map((p) => p.solver))
  const terminalRuns = s.runs.filter((r) => r.outcome === 'proved' || r.outcome === 'failed').length
  return {
    verified_proofs: s.proofs.length,
    attributed_proofs: s.proofs.length,
    inferred_git_proofs: 0,
    terminal_runs: terminalRuns,
    credited_contributors: contributors.size,
  }
}
