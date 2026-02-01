# SPEC-012-A: Tier Calculation

| Field | Value |
|-------|-------|
| **Specification ID** | SPEC-012-A |
| **Parent ADR** | [ADR-012: Engagement Improvements](../adrs/ADR-012-Engagement-Improvements.md) |
| **Version** | 1.0 |
| **Status** | Active |
| **Last Updated** | 2025-02-01 |

---

## Overview

This specification defines the skill tier calculation system including database schema, tier thresholds, calculation logic, and display requirements.

---

## Database Schema

### skill_tier_config Table

```sql
CREATE TABLE skill_tier_config (
  tier_level INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  min_points INTEGER NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'gray',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE skill_tier_config IS 'GM-configurable skill tier thresholds and display settings';
COMMENT ON COLUMN skill_tier_config.tier_level IS 'Tier level (1-5), lower = beginner';
COMMENT ON COLUMN skill_tier_config.min_points IS 'Minimum points required to achieve this tier';
COMMENT ON COLUMN skill_tier_config.icon IS 'Lucide icon name for tier display';
COMMENT ON COLUMN skill_tier_config.color IS 'Tailwind color name for tier styling';
```

### Seed Data

```sql
INSERT INTO skill_tier_config (tier_level, name, min_points, icon, color) VALUES
  (1, 'Apprentice', 0, 'Sprout', 'green'),
  (2, 'Journeyman', 300, 'TreeDeciduous', 'emerald'),
  (3, 'Expert', 600, 'Trees', 'teal'),
  (4, 'Master', 1200, 'Mountain', 'cyan'),
  (5, 'Legend', 2400, 'Crown', 'amber');
```

---

## Tier Calculation Logic

### Calculate User Tier

```typescript
interface TierConfig {
  tier_level: number
  name: string
  min_points: number
  icon: string
  color: string
}

interface TierInfo {
  tier: TierConfig
  points: number
  nextTier: TierConfig | null
  pointsToNext: number
  progressPercent: number
}

function calculateUserTier(userPoints: number, tiers: TierConfig[]): TierInfo {
  // Sort tiers by min_points descending to find highest achieved
  const sortedTiers = [...tiers].sort((a, b) => b.min_points - a.min_points)

  // Find current tier (highest tier where user has enough points)
  const currentTier = sortedTiers.find(t => userPoints >= t.min_points)
    ?? sortedTiers[sortedTiers.length - 1]

  // Find next tier
  const sortedAsc = [...tiers].sort((a, b) => a.min_points - b.min_points)
  const currentIndex = sortedAsc.findIndex(t => t.tier_level === currentTier.tier_level)
  const nextTier = currentIndex < sortedAsc.length - 1
    ? sortedAsc[currentIndex + 1]
    : null

  // Calculate progress to next tier
  const pointsToNext = nextTier ? nextTier.min_points - userPoints : 0
  const progressPercent = nextTier
    ? ((userPoints - currentTier.min_points) / (nextTier.min_points - currentTier.min_points)) * 100
    : 100

  return {
    tier: currentTier,
    points: userPoints,
    nextTier,
    pointsToNext,
    progressPercent: Math.min(100, Math.max(0, progressPercent))
  }
}
```

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| User has 0 points | Returns Apprentice tier, 0% progress |
| User has exactly tier threshold | Returns that tier, 0% progress to next |
| User exceeds Legend threshold | Returns Legend tier, 100% progress |
| No tiers configured | Throw error (system must have tiers) |

---

## React Hook: useUserTier

```typescript
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useSkillTiers() {
  return useQuery({
    queryKey: ['skill-tiers'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('skill_tier_config')
        .select('*')
        .order('tier_level', { ascending: true })

      if (error) throw error
      return data as TierConfig[]
    },
    staleTime: 1000 * 60 * 60, // 1 hour (tiers rarely change)
  })
}

export function useUserTier(userPoints: number | undefined) {
  const { data: tiers } = useSkillTiers()

  if (!tiers || userPoints === undefined) {
    return null
  }

  return calculateUserTier(userPoints, tiers)
}
```

---

## Display Component Requirements

### SkillTierDisplay Component

**Props:**
- `tierInfo: TierInfo` - Calculated tier information
- `showProgress?: boolean` - Whether to show progress bar (default: true)
- `size?: 'sm' | 'md' | 'lg'` - Display size variant

**Visual Requirements:**
1. Tier icon with appropriate color
2. Tier name prominently displayed
3. Current points / next tier threshold
4. Progress bar showing progress to next tier
5. Hover state showing points needed

**Accessibility:**
- Screen reader: "{name} tier, {points} points, {progressPercent}% to {nextTier}"
- Progress bar has aria-valuenow, aria-valuemin, aria-valuemax

---

## RLS Policies

```sql
-- Everyone can read tier configuration
ALTER TABLE skill_tier_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "skill_tier_config_select_all" ON skill_tier_config
  FOR SELECT USING (true);

-- Only GMs can modify tier configuration
CREATE POLICY "skill_tier_config_gm_all" ON skill_tier_config
  FOR ALL USING (is_gm());
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-02-01 | Initial specification |
