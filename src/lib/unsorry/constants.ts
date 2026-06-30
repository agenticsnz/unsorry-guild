/**
 * Canonical locations for unsorry's git-published data. unsorry-guild reads these
 * read-only (git is the source of truth — see ADR-015). The **raw-git** URL is
 * preferred over the Pages URL: Pages can fall hours behind `main` when a flood of
 * proof-merge commits backs up its build queue, whereas raw.githubusercontent
 * tracks `main` within minutes (ADR-031). Pages stays as the fallback.
 */
export const UNSORRY_REPO = 'agenticsnz/unsorry'

export const UNSORRY_BASE_URL =
  process.env.NEXT_PUBLIC_UNSORRY_BASE_URL ?? 'https://unsorry.agentics.org.nz/docs'

export const UNSORRY_RAW_BASE_URL =
  'https://raw.githubusercontent.com/agenticsnz/unsorry/main/docs'

/** Guild-side cache for the git-published artifacts. Short, because the raw-git
 * source updates push-on-merge — the board should reflect new proofs within ~1 min. */
export const REVALIDATE_SECONDS = 60

/**
 * The model → Pokémon registry changes one entry at a time as the swarm names
 * models, so it's polled more eagerly than the other artifacts to surface new
 * Pokémon within ~a minute rather than up to 10.
 */
export const MODEL_REGISTRY_REVALIDATE_SECONDS = 60

export const metricsUrl = (file: string) => `${UNSORRY_BASE_URL}/metrics/${file}`
export const rawMetricsUrl = (file: string) => `${UNSORRY_RAW_BASE_URL}/metrics/${file}`
export const queueUrl = () => `${UNSORRY_BASE_URL}/queue.json`
export const rawQueueUrl = () => `${UNSORRY_RAW_BASE_URL}/queue.json`

/** The proof-territory map data (agenticsnz/unsorry `docs/territory.json`). */
export const territoryUrl = () => `${UNSORRY_BASE_URL}/territory.json`
export const rawTerritoryUrl = () => `${UNSORRY_RAW_BASE_URL}/territory.json`

/** Raw blob URL for any path in the unsorry repo (e.g. library/index/<sha>.aisp). */
export const rawRepoUrl = (path: string) =>
  `https://raw.githubusercontent.com/${UNSORRY_REPO}/main/${path}`

/** Human GitHub blob URL for any path in the unsorry repo (e.g. the goal record). */
export const repoBlobUrl = (path: string) =>
  `https://github.com/${UNSORRY_REPO}/blob/main/${path}`

/** GitHub Git Trees API (recursive) for listing repo paths. */
export const treesApiUrl = () =>
  `https://api.github.com/repos/${UNSORRY_REPO}/git/trees/main?recursive=1`
