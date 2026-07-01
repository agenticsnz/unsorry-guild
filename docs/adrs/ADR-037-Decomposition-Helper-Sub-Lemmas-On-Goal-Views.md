# ADR-037: Decomposition Helper Sub-Lemmas on Goal Views

| Field | Value |
|-------|-------|
| **Decision ID** | ADR-037 |
| **Initiative** | unsorry-guild goal transparency |
| **Proposed By** | Development Team |
| **Date** | 2026-07-01 |
| **Status** | Proposed |

> **Design-only ADR.** Records the decision and its spec (SPEC-037-A) for review. No code ships
> with this PR; implementation (TDD) follows in a separate PR once the design is signed off.

---

## WH(Y) Decision Statement

**In the context of** the guild's goal-detail views — the single-goal view (`/math/goals/[targetId]`)
and the goal-inside-a-benchmark view (`/math/suites/[id]/[goal]`) — which render a goal's statement,
status, proof, and contributors,

**facing** the fact that when the swarm cannot prove a goal in one shot it **decomposes** it into
helper sub-lemmas that are proved separately and then composed into the parent proof (unsorry ADR-009),
yet the guild surfaces none of that structure: a viewer sees only the parent goal, never that it was
solved via a decomposition tree, which helper lemmas it took, or who proved them — and the only
decomposition signal the guild has today is the brittle goal-id **suffix convention**
(`<parent>-sN`, `subtree.ts`) used for flagship-target progress, which misses curated-suite subs and,
with unsorry ADR-116 moving benchmark sub-lemmas to the suite pin, decouples "what the subs are" from
"where each sub's proof lives",

**we decided for** ingesting unsorry's **authoritative `decompositions/*.aisp` parent→subs records**
into the read-only git snapshot (ADR-015 / ADR-024 compliant — read-only, git-as-source), and adding a
**"Decomposition — helper lemmas" section** to both goal views that lists each helper sub-lemma (id,
status, and solver attribution from the existing goal+proof ingestion) alongside the parent's **composed
proof**, rendering only when the goal participates in a decomposition,

**and neglected** (a) relying on the goal-id suffix convention alone — fragile, machine-`-sN`-only, and
blind to curated + suite-pinned subs; (b) writing decomposition data back to unsorry — violates the
read-only invariant (ADR-015); and (c) a Supabase table for decomposition — git is the source of truth
(ADR-024), so the relationship is computed on-read from the snapshot,

**to achieve** goal pages that show *how* a hard goal was actually solved — the helper lemmas and their
contributors plus the composed result — sourced from the authoritative record rather than a naming
heuristic,

**accepting that** the parent→subs edge comes from the decomposition record while each sub's *status/proof*
is joined from wherever its index entry lives (repo library today, suite pin after ADR-116), and that a
sub with no proof yet simply renders as open/blocked.

---

## Options Considered

### Option 1: Ingest `decompositions/*.aisp` records (Selected)
Parse the authoritative parent→subs records into the snapshot; join sub status from existing goal/proof
data; render a decomposition section. **Pros:** authoritative, naming- and location-independent, survives
the ADR-116 move of benchmark subs to the suite pin, handles curated suites. **Cons:** one new parsing
step in the snapshot pipeline.

### Option 2: Suffix convention only (Rejected)
Derive subs from `<parent>-sN` ids (reuse `subtree.ts`). **Rejected:** catches only machine-minted subs,
misses curated-suite decompositions, and conflates the id scheme with the decomposition relationship.

### Option 3: Store decomposition in Supabase (Rejected)
A table mirroring parent→subs. **Rejected:** git is the source of truth (ADR-024); duplicating it in
Supabase invites drift and adds a write path the read-only model (ADR-015) avoids.

---

## Dependencies
| Relationship | ADR ID | Title | Notes |
|--------------|--------|-------|-------|
| Relates To | ADR-015 | Read-Only Git Source | Decomposition is ingested read-only; never written back |
| Relates To | ADR-024 | Git-as-Source-of-Truth Snapshot | Parent→subs computed on-read from the snapshot, not stored |
| Relates To (upstream) | unsorry ADR-009 | Goal Decomposition | The source of `decompositions/*.aisp` |
| Relates To (upstream) | unsorry ADR-116 | Suite-Aware Decomposition | Moves benchmark subs to the suite pin; this design joins sub status wherever it lives |

## References
| Reference ID | Title | Type | Location |
|--------------|-------|------|----------|
| REF-1 | Decomposition goal-view spec | Specification | specs/SPEC-037-A-Decomposition-Helper-Sub-Lemmas-On-Goal-Views.md |
| REF-2 | Suffix-convention subtree logic (reused for membership, not the source) | Code | src/lib/unsorry/subtree.ts |

## Status History
| Status | Approver | Date |
|--------|----------|------|
| Proposed | Development Team | 2026-07-01 |
