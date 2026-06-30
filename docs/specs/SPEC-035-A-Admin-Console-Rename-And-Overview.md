# SPEC-035-A: Admin Console — Rename & Goals-Centric Overview

Implements: [ADR-035](../adrs/ADR-035-Admin-Console-Rename-And-Overview.md) · Status: Living · Updated: 2026-06-30

## Problem

The admin console is the inherited Guild Hall surface: branded "GM"/"Guild Hall", and its overview
(`/gm`) is wholly quest-platform (Pending Reviews, Quest Stats, Active Adventurers, Extension
Requests, Draft Quests). For a read-only proof-swarm engagement layer whose only admin job is
curating Goals (ADR-016), neither the name nor the content fits.

## Rename (presentation only)

User-facing "GM" / "Game Master" / "Guild Hall" → **"Admin"**. The `/gm` route, the `gm` role, and
the `GM*` component/hook/query-key identifiers are unchanged (ADR-022 precedent).

| File | From → To |
|------|-----------|
| `src/components/layout/gm-header.tsx` | logo "Guild Hall" → "Admin"; `GM` badge → `Admin`; "Exit GM" → "Exit admin"; sr-only "GM menu" → "Admin menu" |
| `src/app/(gm)/gm/page.tsx` | `<h1>` "GM Dashboard" → "Admin" (overview is rewritten below) |
| `src/app/(gm)/gm/quests/{page,new/page}.tsx`, `smart-creator/page.tsx` | metadata `… | GM Dashboard` → `… | Admin` |
| `src/components/my-quests/evidence-status.tsx`, `objective-item.tsx`, `src/app/(dashboard)/my-quests/[id]/page.tsx` | "GM Feedback" → "Admin feedback" |
| `src/components/settings/email-preferences-form.tsx` | "approved by a GM" → "approved by an admin" |
| `src/components/gm/users/user-detail.tsx`, `user-card.tsx` | role label "Game Master" / "GM" → "Admin" |
| `src/components/layout/header.tsx` | public pill "GM" / "GM Dashboard" → "Admin" |

No behavioural change; `npx tsc` + the existing suite stay green.

## Data layer — recent proofs

### Snapshot parse (`snapshot-parse.ts`)

`SnapshotProof` gains optional `provedOn: string` (ISO `YYYY-MM-DD`). The day-stamp lives in each
record's header line — `𝔸<v>.lemma.<sha>@YYYY-MM-DD` (the line before `γ≔`), not in a fenced field —
so `parseProof` reads it from the record's first line via `/@(\d{4}-\d{2}-\d{2})\b/`. Absent /
malformed → `undefined`. Existing fields are untouched; this rides the records the verified-proof
tarball pass already parses. (The provenance block carries no finer timestamp, so day resolution is
the ceiling — documented, not a placeholder.)

### Derivation (`derive.ts`)

```ts
interface RecentProof { goal: string; name?: string; solver?: string; provider?: string; model?: string; provedOn?: string }
deriveRecentProofs(s: UnsorrySnapshot, limit: number): RecentProof[]
```

- Source `[...s.proofs]` (active verified proofs). Keep records with a `provedOn`.
- Sort by `provedOn` desc, then `goal` asc (stable tiebreak); take `limit`.
- Records without `provedOn` sink to the end (never above a dated one); if **none** are dated, return
  `[]` (the overview then shows only the velocity line — the ADR-035 fallback).

## Overview rebuild (`src/app/(gm)/gm/page.tsx`)

Convert from a `'use client'` quest dashboard to a **server component** (mirrors `/gm/prizes`).
`export const dynamic = 'force-dynamic'`. Fetch in parallel: `getPrizes('math')`, `getGoalEffort()`,
`fetchLeaderboardUi()`, and the snapshot (via the existing `loadSnapshot`/standings helper).

1. **Goals status** — for each Goal (`getPrizes('math')`),
   `computeTargetProgress(headlineGoalId, goalEffort)` (proved/total, `percentProved`,
   `headlineStatus`) rendered as a progress bar, plus the prize's own `active`/`closed` badge (no
   extra query — richer per-season detail is the Phase-2 Goals admin, SPEC-036-A). Empty → "No goals
   yet" with a link to `/gm/prizes`.
2. **Recent proof activity** — `deriveRecentProofs(snapshot, 8)` as a list (goal name, `@solver`,
   provider/model, `provedOn`), plus a velocity line "N proofs in the last 24 h · M in 7 d" derived
   from `timelines.merge` (sum buckets within the window using the existing chart date helpers).
   No snapshot / no dated proofs → just the velocity line.
3. **Quick actions** — links to `/gm/prizes` (New goal / Open–Close season) and `/math/goals` (View
   public Goals).

No quest hooks remain in the file.

## Tests (vitest)

- `snapshot-parse.test.ts` — `parseProof` extracts `provedOn` from the header line; absent/malformed
  → `undefined`; other fields unaffected.
- `derive.test.ts` — `deriveRecentProofs`: date-desc + goal-asc ordering, `limit`, undated records
  sink, all-undated → `[]`.
- A small pure helper for the 24 h / 7 d velocity sum (if extracted) gets a window test.

## Out of scope (follow-ups)

Sub-day proof timestamps (would need an upstream artifact change); contributor snapshot on the
overview (deferred by the user); moving the `/gm` route or `gm` role to `/admin`/`admin`; deleting
the dead quest-platform admin routes. Goals CRUD + tracking + authoring guidance is SPEC-036-A.
