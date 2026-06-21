import { REVALIDATE_SECONDS, rawRepoUrl, treesApiUrl } from './constants'
import { parseLibraryIndexRecord } from './aisp'
import { UnsorryFetchError } from './fetchers'
import type { GoalSolver } from './types'

interface TreeEntry {
  path: string
  type: string
}

/**
 * Headers for GitHub API requests. Authenticates with GITHUB_TOKEN when present
 * (5000 req/h vs the 60 req/h unauthenticated limit that 403s on shared CI/build
 * IPs). A User-Agent is required by the GitHub API.
 */
function githubApiHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN
  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'unsorry-guild',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

/** List every library/index/*.aisp path via the GitHub Git Trees API. */
export async function listLibraryIndexPaths(): Promise<string[]> {
  const res = await fetch(treesApiUrl(), {
    next: { revalidate: REVALIDATE_SECONDS },
    headers: githubApiHeaders(),
  })
  if (!res.ok) {
    throw new UnsorryFetchError(`Unable to list unsorry tree (${res.status})`)
  }
  const data = (await res.json()) as { tree?: TreeEntry[] }
  return (data.tree ?? [])
    .filter((t) => t.type === 'blob' && t.path.startsWith('library/index/') && t.path.endsWith('.aisp'))
    .map((t) => t.path)
}

/**
 * Build the goal → credited-solver map by scanning unsorry's verified proof index
 * (library/index/*.aisp). This is the authoritative source matching the board's
 * credited solver. Fetched concurrently in batches and cached for the revalidate
 * window. (Post-slice, a single docs/metrics/goals-with-solvers.json artifact in
 * unsorry replaces this scan — see ADR-019 / Phase 3.)
 */
export async function buildGoalSolverMap(): Promise<Map<string, GoalSolver>> {
  const paths = await listLibraryIndexPaths()
  const map = new Map<string, GoalSolver>()
  const BATCH = 24

  for (let i = 0; i < paths.length; i += BATCH) {
    const batch = paths.slice(i, i + BATCH)
    const texts = await Promise.all(
      batch.map(async (path) => {
        try {
          const res = await fetch(rawRepoUrl(path), {
            next: { revalidate: REVALIDATE_SECONDS },
            headers: githubApiHeaders(),
          })
          return res.ok ? await res.text() : ''
        } catch {
          return ''
        }
      }),
    )
    for (const text of texts) {
      const rec = parseLibraryIndexRecord(text)
      if (rec.goal && rec.solver) {
        map.set(rec.goal, { goal: rec.goal, solver: rec.solver, name: rec.name })
      }
    }
  }

  return map
}
