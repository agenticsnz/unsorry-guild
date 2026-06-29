import { extract } from 'tar-stream'
import { createGunzip } from 'node:zlib'
import { Readable } from 'node:stream'
import { archivePackageOf, parseGoal, parseProof } from './snapshot-parse'
import type { UnsorrySnapshot } from './snapshot-parse'

/**
 * The single cached git snapshot (ADR-024) used for goal→solver attribution. One
 * authenticated tarball fetch of the unsorry repo (~3 MB gzip) per TTL window,
 * streamed through gunzip + tar and parsed in-memory — one request instead of the
 * hundreds of per-file `library/index` fetches that made goal pages slow (#10).
 *
 * tar-stream is used (not nanotar) because GitHub's archive relies on GNU/PAX
 * long-name headers for the 64-hex `library/index` filenames, which simpler
 * parsers corrupt.
 */
const TARBALL_URL = 'https://api.github.com/repos/agenticsnz/unsorry/tarball/main'
const TTL_MS = 90_000

let memo: { at: number; snap: UnsorrySnapshot } | null = null

/** tarball entries are prefixed with `<owner>-<repo>-<sha>/`; strip that segment. */
function relativePath(name: string): string {
  const i = name.indexOf('/')
  return i === -1 ? name : name.slice(i + 1)
}

async function fetchSnapshot(token: string): Promise<UnsorrySnapshot | null> {
  const res = await fetch(TARBALL_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'unsorry-guild',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    console.warn(
      `[snapshot] tarball fetch failed: ${res.status} ${res.statusText} — check GITHUB_TOKEN (read-only Contents:Read on agenticsnz/unsorry). Falling back to the GitHub-API scan.`,
    )
    return null
  }

  const gzip = Buffer.from(await res.arrayBuffer())
  const snap: UnsorrySnapshot = {
    proofs: [],
    archivedProofs: [],
    goals: [],
    archivePackageByGoal: {},
  }
  const ext = extract()
  // Archived proofs live at packages/unsorry-archive-<n>/library/index/*.aisp.
  const ARCHIVED_PROOF_RE = /^packages\/unsorry-archive-[^/]+\/library\/index\/[^/]+\.aisp$/

  ext.on('entry', (header, stream, next) => {
    const rel = relativePath(header.name)
    // One pass over the tarball: active proof records (attribution), archived proof
    // records (so the hardest, mostly-archived proofs reach the Showcase), and goal
    // records (per-goal difficulty for the Showcase ranking).
    const isAisp = header.name.endsWith('.aisp')
    const isProof = isAisp && rel.startsWith('library/index/')
    const isArchivedProof = isAisp && ARCHIVED_PROOF_RE.test(rel)
    const isGoal = isAisp && rel.startsWith('goals/')
    if (!isProof && !isArchivedProof && !isGoal) {
      stream.on('end', next)
      stream.resume()
      return
    }
    const chunks: Buffer[] = []
    stream.on('data', (c: Buffer) => chunks.push(c))
    stream.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8')
      if (isGoal) {
        const goal = parseGoal(text)
        if (goal) snap.goals.push(goal)
      } else {
        const proof = parseProof(text)
        if (proof) {
          ;(isArchivedProof ? snap.archivedProofs : snap.proofs).push(proof)
          if (isArchivedProof) {
            const pkg = archivePackageOf(rel)
            // First archive wins; an active goals/<id>.lean (if any) still takes
            // precedence at resolve time.
            if (pkg && !(proof.goal in snap.archivePackageByGoal)) {
              snap.archivePackageByGoal[proof.goal] = pkg
            }
          }
        }
      }
      next()
    })
  })

  await new Promise<void>((resolve, reject) => {
    ext.on('finish', resolve)
    ext.on('error', reject)
    Readable.from(gzip).pipe(createGunzip()).on('error', reject).pipe(ext)
  })

  return snap
}

/**
 * Load the snapshot, memoised for `TTL_MS` within a warm server instance. Returns
 * null when `GITHUB_TOKEN` is unset or the fetch/parse fails or yields nothing —
 * callers then fall back to the GitHub-API scan (graceful degradation, no mocks).
 */
export async function loadSnapshot(): Promise<UnsorrySnapshot | null> {
  const token = process.env.GITHUB_TOKEN
  if (!token) return null
  if (memo && Date.now() - memo.at < TTL_MS) return memo.snap

  try {
    const snap = await fetchSnapshot(token)
    if (snap && snap.proofs.length > 0) {
      memo = { at: Date.now(), snap }
      return snap
    }
    return memo?.snap ?? null
  } catch (err) {
    console.warn('[snapshot] load failed, falling back to the GitHub-API scan:', err)
    return memo?.snap ?? null
  }
}
