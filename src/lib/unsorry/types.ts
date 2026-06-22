/** Status of a goal in unsorry's worklist. */
export type TargetStatus = 'open' | 'blocked' | 'proved' | 'archived' | 'translated'

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

/** docs/metrics/leaderboard-ui.json → models[] (provider/model breakdown). */
export interface ModelStat {
  provider_model: string
  verified_proofs: number
  runs: number
  run_success_rate: number | null
}

/** The Pokémon identity assigned to a model (docs/metrics/model-registry.json). */
export interface ModelPokemon {
  name: string
  dex_id: number
  sprite_url: string
  description: string
}

/** Researched facts about a model, gathered by the swarm (ADR-083). */
export interface ModelResearch {
  classification: 'open' | 'closed' | 'n/a'
  publisher: string
  country: string
  parameter_size: string
  license: string
  /** Hugging Face model page if open-source, official site if closed. */
  canonical_url: string
}

export interface ModelProvenance {
  assigned_by: string
  /** The model that named this one, in provider_model form ("claude / opus") —
   *  so the UI can link to that model's own Pokémon page. */
  assigned_with: string
  /** GitHub handle of the swarm contributor who ran the naming task. */
  contributor: string
  sources: string[]
  assigned_at: string
}

/** One model → Pokémon registry entry (docs/metrics/model-registry.json → models[]). */
export interface ModelRegistryEntry {
  /** Exact join key to ModelStat.provider_model. */
  provider_model: string
  /** URL-safe key for the /math/models/[slug] route. */
  slug: string
  pokemon: ModelPokemon
  research: ModelResearch
  /** The rationale: why this Pokémon represents this model. */
  profile: string
  provenance: ModelProvenance
}

/** docs/metrics/model-registry.json — the swarm-maintained registry artifact. */
export interface ModelRegistry {
  schema_version?: number
  generated_at?: string
  models: ModelRegistryEntry[]
}

/** A model-distribution row joined with its Pokémon identity (if assigned). */
export interface ModelWithRegistry extends ModelStat {
  registry?: ModelRegistryEntry
}

/** A point in timelines.merge / timelines.solve. */
export interface TimelinePoint {
  t: string
  proofs: number
  cumulative_proofs: number
}

export interface Timelines {
  default?: string
  merge: TimelinePoint[]
  solve: TimelinePoint[]
}

export interface HistoricalContributor {
  rank: number
  github: string
  display_name?: string
  avatar_url?: string
  profile_url?: string
  difficulty_points: number
  index_files_added?: number
  solver_provenance_proofs?: number
  missing_solver_provenance?: number
  solver_credit?: boolean
  attribution_source?: string
}

export interface LeaderboardSummary {
  verified_proofs?: number
  attributed_proofs?: number
  inferred_git_proofs?: number
  terminal_runs?: number
  credited_contributors?: number
  [key: string]: number | undefined
}

export interface LeaderboardUi {
  schema_version?: number
  generated_at?: string
  score_policy?: string
  contributors: UnsorryLeaderboardRecord[]
  historical_contributors?: HistoricalContributor[]
  models?: ModelStat[]
  timelines?: Timelines
  summary?: LeaderboardSummary
}

/** docs/metrics/sourcing-leaderboard.json → sourcers[]. */
export interface SourcingEntry {
  sourcer: string
  github: string
  display_name?: string
  avatar_url?: string
  profile_url?: string
  sourced_goals: number
  proved: number
  open: number
  difficulty_points: number
  earliest_sourced?: string
  latest_sourced?: string
}

export interface SourcingLeaderboard {
  schema_version?: number
  sourcers: SourcingEntry[]
  totals?: Record<string, number>
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
export interface QueueItem {
  goal: string
  branch?: string
  sha?: string
  model?: string
  date?: string
  state?: string
}

export interface QueueSolver {
  solver: string
  github: string
  display_name?: string
  profile_url?: string
  submissions: number
  waiting: number
  in_flight: number
  distinct_goals: number
  queued?: QueueItem[]
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
