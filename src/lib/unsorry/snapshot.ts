import { extract } from 'tar-stream'
import { createGunzip } from 'node:zlib'
import { Readable } from 'node:stream'
import { parseProof } from './snapshot-parse'
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
  const snap: UnsorrySnapshot = { proofs: [] }
  const ext = extract()

  ext.on('entry', (header, stream, next) => {
    const rel = relativePath(header.name)
    if (!header.name.endsWith('.aisp') || !rel.startsWith('library/index/')) {
      stream.on('end', next)
      stream.resume()
      return
    }
    const chunks: Buffer[] = []
    stream.on('data', (c: Buffer) => chunks.push(c))
    stream.on('end', () => {
      const proof = parseProof(Buffer.concat(chunks).toString('utf8'))
      if (proof) snap.proofs.push(proof)
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
