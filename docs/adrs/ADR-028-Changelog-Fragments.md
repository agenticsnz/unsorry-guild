# ADR-028: Changelog Fragments (`changelog.d/`)

| Field | Value |
|-------|-------|
| **Decision ID** | ADR-028 |
| **Initiative** | unsorry-guild — engineering hygiene under concurrent PRs |
| **Proposed By** | Development Team |
| **Date** | 2026-06-22 |
| **Status** | Accepted |

---

## WH(Y) Decision Statement

**In the context of** an engagement layer developed as a stream of small feature/fix PRs against `main`, each required by protocol §5 to record its user-facing change in `CHANGELOG.md`,

**facing** the fact that every PR editing the single `## [Unreleased]` section of `CHANGELOG.md` mutates the same lines, so two in-flight PRs conflict on the changelog (a merge conflict that has nothing to do with the actual change) and the loser must rebase purely to move a bullet,

**we decided for** adopting the **`changelog.d/` one-file-per-change fragment** workflow that the upstream unsorry repo already uses (its ADR-040 / SPEC-040-A): each change ships a distinct `changelog.d/<category>-<slug>.md` file instead of editing `[Unreleased]`, and a small Node tool (`scripts/changelog.mjs`, exposed as `npm run changelog:preview` / `npm run changelog:release`) collates the fragments — into a preview during development and into a dated `## [version]` section at release, deleting the fragments,

**and neglected** continuing to hand-edit `[Unreleased]` (the recurring conflict this removes); a git `union` merge driver on `CHANGELOG.md` (fragile, repo-local config every clone must set, and it silently interleaves entries); and porting upstream's Python `tools.changelog` verbatim (this is a Node/TypeScript project — a dependency-free `.mjs` runs via the already-present Node toolchain with no Python or build step),

**to achieve** conflict-free parallel PRs, a deterministic released changelog identical in shape to upstream's, and alignment of the two repos' release hygiene,

**accepting that** contributors learn one convention (a fragment file, not a `[Unreleased]` edit — documented in `changelog.d/README.md`), that a release is now a two-step `npm run changelog:release <version> <date>` + tag, and that this is a project-specific mechanism *implementing* the vendored protocols.md §5 (which the protocol's `[Unreleased]` wording still subsumes), exactly as upstream layered ADR-040 over the same protocol.

---

## Decision

- `scripts/changelog.mjs` — pure, tested `readFragments` / `renderUnreleased` / `release(root, version, date)` + a CLI (`--preview`, `--release <version> <date> [<root>]`). Category prefixes follow Keep a Changelog (`added`, `changed`, `deprecated`, `removed`, `fixed`, `security`); fragments are grouped in that order and sorted by filename for determinism.
- `changelog.d/` — fragment directory with a `README.md` documenting the convention; `[Unreleased]` in `CHANGELOG.md` carries a pointer comment and is no longer hand-edited.
- `package.json` — `changelog:preview` and `changelog:release` scripts.

See [SPEC-028-A](../specs/SPEC-028-A-Changelog-Fragments.md), upstream `agenticsnz/unsorry` ADR-040, and `protocols.md` §5–6.

## Consequences

- Parallel PRs stop conflicting on `CHANGELOG.md`; the released changelog is reproducible from the fragments.
- One new convention to follow and one new release step; both documented in `changelog.d/README.md`.
