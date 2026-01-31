# Mobile Review Flow Analysis - WAXFEED

## Critical Finding: Users Not Completing Reviews on Mobile

**Reported Issue:** Users are "reviewing albums" but reviews aren't being recorded, no wax is earned.

## Root Cause Identified

### Quick Rate Flow (`/quick-rate`) Requires 3 Vibes
The Quick Rate page (`src/app/quick-rate/page.tsx`) enforces a minimum of **3 descriptors (vibes)** before the "Rate" button is enabled.

```typescript
const MIN_DESCRIPTORS = 3
const MAX_DESCRIPTORS = 5
const canSubmit = selectedDescriptors.length >= MIN_DESCRIPTORS
```

**Button behavior:**
- When `canSubmit` is false: Button shows `"+3 vibes"` or `"+2 vibes"` (disabled, grayed out)
- When `canSubmit` is true: Button shows `"Rate"` (enabled, accent color)

### UX Problem
Users may:
1. Navigate to Quick Rate
2. Select a rating using the slider
3. NOT select 3 vibes (they may not understand this is required)
4. See a disabled button saying "+3 vibes" 
5. Think the app is broken
6. Leave without their review being saved

### API Validation
The review API (`src/app/api/reviews/route.ts`) also validates this:
```typescript
if (isQuickRate && (!vibes || vibes.length < 3)) {
  return errorResponse('Quick rate requires at least 3 descriptors for TasteID accuracy', 400)
}
```

## Two Rating Paths

### 1. Album Page Review (`/album/[id]`)
- Full review form with optional vibes
- For first 100 reviews: requires 20+ character text (First Spin eligibility)
- After first 100: text is optional
- No vibe requirement
- Awards 1 wax per review

### 2. Quick Rate (`/quick-rate` and `/discover/swipe`)
- Requires 3-5 vibes/descriptors
- No text required
- Awards 1 wax per rating
- Intended for building TasteID quickly

## Component Architecture

| Component | Path | Mobile Issues |
|-----------|------|--------------|
| `RatingSlider` | `src/components/rating-slider.tsx` | Uses `onMouseDown`/`onMouseUp` but HTML range input works with touch natively |
| `AlbumReviewForm` | `src/app/album/[id]/review-form.tsx` | Standard form, works on mobile |
| `QuickRatePage` | `src/app/quick-rate/page.tsx` | **Vibe requirement may confuse users** |
| `SwipePage` | `src/app/discover/swipe/page.tsx` | Same vibe requirement |

## Polarity Descriptors (31 vibes)
The quick rate system uses 31 descriptors across 8 dimensions:
- Arousal: EXPLOSIVE, DRIVING, SIMMERING, SUBDUED
- Valence: EUPHORIC, TRIUMPHANT, MELANCHOLIC, DARK, ANXIOUS
- Texture: LUSH, SPARSE, GRITTY, CRYSTALLINE
- Temporal: HYPNOTIC, CHAOTIC, GROOVY, FLOATING
- Novelty: AVANT-GARDE, NOSTALGIC, FUTURISTIC, TIMELESS
- Scale: EPIC, INTIMATE, VISCERAL, ETHEREAL
- Authenticity: RAW, POLISHED, SOULFUL
- Narrative: CINEMATIC, ABSTRACT, CONFESSIONAL

## Recommended Fixes

### Option A: Better Visual Feedback
- Make the vibe requirement MORE prominent
- Show a clear progress indicator: "Select 3 vibes to continue"
- Animate/highlight the vibe section when user tries to submit without enough

### Option B: Reduce Friction (Lower Requirements)
- Consider reducing minimum vibes from 3 to 1 or 2
- OR make vibes optional with a "skip vibes" option

### Option C: Different Mobile Flow
- Create a simplified mobile flow with fewer steps
- Swipe-style rating without vibes for casual users

## Marketing & Docs Context
- `docs/WAXFEED_ONBOARDING_IMPLEMENTATION-1.md`: Detailed onboarding spec
- `docs/research/QUICK-REFERENCE.md`: TasteID and Polarity system documentation
- `marketing/decks/`: Pitch decks for investors and college radio

## Key File Paths
- Review API: `src/app/api/reviews/route.ts`
- Quick Rate: `src/app/quick-rate/page.tsx`
- Album Review Form: `src/app/album/[id]/review-form.tsx`
- Rating Slider: `src/components/rating-slider.tsx`
- TasteID Tiers: `src/lib/tasteid-tiers.ts`

---
*Analysis Date: January 2026*
