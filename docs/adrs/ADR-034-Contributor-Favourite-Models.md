# ADR-034: "Favourite Models" on the Contributor Profile

| Field | Value |
|-------|-------|
| **Decision ID** | ADR-034 |
| **Initiative** | unsorry-guild |
| **Proposed By** | Development Team |
| **Date** | 2026-06-25 |
| **Status** | Accepted |

---

## WH(Y) Decision Statement

**In the context of** the contributor profile (`/math/contributors/[handle]`), which shows a standing and a term-by-term **Score breakdown** (ADR-032) but says nothing about *how* the proofs behind that score were produced,

**facing** the fact that every verified-proof record (`library/index/*.aisp`) already carries the engine that discharged it — `⟦Π:Provenance⟧{provider≜…; model≜…}` — and the guild already maintains a model→Pokémon registry (ADR-027) with sprites, yet none of this is connected to the people who earn the score, so a reader cannot see that (say) `@cgbarlow`'s proofs are overwhelmingly `python / sympy` template proofs versus an LLM-heavy contributor,

**we decided for** deriving each contributor's **favourite models** from the snapshot's per-proof provenance — grouping their credited proofs (active + archived, deduped per goal) by the `${provider} / ${model}` key that mirrors `generate.py`'s model distribution — joining to the registry for sprites, and rendering it as a **table below the Score breakdown** (proof count + share per engine, each linking to its model page),

**and neglected** a per-run source (`proof-runs/*.aisp` or `benchmark-runs.json`) — rejected because runs include failures and benchmark-only cohorts, so they wouldn't reflect *score-bearing* work and would double-count attempts; and a separate "favourite models" card — rejected because the user wanted it as a table continuous with the score breakdown, where the proof term it explains already lives,

**to achieve** a profile that answers "what actually proved these goals?" — making the engine mix behind a standing legible and tying the model registry to the leaderboard it serves,

**accepting that** the table counts only proofs whose record carries provider/model provenance, so for contributors with inferred-git or pre-logging proofs it totals fewer than the credited-proofs figure (disclosed in a footnote), and that the breakdown requires the git snapshot (a `GITHUB_TOKEN`), degrading to an omitted section when the snapshot is unavailable.

---

## Decision

- `SnapshotProof` gains optional `provider` / `model`; `parseProof` extracts them (treating the `∅` none-sentinel as absent, as it already does for `solver`).
- `deriveContributorModels(snapshot, handle)` (pure) returns the contributor's engines ranked by proof count: it filters proofs to that solver (case-insensitive), dedupes per goal across active + archived with active provenance winning, groups by `${provider} / ${model || 'unknown'}`, and skips engine-less records.
- `getContributorModels(handle)` (facade, total) loads the snapshot, derives the usage, joins each row to the registry map for its Pokémon sprite, and returns `{ rows, total }`.
- The contributor page renders a **Favourite models** section below **Score breakdown** when the contributor is ranked and has at least one attributed engine; `FavouriteModels` is a presentational table (sprite + `provider / model` + Pokémon name → model page; proofs; share; total row; footnote).

## Consequences

- The model registry (ADR-027) is now connected to the people who earn the score, not just the global distribution.
- The breakdown is snapshot-derived and per-proof, so it is correct without recomputing any score; it never throws (degrades to an omitted section).
- The attributed total can be lower than credited proofs for contributors with inferred/legacy attribution — surfaced in a footnote rather than silently reconciled.
- Tests cover the parser (provider/model + `∅`), the derivation (ranking, per-goal dedup with active-wins, `unknown` model, case-insensitive handle, engine-less exclusion), and the component (counts, share, sprite/link, empty state).
