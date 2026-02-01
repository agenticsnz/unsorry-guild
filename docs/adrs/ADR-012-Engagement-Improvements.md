# ADR-012: Engagement Improvements

| Field | Value |
|-------|-------|
| **Decision ID** | ADR-012 |
| **Initiative** | Guild Hall - User Engagement |
| **Proposed By** | Development Team |
| **Date** | 2025-02-01 |
| **Status** | Accepted |

---

## WH(Y) Decision Statement

**In the context of** Guild Hall's user dashboard needing to transform from a static progress display to an engaging, personalized experience that motivates continued participation,

**facing** the challenge of users not feeling recognized for their progress, lacking clear guidance on next steps, and GMs needing better visibility into guild activity,

**we decided for** a comprehensive engagement system including skill tiers (5 levels with GM-configurable thresholds), contextual greetings (priority-based with session caching), streak tracking (user-configurable weekend behavior), rotating philosophy quotes, smart nudge banners, daily GM digest emails, and weekly user progress emails,

**and neglected** gamification-heavy approaches (daily login rewards, loot boxes), social comparison features (forcing leaderboard visibility), and notification-heavy systems (push notifications, frequent emails),

**to achieve** intrinsic motivation through progress visualization, personalized guidance through smart recommendations, and better GM-user communication through targeted emails,

**accepting that** the dashboard will have more visual elements (potential cognitive load), email features require user consent and preference management, and tier thresholds may need adjustment as more quests are added.

---

## Context

The current Guild Hall dashboard displays basic statistics (points, active quests, completed quests) with a static greeting. User feedback and engagement analysis identified several opportunities:

1. **Lack of Progress Recognition:** Users complete objectives but don't feel a sense of progression
2. **No Clear Direction:** New users don't know which quest to start; returning users don't know what's next
3. **GM Communication Gap:** GMs have no daily summary of guild activity
4. **Stale Experience:** Same greeting every visit, no personality or context

**User Stories:**
- "As a user, I want to see my skill level grow as I complete quests"
- "As a returning user, I want to know what I should focus on next"
- "As a GM, I want a daily summary of guild activity and pending items"
- "As a user, I want to be reminded when I have pending submissions approved"

---

## Options Considered

### Option 1: Comprehensive Engagement System (Selected)

A multi-faceted approach combining progression visualization, smart recommendations, and targeted communication.

**Components:**
- Skill tier system (5 levels)
- Contextual greetings with priority rules
- Streak tracking with weekend options
- Philosophy quote rotation
- Smart nudge banners (one at a time, dismissible)
- GM daily digest email
- User weekly progress email

**Pros:**
- Addresses all identified engagement gaps
- Intrinsic motivation (progress, mastery) over extrinsic (rewards)
- Respects user attention (one nudge, dismissible)
- Email communication is opt-in with user control
- GM gets consolidated view without manual checking

**Cons:**
- More complex dashboard
- Multiple database tables required
- Email infrastructure needed

### Option 2: Gamification-Heavy Approach (Rejected)

Daily login rewards, achievement points, loot boxes, streak penalties.

**Pros:**
- Proven engagement mechanics
- Clear reward loops

**Cons:**
- Can feel manipulative
- Extrinsic motivation doesn't sustain
- Not aligned with Guild Hall's educational/growth focus

**Why Rejected:** Guild Hall is about genuine skill development, not engagement manipulation.

### Option 3: Minimal Enhancements (Rejected)

Just add tier display and better stats, no emails or nudges.

**Pros:**
- Simpler implementation
- Less database complexity

**Cons:**
- Doesn't address GM communication needs
- Misses opportunity for smart guidance
- Users still lack direction

**Why Rejected:** Insufficient to address the identified engagement gaps.

---

## Design Decisions

### Skill Tier System

**5-Tier Structure:**

| Tier | Name | Min Points | Icon |
|------|------|------------|------|
| 1 | Apprentice | 0 | Seedling |
| 2 | Journeyman | 300 | Sprout |
| 3 | Expert | 600 | Tree |
| 4 | Master | 1200 | Oak |
| 5 | Legend | 2400 | Forest |

**Rationale:**
- Thresholds designed around current quest points (updated: First Steps 50, Agent Swarm 150, Sovereign Engine 250, Compliance 350, Mentor's Path 500, Gorse Bot 500 = 2,100 total)
- Legend tier (2400) requires future quests, creating aspiration
- GM-configurable thresholds allow adjustment as quest catalog grows
- Fibonacci-like scaling (300, 300, 600, 1200) rewards early progress while making higher tiers meaningful

### Contextual Greeting System

**Priority Order (highest to lowest):**

| Priority | Trigger | Example |
|----------|---------|---------|
| Celebration | Quest completed, objective approved | "Congratulations on completing Agent Swarm Commander!" |
| Action | Pending submissions approved, deadlines soon | "You have 2 objectives ready to progress!" |
| Progression | Near tier milestone, streak milestone | "Just 50 points away from Expert!" |
| Time | Morning/afternoon/evening | "Good morning, {name}!" |

**Session Caching:** Greeting determined on first visit, cached in session storage for consistency during a single session.

### Streak Tracking

**Activity Definition:** Any of:
- Submit objective evidence
- Complete a quest
- Accept a new quest

**Weekend Behavior Options (user-configurable):**

| Option | Behavior |
|--------|----------|
| `weekends_count` | Weekends count toward streak (default) |
| `weekends_freeze` | Weekends don't affect streak |
| `weekends_optional` | Activity on weekends is bonus, not required |

### Philosophy Quotes

Rotating quotes from guild philosophy, displayed daily. Seeded with Agentics NZ quotes initially. GM can manage via admin interface.

### Nudge Banner System

**Priority Selection (one banner at a time):**

1. Approved submissions ready to progress (action needed)
2. Approaching deadline (< 3 days)
3. Celebration (recent milestone)
4. Quest recommendation (if no active quests)

**Dismissal:** Session-persistent. Dismissed banner doesn't reappear until next session.

### Email Features

**GM Daily Digest (08:00 default):**
- Activity summary (submissions, completions, new users)
- Pending reviews count
- Upcoming deadlines
- Quick links to GM dashboard

**User Weekly Progress (Monday 08:00 default):**
- Next steps (approved submissions to progress)
- Recommended action (reuses nudge priority logic - DRY)
- Progress summary (week's activity)
- Encouragement (streak maintained, tier progress)

User can configure: enabled/disabled, day of week, time, timezone.
GM can manually push weekly email to all users via admin page.

### Quest Point Adjustments

To support meaningful tier progression:

| Quest | Old Points | New Points |
|-------|------------|------------|
| First Steps in the Realm | 25 | 50 |
| Agent Swarm Commander | 100 | 150 |
| The Sovereign Engine | 150 | 250 |
| She'll Be Right Compliance | 125 | 350 |
| The Mentor's Path | 150 | 500 |
| Gorse Bot 3000 | 200 | 500 |

**Total Available:** 2,100 points (Legend at 2,400 encourages future quest completion)

---

## Dependencies

| Relationship | ADR ID | Title | Notes |
|--------------|--------|-------|-------|
| Extends | ADR-011 | Banner Message System | Nudge banners reuse banner infrastructure patterns |
| Relates To | ADR-007 | Leaderboard Privacy | Tier display respects privacy settings |
| Depends On | ADR-003 | Backend Platform | Uses Supabase Edge Functions for emails |

---

## References

| Reference ID | Title | Type | Location |
|--------------|-------|------|----------|
| SPEC-012-A | Tier Calculation | Specification | [docs/specs/SPEC-012-A-Tier-Calculation.md](../specs/SPEC-012-A-Tier-Calculation.md) |
| SPEC-012-B | Greeting Rules | Specification | [docs/specs/SPEC-012-B-Greeting-Rules.md](../specs/SPEC-012-B-Greeting-Rules.md) |
| SPEC-012-C | Streak Calculation | Specification | [docs/specs/SPEC-012-C-Streak-Calculation.md](../specs/SPEC-012-C-Streak-Calculation.md) |
| SPEC-012-D | Quote Schema | Specification | [docs/specs/SPEC-012-D-Quote-Schema.md](../specs/SPEC-012-D-Quote-Schema.md) |
| SPEC-012-E | GM Digest Email | Specification | [docs/specs/SPEC-012-E-GM-Digest-Email.md](../specs/SPEC-012-E-GM-Digest-Email.md) |
| SPEC-012-F | User Weekly Email | Specification | [docs/specs/SPEC-012-F-User-Weekly-Email.md](../specs/SPEC-012-F-User-Weekly-Email.md) |
| REF-001 | Engagement Improvements Ideation | Internal | [docs/ideation/engagement-improvements.md](../ideation/engagement-improvements.md) |

---

## Status History

| Status | Approver | Date |
|--------|----------|------|
| Proposed | Development Team | 2025-02-01 |
| Accepted | Development Team | 2025-02-01 |
