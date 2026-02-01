# SPEC-012-B: Greeting Rules

| Field | Value |
|-------|-------|
| **Specification ID** | SPEC-012-B |
| **Parent ADR** | [ADR-012: Engagement Improvements](../adrs/ADR-012-Engagement-Improvements.md) |
| **Version** | 1.0 |
| **Status** | Active |
| **Last Updated** | 2025-02-01 |

---

## Overview

This specification defines the contextual greeting system including priority rules, message templates, session caching behavior, and implementation patterns.

---

## Greeting Priority System

Greetings are selected based on priority. The first matching condition wins.

### Priority Order

| Priority | Type | Trigger Condition | Example Message |
|----------|------|-------------------|-----------------|
| 1 | Celebration | Quest completed in last 24h | "Congratulations on completing {questName}!" |
| 2 | Celebration | Tier advancement in last 24h | "You've reached {tierName}! Well done!" |
| 3 | Action | Objectives approved, ready to progress | "You have {count} objective(s) ready to continue!" |
| 4 | Action | Deadline approaching (< 3 days) | "{questName} is due in {days} day(s)!" |
| 5 | Progression | Near tier milestone (< 50 pts) | "Just {points} points from {nextTier}!" |
| 6 | Progression | Streak milestone (7, 14, 30 days) | "{streak} day streak! Keep it going!" |
| 7 | Time | Default fallback | Time-based greeting |

### Time-Based Greetings

| Hour Range | Greeting |
|------------|----------|
| 05:00 - 11:59 | "Good morning, {name}" |
| 12:00 - 16:59 | "Good afternoon, {name}" |
| 17:00 - 20:59 | "Good evening, {name}" |
| 21:00 - 04:59 | "Burning the midnight oil, {name}?" |

---

## Data Requirements

### Required Queries

To determine the greeting, the system needs:

```typescript
interface GreetingContext {
  // Recent completions
  recentlyCompletedQuests: Array<{
    quest_id: string
    quest_title: string
    completed_at: string
  }>

  // Recent tier changes
  previousTierLevel: number | null  // From user activity log
  currentTierLevel: number

  // Action items
  approvedObjectivesCount: number  // Objectives in 'approved' status

  // Deadlines
  upcomingDeadlines: Array<{
    quest_title: string
    deadline: string
    days_remaining: number
  }>

  // Progression
  pointsToNextTier: number
  nextTierName: string | null

  // Streak
  currentStreak: number

  // User info
  displayName: string
  localHour: number  // User's local time
}
```

---

## Session Caching

### Behavior

1. On first dashboard visit, calculate greeting
2. Store in sessionStorage: `{ greeting: string, timestamp: number, sessionId: string }`
3. On subsequent visits in same session, show cached greeting
4. Session ends when browser tab closes

### Implementation

```typescript
const GREETING_CACHE_KEY = 'guild-hall-greeting'

interface CachedGreeting {
  greeting: string
  priority: GreetingPriority
  timestamp: number
}

function getCachedGreeting(): CachedGreeting | null {
  if (typeof window === 'undefined') return null

  const cached = sessionStorage.getItem(GREETING_CACHE_KEY)
  if (!cached) return null

  try {
    return JSON.parse(cached)
  } catch {
    return null
  }
}

function setCachedGreeting(greeting: string, priority: GreetingPriority): void {
  if (typeof window === 'undefined') return

  const cached: CachedGreeting = {
    greeting,
    priority,
    timestamp: Date.now()
  }

  sessionStorage.setItem(GREETING_CACHE_KEY, JSON.stringify(cached))
}
```

---

## Greeting Templates

### Celebration Templates

```typescript
const CELEBRATION_TEMPLATES = {
  quest_complete: [
    "Congratulations on completing {questName}!",
    "Quest complete! {questName} is done!",
    "You've conquered {questName}!",
  ],
  tier_advance: [
    "You've reached {tierName}! Well done!",
    "Welcome to {tierName} tier!",
    "{tierName} unlocked! Impressive work!",
  ]
}
```

### Action Templates

```typescript
const ACTION_TEMPLATES = {
  approved_objectives: [
    "You have {count} objective(s) ready to continue!",
    "{count} objective(s) approved! Ready to progress!",
  ],
  deadline_approaching: [
    "{questName} is due in {days} day(s)!",
    "Don't forget: {questName} deadline in {days} day(s)!",
  ]
}
```

### Progression Templates

```typescript
const PROGRESSION_TEMPLATES = {
  near_tier: [
    "Just {points} points from {nextTier}!",
    "{nextTier} is within reach - only {points} points away!",
  ],
  streak_milestone: [
    "{streak} day streak! Keep it going!",
    "Amazing! {streak} days of progress!",
  ]
}
```

---

## React Hook: useContextualGreeting

```typescript
type GreetingPriority = 'celebration' | 'action' | 'progression' | 'time'

interface GreetingResult {
  greeting: string
  priority: GreetingPriority
  isLoading: boolean
}

export function useContextualGreeting(): GreetingResult {
  // 1. Check session cache first
  const cached = getCachedGreeting()

  // 2. Fetch required data
  const { data: user } = useUser()
  const { data: recentCompletions } = useRecentCompletions()
  const { data: approvedCount } = useApprovedObjectivesCount()
  const { data: deadlines } = useUpcomingDeadlines()
  const tierInfo = useUserTier(user?.points)
  const { data: streak } = useUserStreak()

  // 3. Calculate greeting based on priority
  const calculated = useMemo(() => {
    if (cached) return cached

    // Check each priority in order
    // ... priority evaluation logic

    const result = evaluateGreeting(context)
    setCachedGreeting(result.greeting, result.priority)
    return result
  }, [/* dependencies */])

  return {
    greeting: calculated?.greeting ?? '',
    priority: calculated?.priority ?? 'time',
    isLoading: /* loading states */
  }
}
```

---

## Display Component Requirements

### ContextualGreeting Component

**Props:**
- `className?: string` - Additional CSS classes

**Visual Requirements:**
1. Large, friendly text
2. User's display name prominently shown
3. Subtle animation on load (fade in)
4. Different styling based on priority type:
   - Celebration: Gold/amber accent, confetti icon
   - Action: Blue accent, arrow icon
   - Progression: Green accent, chart icon
   - Time: Neutral, wave icon

**Accessibility:**
- Greeting is announced by screen readers (aria-live="polite")
- No auto-focus (avoid jarring navigation)

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-02-01 | Initial specification |
