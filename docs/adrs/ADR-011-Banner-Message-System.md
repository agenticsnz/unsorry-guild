# ADR-011: Banner Message System

| Field | Value |
|-------|-------|
| **Decision ID** | ADR-011 |
| **Initiative** | Guild Hall - User Communication |
| **Proposed By** | Development Team |
| **Date** | 2025-01-31 |
| **Status** | Accepted |

---

## WH(Y) Decision Statement

**In the context of** Guild Hall needing to communicate important information to users (announcements, private messages from GMs, automated celebrations),

**facing** the challenge of providing timely, dismissible notifications without overwhelming users or duplicating the existing notification system,

**we decided for** a banner message system with three types (global, private, system) displayed prominently at the top of the dashboard with optional email delivery,

**and neglected** in-app notification center enhancements, email-only communication, and toast notifications,

**to achieve** high-visibility communication that users actively acknowledge while respecting their attention through dismissibility and optional email preferences,

**accepting that** banners take visual prominence and require users to dismiss them, which could be perceived as intrusive for low-priority messages.

---

## Context

Guild Hall currently has a notification system for activity feed events, but lacks:
1. **Global Announcements:** GM ability to post messages visible to all users
2. **Direct Messages:** GM ability to send private messages to specific users
3. **Celebration Moments:** Automatic recognition when users complete quests

**User Stories:**
- "As a GM, I want to announce upcoming events to all guild members"
- "As a GM, I want to send private feedback to a specific user"
- "As a user, I want to feel celebrated when I complete a challenging quest"

---

## Options Considered

### Option 1: Banner System with Email Toggle (Selected)

Prominent banners at dashboard top with optional email delivery.

**Banner Types:**
- **Global:** GM → All users
- **Private:** GM → Specific user
- **System:** Auto-generated (quest completion, etc.)

**Pros:**
- High visibility ensures important messages are seen
- Dismissible respects user attention
- Email option ensures offline users are reached
- Clear distinction between announcement and activity feed

**Cons:**
- Takes visual space
- Requires careful use to avoid banner fatigue

### Option 2: Enhanced Notification Center (Rejected)

Expand existing notification system with priority levels.

**Pros:**
- Single notification system
- Less intrusive

**Cons:**
- Important messages easily missed
- No prominence for announcements
- Requires user to check notification area

**Why Rejected:** Announcements need higher visibility than activity notifications.

### Option 3: Email-Only Communication (Rejected)

Send all announcements and messages via email.

**Pros:**
- Reaches users regardless of app usage
- Familiar communication channel

**Cons:**
- No in-app visibility
- Users may miss or filter emails
- No celebration moments in UI

**Why Rejected:** In-app experience is primary; email should supplement, not replace.

---

## Design Decisions

### Database Schema

```sql
CREATE TABLE banner_messages (
  id UUID PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('global', 'user', 'system')),
  target_user_id UUID REFERENCES users(id),  -- NULL for global
  title TEXT,
  message TEXT NOT NULL,
  variant TEXT DEFAULT 'info' CHECK (variant IN ('info', 'success', 'warning', 'celebration')),
  also_send_email BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,  -- Optional auto-expiry
  reference_type TEXT,     -- For system banners: 'quest_completion', etc.
  reference_id UUID        -- The related entity ID
);

CREATE TABLE banner_dismissals (
  banner_id UUID NOT NULL REFERENCES banner_messages(id),
  user_id UUID NOT NULL REFERENCES users(id),
  dismissed_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (banner_id, user_id)
);
```

### Banner Variants

| Variant | Use Case | Styling |
|---------|----------|---------|
| `info` | Announcements, updates | Blue accent |
| `success` | Positive news, approvals | Green accent |
| `warning` | Important notices, deadlines | Amber accent |
| `celebration` | Quest completions, achievements | Gold with confetti |

### Email Integration

When `also_send_email = TRUE`:
1. Check user's `privacy_settings.email_notifications`
2. If enabled, queue email via Edge Function
3. Record `email_sent_at` timestamp

### System Banner Triggers

| Trigger | Banner Type | Variant |
|---------|-------------|---------|
| All quest objectives approved | Quest completion | `celebration` |
| User reaches new rank | Rank achievement | `celebration` |
| GM sends private message | Private message | `info` |

---

## Dependencies

| Relationship | ADR ID | Title | Notes |
|--------------|--------|-------|-------|
| Extends | - | Email System | Uses same email infrastructure |
| Coexists | - | Notification System | Separate purpose from activity feed |

---

## References

| Reference ID | Title | Type | Location |
|--------------|-------|------|----------|
| SPEC-011 | Banner Messages Schema | Specification | docs/specs/SPEC-011-Banner-Messages.md |

---

## Status History

| Status | Approver | Date |
|--------|----------|------|
| Proposed | Development Team | 2025-01-31 |
| Accepted | Development Team | 2025-01-31 |
