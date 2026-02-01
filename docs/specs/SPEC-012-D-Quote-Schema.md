# SPEC-012-D: Quote Schema

| Field | Value |
|-------|-------|
| **Specification ID** | SPEC-012-D |
| **Parent ADR** | [ADR-012: Engagement Improvements](../adrs/ADR-012-Engagement-Improvements.md) |
| **Version** | 1.0 |
| **Status** | Active |
| **Last Updated** | 2025-02-01 |

---

## Overview

This specification defines the philosophy quote system including database schema, seed data, rotation logic, and GM management interface requirements.

---

## Database Schema

### philosophy_quotes Table

```sql
CREATE TABLE philosophy_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote TEXT NOT NULL,
  attribution TEXT,  -- NULL for anonymous/guild quotes
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER,  -- NULL for random rotation
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE philosophy_quotes IS 'Rotating quotes displayed on the dashboard';
COMMENT ON COLUMN philosophy_quotes.quote IS 'The quote text';
COMMENT ON COLUMN philosophy_quotes.attribution IS 'Quote author or source (NULL for anonymous)';
COMMENT ON COLUMN philosophy_quotes.is_active IS 'Whether quote is included in rotation';
COMMENT ON COLUMN philosophy_quotes.display_order IS 'Fixed order if set, random if NULL';

CREATE INDEX idx_philosophy_quotes_active ON philosophy_quotes(is_active) WHERE is_active = true;
```

---

## Seed Data: Agentics NZ Quotes

```sql
INSERT INTO philosophy_quotes (quote, attribution, is_active) VALUES
  ('The best way to predict the future is to create it.', 'Peter Drucker', true),
  ('In the age of AI, the most human skills become the most valuable.', 'Agentics NZ', true),
  ('Agents don''t replace humans; they amplify human potential.', 'Agentics NZ', true),
  ('The guild grows stronger when each member grows stronger.', NULL, true),
  ('Every quest completed is a step toward mastery.', NULL, true),
  ('Build with AI, build for humanity.', 'Agentics NZ', true),
  ('The future belongs to those who learn to work alongside intelligent systems.', 'Agentics NZ', true),
  ('Progress over perfection. Ship, learn, iterate.', NULL, true),
  ('She''ll be right - but only if we make it right.', 'Agentics NZ', true),
  ('From apprentice to legend, one objective at a time.', NULL, true),
  ('Your AI is only as good as your understanding of the problem.', 'Agentics NZ', true),
  ('Collaboration beats competition. The guild thrives together.', NULL, true),
  ('Think global, build local. Kiwi innovation for the world.', 'Agentics NZ', true),
  ('The journey of a thousand tokens begins with a single prompt.', NULL, true),
  ('Embrace the chaos of creation. Order emerges from iteration.', NULL, true);
```

---

## Quote Rotation Logic

### Daily Rotation

Quotes rotate daily, determined by a hash of the date:

```typescript
function getDailyQuoteIndex(date: Date, totalQuotes: number): number {
  // Use date string as seed for consistent daily selection
  const dateString = date.toISOString().split('T')[0]  // YYYY-MM-DD

  // Simple hash function
  let hash = 0
  for (let i = 0; i < dateString.length; i++) {
    hash = ((hash << 5) - hash) + dateString.charCodeAt(i)
    hash = hash & hash  // Convert to 32-bit integer
  }

  return Math.abs(hash) % totalQuotes
}
```

### Query for Today's Quote

```typescript
async function getTodaysQuote(): Promise<PhilosophyQuote | null> {
  const supabase = createClient()

  // First, check for fixed-order quotes
  const { data: orderedQuotes } = await supabase
    .from('philosophy_quotes')
    .select('*')
    .eq('is_active', true)
    .not('display_order', 'is', null)
    .order('display_order', { ascending: true })

  if (orderedQuotes && orderedQuotes.length > 0) {
    // Cycle through ordered quotes by day of year
    const dayOfYear = getDayOfYear(new Date())
    return orderedQuotes[dayOfYear % orderedQuotes.length]
  }

  // Otherwise, use random rotation
  const { data: randomQuotes } = await supabase
    .from('philosophy_quotes')
    .select('*')
    .eq('is_active', true)
    .is('display_order', null)

  if (!randomQuotes || randomQuotes.length === 0) {
    return null
  }

  const index = getDailyQuoteIndex(new Date(), randomQuotes.length)
  return randomQuotes[index]
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  const oneDay = 1000 * 60 * 60 * 24
  return Math.floor(diff / oneDay)
}
```

---

## React Hook: usePhilosophyQuote

```typescript
interface PhilosophyQuote {
  id: string
  quote: string
  attribution: string | null
}

export function usePhilosophyQuote() {
  return useQuery({
    queryKey: ['philosophy-quote', new Date().toISOString().split('T')[0]],
    queryFn: getTodaysQuote,
    staleTime: 1000 * 60 * 60,  // 1 hour (quote changes daily)
    refetchOnWindowFocus: false,
  })
}
```

---

## Display Component: PhilosophyQuote

**Props:**
- `quote: PhilosophyQuote` - Quote to display
- `className?: string` - Additional CSS classes

**Visual Requirements:**
1. Italicized quote text
2. Attribution right-aligned below quote (if present)
3. Subtle decorative quotation marks
4. Fade-in animation on load

**Layout:**
```
"In the age of AI, the most human skills become the most valuable."
                                                    — Agentics NZ
```

**Accessibility:**
- Quote is in a `<blockquote>` element
- Attribution uses `<cite>` element

---

## GM Quote Management Interface

### Requirements

**Location:** `/gm/quotes`

**Features:**
1. List all quotes with active/inactive status
2. Add new quote (quote text, attribution)
3. Edit existing quote
4. Toggle active/inactive status
5. Delete quote (soft delete via is_active = false, or hard delete)
6. Set display order (drag-and-drop or number input)
7. Preview quote appearance

**Table Columns:**
- Quote (truncated with tooltip)
- Attribution
- Status (Active/Inactive badge)
- Order (#)
- Actions (Edit, Toggle, Delete)

---

## RLS Policies

```sql
ALTER TABLE philosophy_quotes ENABLE ROW LEVEL SECURITY;

-- Everyone can read active quotes
CREATE POLICY "philosophy_quotes_select_active" ON philosophy_quotes
  FOR SELECT USING (is_active = true);

-- GMs can read all quotes (including inactive)
CREATE POLICY "philosophy_quotes_gm_select_all" ON philosophy_quotes
  FOR SELECT USING (is_gm());

-- Only GMs can insert/update/delete
CREATE POLICY "philosophy_quotes_gm_insert" ON philosophy_quotes
  FOR INSERT WITH CHECK (is_gm());

CREATE POLICY "philosophy_quotes_gm_update" ON philosophy_quotes
  FOR UPDATE USING (is_gm());

CREATE POLICY "philosophy_quotes_gm_delete" ON philosophy_quotes
  FOR DELETE USING (is_gm());
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-02-01 | Initial specification |
