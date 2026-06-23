# ADR-032: Surface Score Composition (Dispatch Credit) on the Leaderboard

| Field | Value |
|-------|-------|
| **Decision ID** | ADR-032 |
| **Initiative** | unsorry-guild |
| **Proposed By** | Development Team |
| **Date** | 2026-06-23 |
| **Status** | Accepted |

---

## WH(Y) Decision Statement

**In the context of** the guild rendering unsorry's leaderboard, where rank is by a composite `score = difficulty_points×100 + credited_proofs×25 + dispatch_points×100` (unsorry `generate.py` `_score`, mirrored in `leaderboard-ui.json` → `score_policy`),

**facing** the guild displaying only `score / difficulty / proofs` while silently dropping the `dispatch_points` term in the mapper — so a dispatcher like `@cgbarlow` (191 proofs, 297 difficulty, but 1,306 PRs landed for others) appears to outrank higher-proof contributors for no visible reason, reading as a bug rather than the intended infrastructure credit,

**we decided for** threading `dispatch_proofs` / `dispatch_points` through the mapper into `GuildLeaderboardEntry`, adding a **Dispatch** column to the global leaderboard table, a **Score breakdown** section on the contributor profile that reconstructs the score term by term, and a static **/math/scoring** methodology page linked from both the leaderboard header and the breakdown,

**and neglected** leaving the score opaque (status quo — the rank stays unexplained and looks broken), and recomputing the score guild-side from its parts (rejected — the upstream `score` field is authoritative and avoids drift if the weights change),

**to achieve** a leaderboard whose ranking is self-explanatory: a reader can see that dispatch work, not just proofs, drives a standing,

**accepting that** the methodology page hard-codes the formula and the worked example rather than fetching `score_policy` live — acceptable because the policy is stable and the page is documentation; if the upstream weights change, this page and `score-breakdown.tsx`'s constants are the two places to update.

---

## Decision

- `UnsorryLeaderboardRecord` gains `dispatch_proofs?`, `explicit_solver_proofs?`, `inferred_git_proofs?`; `GuildLeaderboardEntry` gains required `dispatchProofs` / `dispatchPoints` (mapper defaults absent upstream values to 0).
- `GlobalLeaderboard` adds a right-aligned **Dispatch** column (`hidden sm:table-cell`); non-dispatchers render an em dash.
- The contributor profile adds a **Dispatched PRs** stat and a **Score breakdown** section (`ScoreBreakdown`) showing each term, its points, and its share of the total.
- New static route `/math/scoring` documents the three-term formula, what dispatch credit is, and a worked example; linked from the leaderboard header.
- The score weights live as named constants in `score-breakdown.tsx`, mirroring the upstream `score_policy`.

## Consequences

- The leaderboard, profile, and methodology page all agree on how a score is built; dispatch is no longer invisible.
- Fixtures carry dispatch fields and tests assert the column, the breakdown arithmetic, and the mapper defaults.
- The score weights are now duplicated guild-side (documentation + breakdown constants); a future upstream weight change must update both. A later enhancement could surface the live `score_policy` string on the methodology page.
