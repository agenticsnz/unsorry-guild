# Council Report: README Rewrite

**Date:** 2026-02-18
**Quest:** Rewrite Guild Hall README in campaign-mode style
**Mode:** Ship

---

## Synthesis

Six perspectives converged on a clear diagnosis: the current README is an internal project tracker masquerading as a front door. The council agrees on the direction and differs only on details.

### Universal Agreement

All six animals agree on these points:

1. **Lead with philosophy, not features.** The David Cain "quests not goals" insight is the product's soul. It is currently buried in Acknowledgments. Move it to the top.
2. **Kill the status checklist.** The 18-row feature status table communicates project management, not product value. Link to the Delivery Report instead.
3. **Eliminate duplicates.** Two "Database Setup" sections, redundant scope/features sections.
4. **Strip hard-coded counts.** Migration, component, and spec counts are already wrong and will only get worse.
5. **One new file needed.** `docs/SCREENSHOTS.md` for the full mockup gallery.
6. **Use "you" voice throughout.**

### Key Decisions From Each Perspective

| Animal | Core Contribution |
|--------|-------------------|
| **Bear** | The hook is the *insight* — goals are broken, quests fix them. The README is the Bounty Board for the repository. Structure: Hook → Scene → Preview → Capabilities → Tech → Setup → Docs → Acknowledgments. |
| **Cat** | 23 risks identified. Critical: version number is fiction (0.1.0 vs 1.3.0, release link 404s), migration count wrong (94 not 92), mockup text says "to be generated" when images exist. Resolution: strip all counts, fix version before rewriting. |
| **Owl** | 12-section structure with line estimates. 59% reduction (437 → ~180 visible lines). Detailed disposition for every current section. Collapsible project tree via `<details>`. |
| **Puppy** | Tagline should be "Quests, not goals." Drafted concrete scenario (the Sam story). Skill tiers deserve prominence. Agentics NZ quest names are compelling social proof. Dragon quote belongs near the top. |
| **Rabbit** | Only 1 new file needed: `docs/SCREENSHOTS.md`. Keep one hero image in README. Compact docs table (52 lines → 10). Node.js requirement should be 20+ per netlify.toml. 14 env vars (3 required, 11 optional). |
| **Wolf** | Primary audience is GMs (supply side, multipliers). Lead with quester experience to sell, then pivot to GM as creator. "Run your own guild" is a primary message. Kill the standalone Authentication section. |

---

## Pre-Rewrite Fixes Required

These must be resolved before the README is rewritten:

| Issue | Action |
|-------|--------|
| Version identity crisis | Decide: is this 0.1.0, 1.2.1, or 1.3.0? Update package.json and create the git tag |
| Broken release link | The v1.3.0 release link 404s — create the tag/release or remove the link |
| Roadmap contradictions | Roadmap marks OAuth as complete; code has it disabled. Roadmap targets Q1 2025. It's Feb 2026. |
| Delivery Report stats | Report says "152 passing (20 test files)" — outdated |

---

## Proposed README Structure

| # | Section | Lines | Source |
|---|---------|-------|--------|
| 1 | **Hook** — Title, tagline ("Quests, not goals."), one hero image | ~8 | Bear, Puppy |
| 2 | **Why Quests?** — The philosophy (goals are broken, quests fix them) | ~12 | Bear, Puppy |
| 3 | **What a Quest Looks Like** — Concrete scenario (GM creates, quester completes) | ~20 | Puppy |
| 4 | **What You Get** — Two compact tables: Quester Experience + GM Toolkit | ~18 | Wolf, Owl |
| 5 | **How It Works** — The quest loop: Create → Accept → Complete → Review → Reward | ~15 | Owl |
| 6 | **Preview** — 1-2 inline screenshots, link to full gallery | ~8 | Rabbit, Owl |
| 7 | **Run Your Own Guild** — Self-host pitch + Getting Started (consolidated) | ~35 | Wolf, Rabbit |
| 8 | **Tech Stack** — Compact table (keep as-is) | ~14 | Owl |
| 9 | **Reference Guilds** — Condensed Agentics NZ with links | ~8 | Rabbit |
| 10 | **Documentation** — Compact grouped links table | ~10 | Rabbit, Owl |
| 11 | **Project Layout** — 4-line summary OR collapsible `<details>` | ~4-68 | Rabbit, Owl |
| 12 | **Contributing / License / Acknowledgments** | ~15 | All |
| | **Total visible** | **~170** | Down from 437 |

---

## Factual Corrections

| Claim | Current README | Actual | Action |
|-------|---------------|--------|--------|
| Version | 1.3.0 | 0.1.0 (package.json) / v1.2.1 (latest tag) | Resolve |
| Migrations | 92 | 94 files (numbered 001-143 with gaps) | Drop count or say "90+" |
| Components | 131 | 141 | Drop count |
| Specs | 19 | 20 (SPEC-015 missing from list) | Drop count |
| Quests (Agentics NZ) | 10 | 11 | Drop count |
| Node.js | 18+ | 20 (per netlify.toml) | Fix to 20+ |
| Mockup status | "to be generated" | Already exist as PNG/JPG | Remove caveat |
| Test files | 33 | 33 | Accurate (but will drift) |
| ADRs | 14 | 14 | Accurate |

---

## New Files

| File | Purpose |
|------|---------|
| `docs/SCREENSHOTS.md` | Full mockup gallery with descriptions (the only new file needed) |

---

## Content to Draft

1. New tagline and opening hook (Bear + Puppy direction)
2. "Why Quests?" philosophy section (Bear)
3. Concrete scenario — the Sam story (Puppy draft available)
4. Two "What You Get" tables — Quester + GM (Wolf structure)
5. "How It Works" quest loop explanation (Owl)
6. Condensed Getting Started with corrections (Rabbit)
7. `docs/SCREENSHOTS.md` page (Rabbit structure)
