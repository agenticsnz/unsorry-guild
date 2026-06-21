# ADR-020: Default Theme — Dark

| Field | Value |
|-------|-------|
| **Decision ID** | ADR-020 |
| **Initiative** | unsorry-guild adaptation |
| **Proposed By** | Development Team |
| **Date** | 2026-06-21 |
| **Status** | Accepted |

---

## WH(Y) Decision Statement

**In the context of** re-scoping Guild Hall into `unsorry-guild`, an engagement layer for the unsorry swarm,

**facing** the need for a default visual identity that matches unsorry's existing dark public pages,

**we decided for** making `dark` the default theme while retaining the existing `light` / `warm` / `system` options and the theme toggle,

**and neglected** stripping the other themes to dark-only (loses user choice for no benefit) and keeping `warm` as default (off-brand for unsorry),

**to achieve** a native-feeling dark UI by default that contributors can still override,

**accepting that** the inherited theme machinery (provider, toggle, CSS variable blocks for all themes) is carried forward unchanged apart from the default.

---

## Context

guild-hall shipped with `warm` as the default theme (`src/providers/theme-provider.tsx`, `src/app/layout.tsx`). Decision #6 in `agenticsnz/unsorry-guild#1` sets dark as the default while keeping the toggle.

## Decision

- `ThemeProvider` default param and initial resolved theme → `dark`.
- Root layout passes `defaultTheme="dark"`.
- A stored user preference still wins (toggle preserved); `setTheme` continues to switch between `light` / `warm` / `dark` / `system`.

See [SPEC-008](../specs/SPEC-008-Theme-System.md).

## Consequences

- New visitors get dark by default; the toggle and all three palettes remain available.
- No CSS changes required — the `.dark` token block already exists in `globals.css`.
