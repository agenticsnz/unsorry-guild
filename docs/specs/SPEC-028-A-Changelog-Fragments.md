# SPEC-028-A: Changelog Fragments (`changelog.d/`)

Implements [ADR-028](../adrs/ADR-028-Changelog-Fragments.md). Mirrors upstream `agenticsnz/unsorry` SPEC-040-A in a Node/TypeScript project.

## Fragment files

- Location: `changelog.d/<category>-<slug>.md`.
- `<category>` ∈ `added | changed | deprecated | removed | fixed | security` (Keep a Changelog).
- `<slug>` is unique per change (issue/PR number or distinctive description) — distinct filenames are what make concurrent PRs conflict-free.
- Body: a single markdown bullet's text, **without** the leading `- `. Trailing/leading whitespace is trimmed; blank fragments are ignored.
- `README.md` in the directory is documentation and is never treated as a fragment.

## Tool — `scripts/changelog.mjs` (dependency-free Node ESM)

Exported, unit-tested functions:

- `fragmentCategory(name)` → the category prefix, or `null` if unknown.
- `readFragments(root)` → `{ [category]: string[] }` grouped by category, entries ordered by filename. **Throws** if a fragment's prefix is not a known category (fail fast on a typo'd filename).
- `renderUnreleased(root)` → the `[Unreleased]` body: `### Category` blocks (in Keep-a-Changelog order) of `- entry` bullets; `''` when there are no fragments.
- `release(root, version, date)` → folds `renderUnreleased` into a new `## [version] - date` section inserted **between** `## [Unreleased]` and the latest released section, then deletes the fragment files (keeping `README.md`). Returns `0` on success, `2` when there are no fragments (no-op).

CLI (invoked only when run directly, inert when imported):

```sh
node scripts/changelog.mjs --preview [<root>]            # default action; prints the body
node scripts/changelog.mjs --release <version> <date> [<root>]
```

`package.json` wraps these as `npm run changelog:preview` and `npm run changelog:release`.

## CHANGELOG.md contract

- The literal line `## [Unreleased]` must exist, followed (eventually) by a `## [` version header — `release` splits on these and fails loudly if either is missing.
- `[Unreleased]` is not hand-edited; it carries a comment pointing at `changelog.d/`.

## Acceptance criteria / tests (`src/tests/scripts/changelog.test.ts`)

- `fragmentCategory` extracts the prefix case-insensitively and returns `null` for unknown/README.
- `renderUnreleased` groups in category order, sorts entries by filename, ignores README and blank fragments, and is `''` when empty.
- `readFragments` throws on an unknown category prefix.
- `release` inserts a dated section between `[Unreleased]` and the prior release, preserves the prior release, clears fragments, and is a no-op returning `2` with none.

## Out of scope

Automated version-number selection and tagging/publishing the GitHub release remain manual (protocols.md §6) — the tool only folds fragments.
