/** Status of a goal in unsorry's worklist. */
export type TargetStatus = 'open' | 'blocked' | 'proved' | 'archived'

export interface UnsorryBadges {
  proofs: number
  difficulty: number
  success_rate_percent: number
}

/** One row of docs/metrics/leaderboard-ui.json → contributors[]. */
export interface UnsorryLeaderboardRecord {
  rank: number
  github: string
  solver?: string
  display_name?: string
  profile_url?: string
  avatar_url?: string
  score: number
  verified_proofs?: number
  credited_proofs: number
  difficulty_points: number
  dispatch_points?: number
  runs?: number
  successes?: number
  run_success_rate?: number
  badges?: UnsorryBadges
}

export interface LeaderboardUi {
  schema_version?: number
  generated_at?: string
  contributors: UnsorryLeaderboardRecord[]
}

/** One entry of docs/metrics/community-stats.json → goal_effort[]. */
export interface GoalEffort {
  goal: string
  status: TargetStatus
  difficulty: number
  attempts?: number
  successes?: number
  runs?: number
}

export interface CommunityStats {
  schema_version?: number
  goal_effort: GoalEffort[]
  [key: string]: unknown
}

/** goal → credited solver, parsed from library/index/*.aisp. */
export interface GoalSolver {
  goal: string
  solver: string
  name?: string
}

/** Guild-normalised leaderboard row (camelCase) consumed by the UI. */
export interface GuildLeaderboardEntry {
  github: string
  displayName: string
  avatarUrl: string
  profileUrl: string
  rank: number
  score: number
  difficultyPoints: number
  creditedProofs: number
  verifiedProofs: number
  successRate: number
  badges: UnsorryBadges
}

export interface TargetProgress {
  headlineId: string
  total: number
  proved: number
  blocked: number
  open: number
  archived: number
  percentProved: number
  headlineStatus: TargetStatus
  isClosed: boolean
}

export interface TargetLeaderboardEntry {
  github: string
  difficultyPoints: number
  creditedProofs: number
  score: number
  rank: number
}

/** docs/queue.json — in-flight proving work. */
export interface QueueSolver {
  solver: string
  github: string
  display_name?: string
  profile_url?: string
  submissions: number
  waiting: number
  in_flight: number
  distinct_goals: number
}

export interface QueueSummary {
  queued_submissions: number
  waiting: number
  in_flight: number
  distinct_goals: number
  solvers: number
}

export interface QueueData {
  schema_version?: number
  summary: QueueSummary
  solvers: QueueSolver[]
}
