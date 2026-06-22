#!/usr/bin/env node
// Collate per-PR changelog fragments into CHANGELOG.md (ADR-027 / SPEC-027-A).
//
// A Node ESM port of unsorry's `tools.changelog` (its ADR-040), so unsorry-guild
// uses the same one-file-per-change convention: each change ships a fragment file
// `changelog.d/<category>-<slug>.md` instead of editing CHANGELOG.md's
// `[Unreleased]` section directly. Distinct filenames per PR never collide, so
// concurrent PRs cannot conflict on the changelog. Fragments are folded — into a
// preview during development and into a versioned section at release — by this
// tool (`npm run changelog:preview` / `npm run changelog:release`).
//
// Usage:
//   node scripts/changelog.mjs --preview [<root>]
//   node scripts/changelog.mjs --release <version> <date> [<root>]
import { readFileSync, writeFileSync, readdirSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Keep a Changelog section order; fragments are filed by these category prefixes.
export const CATEGORIES = ['added', 'changed', 'deprecated', 'removed', 'fixed', 'security']
const FRAGMENTS_DIR = 'changelog.d'
const UNRELEASED_HEADER = '## [Unreleased]'

const titleCase = (c) => c.charAt(0).toUpperCase() + c.slice(1)

/** The Keep-a-Changelog category from a fragment filename, e.g.
 * `changed-daily-chart.md` -> `changed`. null if the prefix is unknown. */
export function fragmentCategory(name) {
  const prefix = name.split('-', 1)[0].toLowerCase()
  return CATEGORIES.includes(prefix) ? prefix : null
}

/** Map category -> list of entry bodies, read from `changelog.d/*.md` (excluding
 * README), grouped and deterministically ordered by filename. */
export function readFragments(root) {
  const grouped = Object.fromEntries(CATEGORIES.map((c) => [c, []]))
  const base = join(root, FRAGMENTS_DIR)
  if (!existsSync(base)) return grouped
  const files = readdirSync(base)
    .filter((n) => n.endsWith('.md') && n.toLowerCase() !== 'readme.md')
    .sort()
  for (const name of files) {
    const category = fragmentCategory(name)
    if (category === null) {
      throw new Error(
        `${name}: filename must start with one of ${CATEGORIES.join(', ')} ` +
          `(e.g. changed-${name})`,
      )
    }
    const body = readFileSync(join(base, name), 'utf8').trim()
    if (body) grouped[category].push(body)
  }
  return grouped
}

/** The `[Unreleased]` body (`### Category` blocks of `- entry` bullets) rendered
 * from the fragments. Empty string when there are no fragments. */
export function renderUnreleased(root) {
  const grouped = readFragments(root)
  const blocks = []
  for (const category of CATEGORIES) {
    const entries = grouped[category]
    if (!entries.length) continue
    const lines = [`### ${titleCase(category)}`, '']
    for (const entry of entries) lines.push(`- ${entry}`)
    blocks.push(lines.join('\n'))
  }
  return blocks.join('\n\n')
}

/** Return [head, unreleasedBlock, rest] where head ends at the `## [Unreleased]`
 * line, unreleasedBlock is that section up to the next `## [` version header, and
 * rest is from that header onward. */
function splitChangelog(text) {
  const marker = text.indexOf(UNRELEASED_HEADER)
  if (marker === -1) throw new Error(`${UNRELEASED_HEADER} not found in CHANGELOG.md`)
  const head = text.slice(0, marker)
  const after = text.slice(marker)
  const nextVersion = after.indexOf('\n## [', UNRELEASED_HEADER.length)
  if (nextVersion === -1) throw new Error('no released version section found after [Unreleased]')
  return [head, after.slice(0, nextVersion + 1), after.slice(nextVersion + 1)]
}

/** Fold the fragments into a new `## [version] - date` section above the latest
 * release, then delete the fragment files. A no-op (exit 2) with no fragments. */
export function release(root, version, date) {
  const body = renderUnreleased(root)
  if (!body) {
    process.stderr.write('no changelog fragments to release\n')
    return 2
  }
  const changelogPath = join(root, 'CHANGELOG.md')
  const text = readFileSync(changelogPath, 'utf8')
  const [head, unreleasedBlock, rest] = splitChangelog(text)
  const section = `## [${version}] - ${date}\n\n${body}\n\n`
  writeFileSync(changelogPath, head + unreleasedBlock + section + rest)
  const base = join(root, FRAGMENTS_DIR)
  for (const name of readdirSync(base)) {
    if (name.endsWith('.md') && name.toLowerCase() !== 'readme.md') rmSync(join(base, name))
  }
  process.stdout.write(
    `released ${version}: folded fragments into CHANGELOG.md and cleared ${FRAGMENTS_DIR}/\n`,
  )
  return 0
}

export function main(argv) {
  if (argv.includes('--release')) {
    const rest = argv.filter((a) => a !== '--release')
    if (rest.length < 2) {
      process.stderr.write('usage: --release <version> <date> [<root>]\n')
      return 1
    }
    const [version, date] = rest
    const root = rest[2] ?? process.cwd()
    return release(root, version, date)
  }
  const rest = argv.filter((a) => a !== '--preview')
  const root = rest[0] ?? process.cwd()
  const body = renderUnreleased(root)
  process.stdout.write(body ? `${body}\n` : '(no unreleased changelog fragments)\n')
  return 0
}

// Run as a CLI when invoked directly; stay inert when imported by tests.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)))
}
