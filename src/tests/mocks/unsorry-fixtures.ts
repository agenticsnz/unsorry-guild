import type { GoalEffort, QueueData, UnsorryLeaderboardRecord } from '@/lib/unsorry/types'

/** Trimmed real rows from docs/metrics/leaderboard-ui.json (contributors[]). */
export const LEADERBOARD_FIXTURE: UnsorryLeaderboardRecord[] = [
  {
    rank: 1,
    github: 'ohdearquant',
    solver: 'ohdearquant',
    display_name: '@ohdearquant',
    profile_url: 'https://github.com/ohdearquant',
    avatar_url: 'https://github.com/ohdearquant.png?size=96',
    score: 199700,
    verified_proofs: 896,
    credited_proofs: 896,
    difficulty_points: 1773,
    dispatch_points: 0,
    runs: 126,
    successes: 126,
    run_success_rate: 1,
    badges: { proofs: 896, difficulty: 1773, success_rate_percent: 100 },
  },
  {
    rank: 2,
    github: 'cgbarlow',
    solver: 'cgbarlow',
    display_name: '@cgbarlow',
    profile_url: 'https://github.com/cgbarlow',
    avatar_url: 'https://github.com/cgbarlow.png?size=96',
    score: 50000,
    verified_proofs: 200,
    credited_proofs: 200,
    difficulty_points: 450,
    dispatch_points: 0,
    runs: 60,
    successes: 55,
    run_success_rate: 0.91,
    badges: { proofs: 200, difficulty: 450, success_rate_percent: 91 },
  },
  {
    rank: 3,
    github: 'Rauxon',
    solver: 'Rauxon',
    display_name: '@Rauxon',
    profile_url: 'https://github.com/Rauxon',
    avatar_url: 'https://github.com/Rauxon.png?size=96',
    score: 30000,
    verified_proofs: 120,
    credited_proofs: 120,
    difficulty_points: 270,
    dispatch_points: 0,
    runs: 40,
    successes: 38,
    run_success_rate: 0.95,
    badges: { proofs: 120, difficulty: 270, success_rate_percent: 95 },
  },
]

export const SQ_TARGET = 'sq-add-sq-eq-three-mul-sq'

/** Real subtree statuses for the demo target, captured from community-stats goal_effort. */
export const SQ_GOAL_EFFORT: GoalEffort[] = [
  { goal: 'sq-add-sq-eq-three-mul-sq', status: 'blocked', difficulty: 4 },
  { goal: 'sq-add-sq-eq-three-mul-sq-s1', status: 'proved', difficulty: 1 },
  { goal: 'sq-add-sq-eq-three-mul-sq-s2', status: 'proved', difficulty: 1 },
  { goal: 'sq-add-sq-eq-three-mul-sq-s3', status: 'proved', difficulty: 1 },
  { goal: 'sq-add-sq-eq-three-mul-sq-s4', status: 'blocked', difficulty: 1 },
  { goal: 'sq-add-sq-eq-three-mul-sq-s4-s1', status: 'proved', difficulty: 1 },
  { goal: 'sq-add-sq-eq-three-mul-sq-s4-s2', status: 'proved', difficulty: 1 },
  { goal: 'sq-add-sq-eq-three-mul-sq-s4-s3', status: 'blocked', difficulty: 1 },
  { goal: 'sq-add-sq-eq-three-mul-sq-s4-s3-s1', status: 'proved', difficulty: 1 },
  { goal: 'sq-add-sq-eq-three-mul-sq-s4-s3-s2', status: 'open', difficulty: 1 },
  { goal: 'sq-add-sq-eq-three-mul-sq-s4-s3-s3', status: 'proved', difficulty: 1 },
  { goal: 'sq-add-sq-eq-three-mul-sq-s4-s4', status: 'proved', difficulty: 1 },
  // a goal OUTSIDE the target — must be excluded by subtree filtering
  { goal: 'euclid-perfect-numbers', status: 'archived', difficulty: 3 },
]

/** Real library/index/*.aisp records (verified proofs with explicit solver). */
export const LIBRARY_INDEX_S1 = `𝔸5.1.lemma.x@2026-06-13
γ≔unsorry.lemma
⟦Ω:Lemma⟧{sha≜0e04d60940ee; goal≜sq-add-sq-eq-three-mul-sq-s1; name≜int_sq_mod_three_eq_zero_or_one}
⟦Π:Provenance⟧{solver≜cgbarlow; agent≜p3-b1; provider≜claude; model≜opus; effort≜high; attempts≜1; solve_s≜420}
`

export const LIBRARY_INDEX_S4S3S3 = `⟦Ω:Lemma⟧{sha≜099627ba2c13; goal≜sq-add-sq-eq-three-mul-sq-s4-s3-s3; name≜minimal_natAbs_sum_contradicts_strict_smaller}
⟦Π:Provenance⟧{solver≜Rauxon; agent≜rauxon-1; provider≜claude; model≜opus; effort≜xhigh; attempts≜2; solve_s≜445}
`

/** A record with no solver (must be skipped by the map builder). */
export const LIBRARY_INDEX_NO_SOLVER = `⟦Ω:Lemma⟧{sha≜deadbeef; goal≜some-other-goal; name≜foo}
`

/** Trimmed real docs/queue.json. */
export const QUEUE_FIXTURE: QueueData = {
  schema_version: 1,
  summary: { queued_submissions: 1398, waiting: 1385, in_flight: 13, distinct_goals: 1398, solvers: 2 },
  solvers: [
    {
      solver: 'ohdearquant',
      github: 'ohdearquant',
      display_name: '@ohdearquant',
      profile_url: 'https://github.com/ohdearquant',
      submissions: 1294,
      waiting: 1288,
      in_flight: 6,
      distinct_goals: 1294,
    },
    {
      solver: 'cgbarlow',
      github: 'cgbarlow',
      display_name: '@cgbarlow',
      profile_url: 'https://github.com/cgbarlow',
      submissions: 104,
      waiting: 97,
      in_flight: 7,
      distinct_goals: 104,
    },
  ],
}
