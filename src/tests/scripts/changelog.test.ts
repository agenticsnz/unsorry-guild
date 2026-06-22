import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
// Plain-JS ESM tool (ADR-027); imported by relative path (allowJs + bundler resolution).
import {
  CATEGORIES,
  fragmentCategory,
  readFragments,
  renderUnreleased,
  release,
} from '../../../scripts/changelog.mjs'

let root: string

function fragment(name: string, body: string) {
  writeFileSync(join(root, 'changelog.d', name), body)
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'guild-changelog-'))
  mkdirSync(join(root, 'changelog.d'), { recursive: true })
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('fragmentCategory', () => {
  it('extracts the Keep-a-Changelog category prefix', () => {
    expect(fragmentCategory('changed-foo-bar.md')).toBe('changed')
    expect(fragmentCategory('added-x.md')).toBe('added')
    expect(fragmentCategory('Fixed-Y.md')).toBe('fixed') // case-insensitive
  })
  it('returns null for an unknown prefix', () => {
    expect(fragmentCategory('misc-thing.md')).toBeNull()
    expect(fragmentCategory('README.md')).toBeNull()
  })
})

describe('renderUnreleased', () => {
  it('groups by category in Keep-a-Changelog order and sorts entries by filename', () => {
    fragment('fixed-zebra.md', 'Fixed the zebra.')
    fragment('fixed-alpha.md', 'Fixed alpha.')
    fragment('added-thing.md', 'Added a thing.')
    expect(renderUnreleased(root)).toBe(
      ['### Added', '', '- Added a thing.', '', '### Fixed', '', '- Fixed alpha.', '- Fixed the zebra.'].join(
        '\n',
      ),
    )
  })

  it('ignores README and blank fragments, and is empty with none', () => {
    expect(renderUnreleased(root)).toBe('')
    fragment('README.md', 'docs, not an entry')
    fragment('changed-blank.md', '   \n')
    expect(renderUnreleased(root)).toBe('')
  })

  it('throws on a fragment with an unknown category prefix', () => {
    fragment('nope-bad.md', 'body')
    expect(() => readFragments(root)).toThrowError(/must start with one of/)
  })
})

describe('release', () => {
  const CHANGELOG = [
    '# Changelog',
    '',
    '## [Unreleased]',
    '',
    '## [2.0.2] - 2026-06-21',
    '',
    '### Fixed',
    '',
    '- An earlier fix.',
    '',
  ].join('\n')

  it('folds fragments into a dated version section above the latest release and clears them', () => {
    writeFileSync(join(root, 'CHANGELOG.md'), CHANGELOG)
    fragment('changed-daily.md', 'Daily aggregation.')
    fragment('fixed-bug.md', 'Squashed a bug.')

    expect(release(root, '2.1.0', '2026-06-22')).toBe(0)

    const out = readFileSync(join(root, 'CHANGELOG.md'), 'utf8')
    expect(out).toContain('## [2.1.0] - 2026-06-22')
    expect(out).toContain('- Daily aggregation.')
    expect(out).toContain('- Squashed a bug.')
    // New section sits between [Unreleased] and the prior release, which is preserved.
    expect(out.indexOf('## [Unreleased]')).toBeLessThan(out.indexOf('## [2.1.0]'))
    expect(out.indexOf('## [2.1.0]')).toBeLessThan(out.indexOf('## [2.0.2]'))
    expect(out).toContain('- An earlier fix.')
    // Fragments cleared; README (if any) would survive.
    expect(readdirSync(join(root, 'changelog.d'))).toEqual([])
  })

  it('is a no-op (exit 2) when there are no fragments', () => {
    writeFileSync(join(root, 'CHANGELOG.md'), CHANGELOG)
    expect(release(root, '2.1.0', '2026-06-22')).toBe(2)
    expect(readFileSync(join(root, 'CHANGELOG.md'), 'utf8')).toBe(CHANGELOG)
  })
})

describe('CATEGORIES', () => {
  it('is the Keep-a-Changelog set in order', () => {
    expect(CATEGORIES).toEqual(['added', 'changed', 'deprecated', 'removed', 'fixed', 'security'])
  })
})
