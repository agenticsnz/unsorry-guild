import { extract } from 'tar-stream'
import { createGunzip } from 'node:zlib'
import { Readable } from 'node:stream'
import { parseProof, parseGoal, parseRun } from './snapshot-parse'
import type { UnsorrySnapshot } from './snapshot-parse'

/**
 * The single cached git snapshot (ADR-024 / Decision #2). One authenticated
 * tarball fetch of the unsorry repo (~3 MB gzip) per TTL window, streamed through
 * gunzip + tar and parsed in-memory into the raw AISP records. This is the source
 * of truth for fresh, on-read standings: it replaces both the per-file
 * `library/index` scan (fixing the slow goal pages, #10) and the lagging baked
 * `leaderboard-ui.json` (#17).
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
      `[snapshot] tarball fetch failed: ${res.status} ${res.statusText} — check GITHUB_TOKEN (read-only Contents:Read on ${TARBALL_URL.split('/repos/')[1]?.split('/tarball')[0]}). Falling back to baked artifacts.`,
    )
    return null
  }

  const gzip = Buffer.from(await res.arrayBuffer())
  const snap: UnsorrySnapshot = { proofs: [], goals: [], runs: [] }
  const ext = extract()

  ext.on('entry', (header, stream, next) => {
    const rel = relativePath(header.name)
    const bucket = !header.name.endsWith('.aisp')
      ? null
      : rel.startsWith('library/index/')
        ? 'proofs'
        : rel.startsWith('goals/')
          ? 'goals'
          : rel.startsWith('proof-runs/')
            ? 'runs'
            : null

    if (!bucket) {
      stream.on('end', next)
      stream.resume()
      return
    }

    const chunks: Buffer[] = []
    stream.on('data', (c: Buffer) => chunks.push(c))
    stream.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8')
      if (bucket === 'proofs') {
        const p = parseProof(text)
        if (p) snap.proofs.push(p)
      } else if (bucket === 'goals') {
        const g = parseGoal(text)
        if (g) snap.goals.push(g)
      } else {
        const r = parseRun(text)
        if (r) snap.runs.push(r)
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
 * callers then fall back to the baked artifacts (graceful degradation, no mocks).
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
    console.warn('[snapshot] load failed, falling back to baked artifacts:', err)
    return memo?.snap ?? null
  }
}
