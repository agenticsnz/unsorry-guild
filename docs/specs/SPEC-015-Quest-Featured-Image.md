# SPEC-015: Quest Featured Image

## Overview

Add a featured image capability to quests that displays prominently in the quest detail view, below the Description section and above the Narrative Context.

## Database Schema

### New Column

```sql
ALTER TABLE quests ADD COLUMN IF NOT EXISTS featured_image_url TEXT;
COMMENT ON COLUMN quests.featured_image_url IS 'URL of the featured image displayed in quest detail view';
```

## Storage Configuration

### Storage Path

```
featured-images/{questId}/featured-{timestamp}.{ext}
```

Uses the existing `avatars` bucket (same as quest badges).

### File Limits

- **Maximum size**: 5MB
- **Allowed types**: JPEG, PNG, GIF, WebP

## UI Specifications

### Quest Detail View

- **Location**: Below Description section, above Narrative Context
- **Aspect Ratio**: 16:9 recommended, but smaller images should not be stretched
- **Sizing**: Full width of content area, height auto-adjusts to maintain aspect ratio
- **Container**: Rounded corners, overflow hidden

### GM Quest Edit Form

#### Featured Image Upload

- **Location**: After badge upload section in Basic Information card
- **Component**: `ImageUpload` with `aspectRatio="video"` and `size="lg"`
- **Label**: "Featured Image"
- **Helper text**: "Banner image for quest detail view (16:9 recommended)"

#### Save Button UX Improvements

1. **Duplicate to top**: Add save button after status actions in header
2. **Ghosted when clean**: Button disabled and muted when no unsaved changes
3. **Green when dirty**: Button shows green styling when form has changes
4. **Form ID binding**: Both buttons reference same form via `form="quest-edit-form"`

### GM Quest Create Form

- **Placeholder state**: Disabled area with message "Save the quest first, then edit to add a featured image"
- Featured image upload only available after quest creation (in edit mode)

## Server Actions

### `uploadQuestFeaturedImage(questId: string, formData: FormData)`

- Validates file type and size
- Deletes existing featured images in path `featured-images/${questId}/`
- Uploads new image with timestamp: `featured-images/${questId}/featured-${Date.now()}.${ext}`
- Updates `featured_image_url` column in quests table
- Revalidates quest-related paths

### `removeQuestFeaturedImage(questId: string)`

- Deletes files from `featured-images/${questId}/`
- Sets `featured_image_url` to null
- Revalidates quest-related paths

## Implementation Files

| File | Changes |
|------|---------|
| `supabase/migrations/142_add_quest_featured_image.sql` | Add column |
| `src/lib/types/quest.ts` | Add `featured_image_url` field |
| `src/lib/actions/badge.ts` | Add upload/remove functions |
| `src/components/gm/quest-edit-form.tsx` | Image upload, save button UX |
| `src/components/gm/quest-form.tsx` | Placeholder for create mode |
| `src/components/quests/quest-detail.tsx` | Display featured image |

## Notes

- Uses `object-contain` and `h-auto` CSS so smaller images don't stretch
- Next.js Image component handles optimization
- Reuses same storage bucket and policies as quest badges
