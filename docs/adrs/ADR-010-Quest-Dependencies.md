# ADR-010: Quest Dependencies (Prerequisites)

| Field | Value |
|-------|-------|
| **Decision ID** | ADR-010 |
| **Initiative** | Guild Hall - Issue #7 |
| **Proposed By** | Development Team |
| **Date** | 2025-01-31 |
| **Status** | Accepted |

---

## WH(Y) Decision Statement

**In the context of** Guild Hall's quest progression system where some quests logically require prior knowledge or accomplishments,

**facing** the challenge of creating meaningful learning paths while preventing users from attempting quests they're not prepared for,

**we decided for** a prerequisite system using AND logic where quests can require completion of multiple other quests before acceptance,

**and neglected** OR logic (complete any one of A, B, C), skill-based prerequisites, and time-based unlocking,

**to achieve** clear, predictable progression paths that guide users through increasingly complex content and establish guild-specific learning sequences,

**accepting that** users cannot skip prerequisites even if they have equivalent external knowledge, and circular dependency prevention requires application-level validation.

---

## Context

Guild Hall supports quests ranging from beginner ("First Steps in the Realm") to advanced ("Agent Swarm Commander"). Currently, users can accept any published quest regardless of their experience level.

**Problem:** Advanced quests like "The GRASP Protocol" assume knowledge from foundational quests. Users who skip prerequisites may struggle or produce lower quality submissions.

**User Story:** "As a GM, I want to require users complete 'The Prompt Whisperer' before accepting 'Local Model Liberation' so they have foundational skills."

---

## Options Considered

### Option 1: AND Logic Prerequisites (Selected)

Quests can specify multiple prerequisites, ALL of which must be completed.

```
Quest C requires: Quest A AND Quest B
User must complete both A and B before accepting C
```

**Pros:**
- Simple to understand: "Complete all required quests"
- Clear progression paths
- Matches traditional learning progression (course prerequisites)
- Easy to validate and display

**Cons:**
- No flexibility for alternative paths
- Users cannot prove equivalent knowledge

### Option 2: OR Logic Prerequisites (Rejected)

Quests can specify alternatives: complete ANY one of the prerequisites.

```
Quest C requires: Quest A OR Quest B
User completes either A or B to unlock C
```

**Pros:**
- More flexible progression
- Multiple entry points to advanced content

**Cons:**
- Complex to explain in UI
- May lead to knowledge gaps
- Harder to ensure consistent preparation

**Why Rejected:** Added complexity without clear benefit for the learning-focused guild model.

### Option 3: Skill-Based Prerequisites (Rejected)

Define abstract skills (e.g., "Prompt Engineering", "Local AI") and track mastery.

**Pros:**
- More granular progression
- Transfer credit for external learning

**Cons:**
- Massive complexity increase
- Requires skill assessment system
- Over-engineered for current needs

**Why Rejected:** Premature abstraction. Can evolve from quest prerequisites later if needed.

---

## Design Decisions

### Database Schema

Junction table for quest-to-prerequisite relationships:

```sql
CREATE TABLE quest_prerequisites (
  id UUID PRIMARY KEY,
  quest_id UUID NOT NULL REFERENCES quests(id),
  prerequisite_quest_id UUID NOT NULL REFERENCES quests(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(quest_id, prerequisite_quest_id),
  CHECK (quest_id != prerequisite_quest_id)
);
```

### Validation Function

```sql
CREATE FUNCTION can_accept_quest(user_id, quest_id) RETURNS BOOLEAN
-- Returns TRUE if user has completed ALL prerequisites
-- or quest has no prerequisites
```

### UI Behavior

1. **Quest Card:** Show lock icon + "Complete X first" for locked quests
2. **Quest Detail:** List prerequisites with completion status
3. **GM Quest Editor:** Multi-select prerequisite picker with cycle detection

### Circular Dependency Prevention

- Database CHECK constraint prevents self-reference
- Application validates no cycles when adding prerequisites
- Algorithm: DFS from new prerequisite to check if it reaches back to quest

---

## Dependencies

| Relationship | ADR ID | Title | Notes |
|--------------|--------|-------|-------|
| Extends | ADR-008 | Role-Based Access Control | Prerequisites are additional to RBAC |
| Enables | Future | Learning Paths | Can build curated sequences |

---

## References

| Reference ID | Title | Type | Location |
|--------------|-------|------|----------|
| ISSUE-007 | Quest Dependencies | GitHub Issue | #7 |
| SPEC-010 | Quest Prerequisites Schema | Specification | docs/specs/SPEC-010-Quest-Prerequisites.md |

---

## Status History

| Status | Approver | Date |
|--------|----------|------|
| Proposed | Development Team | 2025-01-31 |
| Accepted | Development Team | 2025-01-31 |
