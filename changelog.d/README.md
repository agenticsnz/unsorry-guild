# Changelog fragments

User-facing changes are recorded here as **one file per change** instead of
editing `CHANGELOG.md`'s `[Unreleased]` section directly. Because every PR adds a
*distinct new file*, concurrent PRs never conflict on the changelog — the point
of [ADR-028](../docs/adrs/ADR-028-Changelog-Fragments.md). The fragments are
collated into a versioned section at release time.

## Adding an entry

Create `changelog.d/<category>-<slug>.md` containing the entry text (one bullet,
markdown, **no leading `- `**). For example `changelog.d/fixed-proofs-over-time-daily-aggregation.md`:

```
The Proofs over time chart's merge basis now aggregates to daily totals…
```

- **`<category>`** is one of: `added`, `changed`, `deprecated`, `removed`,
  `fixed`, `security` (Keep a Changelog).
- **`<slug>`** must be **unique** — include the issue/PR number or a distinctive
  description (e.g. `changed-daily-chart-12.md`). Unique filenames are what keep
  parallel PRs from colliding; a generic slug two PRs might both pick
  (`fixed-bug.md`) reintroduces the conflict.

Not every PR needs one — only user-facing changes.

## Previewing / releasing

```sh
npm run changelog:preview                       # what [Unreleased] would render
npm run changelog:release 2.1.0 2026-06-22      # fold into CHANGELOG.md, clear fragments
```
