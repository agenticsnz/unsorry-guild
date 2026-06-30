# SPEC-036-A: Admin Goals Management

Implements: [ADR-036](../adrs/ADR-036-Admin-Goals-Management.md) · Status: Living · Updated: 2026-06-30

## Problem

`/gm/prizes` is a placeholder: a raw `headlineGoalId` text input + open-season / close-&-award. No
target picker, no edit, no delete, no tracking. A guild "Goal" is the `prizes` overlay wrapping a
read-only unsorry headline goal (ADR-015/018), so full create/edit/delete/track/award is guild-local
and safe — only *authoring a new proof goal* is out of bounds (that stays upstream).

## Pure helper — candidate targets (`src/lib/prizes/goal-candidates.ts`)

```ts
interface GoalCandidate { id: string; difficulty?: number; status?: string; suite?: string }
buildGoalCandidates(goalEffort: GoalEffort[], suites: BenchmarkSuite[]): GoalCandidate[]
```

- Merge every `goal_effort` row (`{id: goal, difficulty, status}`) with every suite goal
  (`suite.goals[].id`, tagged `suite: suite.id`).
- Dedupe by `id` — `goal_effort` wins (richer status), but a suite tag is preserved if only the suite
  knew the goal.
- Sort: `open`/`blocked` before `proved`/`archived` (actionable first), then `difficulty` desc, then
  `id` asc. Pure + unit-tested.

A presentational `candidateLabel(c)` → `"<id> · d<difficulty> · <status>[ · <suite>]"` for the
datalist option text.

## Schema (`src/lib/schemas/goal.schema.ts`)

```ts
goalSchema = z.object({
  headlineGoalId: z.string().min(1).max(200),
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  badgeEmoji: z.string().max(8).optional(),
})
parseGoalForm(fd: FormData): { ok: true; data } | { ok: false; error: string }   // pure, tested
```

## Server actions (`src/lib/prizes/admin-actions.ts`)

- `createPrizeAction` — refactor to validate via `parseGoalForm` (same insert).
- `updatePrizeAction(fd)` — `id` + validated fields → `prizes.update(...).eq('id', id)`;
  `revalidatePath('/gm/prizes')` + `'/math/goals'` + `'/gm'`.
- `deletePrizeAction(fd)` — `id` → `prizes.delete().eq('id', id)`. Cascade removes seasons + awards
  (`202`/`203` FKs are `ON DELETE CASCADE`).
- `openSeasonAction` / `closeAndAwardAction` unchanged.

## Page (`src/app/(gm)/gm/prizes/page.tsx`) — server component

Heading "Goals". Fetch `getPrizes('math')`, `getGoalEffort()`, `getRegisteredTargets()`,
`getGoalSolverMap()`. Compute `buildGoalCandidates`. Render:

1. **Create** — `<GoalForm candidates={…} />` (client): a text input wired to a `<datalist>` of
   candidates (native, searchable, still accepts a free id — the ADR-036 escape hatch) + title /
   description / badge, submitting `createPrizeAction`.
2. **Guidance** — `<GoalAuthoringGuide />` (static): "Don't see your target? New proof goals are
   authored in the swarm, not here" → backlog sourcing (unsorry ADR-012) + skeleton intake (unsorry
   ADR-081), linked via `repoBlobUrl(...)`.
3. **Goals list** — one card per prize: title/badge/`headlineGoalId`, status badge,
   `TargetProgressView` (`computeTargetProgress`), a top-3 podium preview
   (`computeTargetLeaderboard` → first three), and a `<GoalRowActions>` (client): Edit (dialog →
   `updatePrizeAction`), Delete (`AlertDialog` → `deletePrizeAction`), Open season, Close & award.

Components live under `src/components/gm/goals/`. Reuses `TargetProgressView`
(`src/components/prizes/target-progress.tsx`) and the `dialog`/`alert-dialog`/`select` primitives.

## Tests (vitest)

- `goal-candidates.test.ts` — merge, dedupe (effort wins, suite tag kept), sort order, label.
- `goal.schema.test.ts` — required/optional fields, max lengths, trim, `parseGoalForm` ok/error.
- `derivePodiumAwards` / `computeTargetProgress` / `computeTargetLeaderboard` already covered.

## Out of scope (follow-ups)

Writing goals upstream; editing a frozen podium by hand; multi-domain Goals (only `math` today);
season history beyond the latest. Brand-new goal authoring remains upstream (guidance only).
