# 07 — Design System

> The complete visual language of RecruitOS. Every pixel, every interaction, every animation follows these rules. This document is the single source of truth for design decisions.

---

## Design Philosophy

RecruitOS should feel like **a premium native app, not a web app.**

Three reference points:
1. **Linear** — Density, keyboard-first, fast, dark-first.
2. **Apple** — Precision spacing, intentional typography, no wasted elements.
3. **Arc Browser** — Beautiful without trying too hard. Confident.

Three design sins to avoid:
1. **Generic SaaS look** — Blue buttons, white backgrounds, card-heavy layouts with no hierarchy.
2. **Feature dumping** — Showing 12 options when 2 are needed.
3. **Over-animation** — Animations that slow you down instead of orienting you.

---

## Colors

The existing color system uses `oklch` — this is correct and modern. Preserve it.

### Dark Mode (Primary)

```css
--background: oklch(0.09 0.005 260);   /* Deep dark, near-black with a hint of blue */
--foreground: oklch(0.97 0.002 260);   /* Almost white */
--card: oklch(0.12 0.005 260);         /* Slightly elevated surface */
--muted: oklch(0.16 0.005 260);        /* Muted backgrounds */
--muted-foreground: oklch(0.5 0.02 260); /* Secondary text */
--primary: oklch(0.65 0.2 270);        /* Violet/purple — The brand color */
--border: oklch(0.2 0.005 260);        /* Subtle borders */
```

### Pipeline Stage Colors
These are semantic colors used everywhere in the pipeline. They must be consistent.

| Stage | Color | Hex Approx | Usage |
|---|---|---|---|
| Lead | Blue | `hsl(210, 90%, 60%)` | New, unprocessed leads |
| Interview Scheduled | Violet | `hsl(262, 83%, 65%)` | Active, calendared |
| Selected | Amber | `hsl(38, 95%, 55%)` | High-value, nearly there |
| Recharge | Emerald | `hsl(152, 76%, 45%)` | Payment/commitment stage |
| Joined | Green | `hsl(142, 71%, 45%)` | Success state |
| Lost | Muted | `hsl(220, 10%, 40%)` | Dropped out |

### Accent Usage Rules
- **Red** (`hsl(0, 84%, 60%)`) — Overdue, error, urgent.
- **Amber** (`hsl(38, 92%, 50%)`) — Warning, needs attention.
- **Emerald** (`hsl(152, 76%, 45%)`) — Success, positive outcome.
- **Violet/Primary** — The brand. Actions, active states, CTAs.

---

## Typography

**Font:** Geist Variable (already set up via `@fontsource-variable/geist`).
**Do not change the font.** It's a world-class typeface for interfaces.

### Type Scale

| Role | Size | Weight | Usage |
|---|---|---|---|
| Display | 32px / 2rem | 900 | Page titles (e.g., "Candidates") |
| Heading 1 | 24px / 1.5rem | 800 | Section headings, modal titles |
| Heading 2 | 18px / 1.125rem | 700 | Card headings, sub-sections |
| Body | 15px / 0.9375rem | 500 | Default body text |
| Small | 13px / 0.8125rem | 500 | Secondary info, metadata |
| Caption | 11px / 0.6875rem | 600 | Tags, badges, timestamps |
| Micro | 9-10px / 0.625rem | 700 | Labels in tight spaces, progress bars |

### Typographic Rules
- **Tracking:** Tight on large text (`tracking-tight` to `tracking-tighter`). Normal on body.
- **Line height:** Tight for headings (1.1-1.2). Relaxed for body (1.5-1.6).
- **Uppercase:** Used sparingly for labels and section headers. Always `tracking-wider` when uppercase.
- **Never use more than 3 type sizes on a single card.**

---

## Spacing

**Base unit:** 4px.
**Scale:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.

### Spacing Rules
- Card internal padding: `p-4` (16px) on mobile, `p-5` (20px) on desktop.
- Section gaps: `gap-6` (24px) between major sections.
- Component gaps: `gap-3` or `gap-4` within a component.
- Page horizontal padding: `px-4` mobile, `px-6` md, `px-8` lg.

### Touch Targets
- **Minimum touch target:** 44px × 44px. Use `h-12 w-12` (48px) as the standard.
- **Large touch targets** for primary actions: `h-14` (56px) or `h-16` (64px).
- The `.touch-target` class already exists in `index.css`. Use it everywhere.

---

## Border Radius

The project already uses a comprehensive radius scale. Keep it.

```
sm   = 6px   — Tiny chips, small badges
md   = 8px   — Buttons, small cards
lg   = 12px  — Standard cards
xl   = 14px  — Larger cards
2xl  = 18px  — Hero cards, panels
3xl  = 22px  — Full-screen panels, modals
4xl  = 26px  — Very large panels
```

**Rule:** Consistent radius within a screen. Don't mix `rounded-xl` and `rounded-sm` on the same card.

---

## Elevation & Depth

RecruitOS uses two depth systems:

### 1. Glass Cards (`.glass-card`)
Already defined in CSS. Use for primary content cards.
```css
/* Existing definition — keep */
.glass-card {
  backdrop-filter: blur(8px);
  border: 1px solid hsl(var(--border)/0.5);
  background: hsl(var(--card)/0.8);
}
```

### 2. Elevation Shadows
- **Level 0:** No shadow (muted backgrounds, chips).
- **Level 1:** `shadow-sm` — Standard cards.
- **Level 2:** `shadow-md` — Elevated panels, dropdowns.
- **Level 3:** `shadow-xl shadow-primary/20` — CTAs, FABs, primary actions.

---

## Motion & Animation

**Philosophy:** Animate to orient, not to entertain.

### Timing
- **Micro-interactions:** 100-150ms. Hover effects, button presses.
- **Component transitions:** 200-250ms. Sheets appearing, tabs switching.
- **Page transitions:** 300ms max.

### Spring Physics (framer-motion)
```ts
// Standard spring — feels snappy, not bouncy
{ type: 'spring', stiffness: 400, damping: 40 }

// Gentle spring — for larger panels
{ type: 'spring', stiffness: 300, damping: 30 }
```

### Specific Animations

**Card press:** `active:scale-[0.98]` or `active:scale-95`. Already applied to most interactive elements. Keep.

**FAB:** `whileTap={{ scale: 0.95 }}`. Already applied. Keep.

**Sheets/Modals:** Slide up from bottom on mobile, fade+scale on desktop. Framer-motion `AnimatePresence`.

**List items:** Staggered fade-in when first loading. `transition={{ delay: i * 0.05 }}`. Already in Timeline component. Keep.

**Loading:** Skeleton pulse animation. Use Tailwind's `animate-pulse`. Already in use. Keep.

### What NOT to animate
- Routing transitions (they make the app feel slower on slow devices).
- Icons on hover (distracting).
- Progress bar fills on load (unless it's the initial load).

---

## Icons

**Library:** Lucide React (already installed). Do not add another icon library.

### Icon Sizing
- Navigation icons: `h-5 w-5` (20px).
- Card icons: `h-4 w-4` (16px) to `h-5 w-5` (20px).
- Action icons in buttons: `h-4 w-4` (16px).
- Large display icons: `h-8 w-8` to `h-12 w-12`.

### Icon with Stroke Weight
- Active/selected states: `stroke-[2.5px]`.
- Default: default Lucide stroke (2px).

---

## Component Patterns

### Primary CTA Button
```
h-14, rounded-2xl, bg-primary, text-primary-foreground
font-bold text-base, shadow-xl shadow-primary/20
hover: scale-[1.01], active: scale-[0.98]
```

### Secondary Button
```
h-12, rounded-2xl, bg-muted, text-foreground
font-semibold text-sm
hover: bg-accent
```

### Chip / Filter
```
h-12, px-5, rounded-2xl
font-bold text-sm uppercase tracking-wider
Active: bg-foreground text-background (for "All")
Active: bg-primary/10 text-primary border-primary (for specific filters)
Inactive: bg-muted/50 text-muted-foreground
```

### Input Field
```
h-14, rounded-2xl
bg-muted/50 border-transparent
focus: bg-background, border-primary/50
font-medium text-base
```

### Toast Notifications
Use Sonner (already installed). Position: `top-center`. Use `richColors`.
- Success: Green.
- Error: Red.
- Info: Primary (violet).
- Warning: Amber.

### Section Headers
```
text-sm font-bold uppercase tracking-wider
text-muted-foreground or text-foreground
flex items-center gap-2 (with icon)
```

---

## Grid System

**Mobile:** 4-column grid, 16px gutter.
**Tablet (md):** 8-column grid, 24px gutter.
**Desktop (lg/xl):** 12-column grid, 32px gutter.

### Standard Layouts

**Single column (mobile):** Full width, stacked.
**Two column (tablet+):** `grid-cols-2 gap-4`.
**Three column (desktop):** `grid-cols-3 gap-4`.
**Kanban (desktop):** `grid-cols-5` — one column per pipeline stage.

---

## Dark / Light Mode Strategy

**Default:** Dark mode.
**Toggle:** Available in Profile / Settings.
**Dark is the "native" mode** — designs are done in dark mode first.

### Dark mode critical rules
- Never use pure black `#000000` for backgrounds. Use the dark oklch values.
- Borders should be subtle (`border/50` or lower opacity).
- Cards are only slightly elevated from the background (1-2 lightness steps in oklch).

---

## Responsive Breakpoints

Use Tailwind defaults:
- `sm` — 640px
- `md` — 768px
- `lg` — 1024px
- `xl` — 1280px

### Layout Breakpoints
- Mobile-first: Up to `md`. Single column, bottom nav, full-screen views.
- Desktop: `lg` and above. Sidebar navigation, master-detail layout, Kanban columns.

---

## Empty States

Every screen must have a designed empty state. Rules:
1. Large icon (at least `h-16 w-16`) in a muted container.
2. Clear heading: what's missing.
3. One sentence of context.
4. One clear CTA (when applicable).

Example:
```
[ 🔍 icon in muted rounded square ]
"No candidates found"
"Try adjusting your search or add a new candidate."
[ Quick Capture button ]
```

---

## Error States

1. Minimal. Don't scare the user.
2. Always provide a recovery action (Retry / Reload / Go Back).
3. Never show raw error messages or stack traces to end users.

---

## Naming Conventions for Developers

- Component files: PascalCase + feature prefix (e.g., `KanbanView.tsx`, `CampaignCard.tsx`)
- Hook files: camelCase with `use` prefix (e.g., `usePipeline.ts`)
- CSS class names: Follow Tailwind conventions
- TypeScript types: PascalCase, exported from `src/types/index.ts`
- Enum constants: SCREAMING_SNAKE_CASE (e.g., `PIPELINE_STAGES`)
- Route constants: Add to `src/lib/routes.ts` ROUTES object

---

## The One Rule

> If a design element doesn't make the app faster or clearer for the user, remove it.

Every border, every shadow, every animation, every label exists to serve the user's understanding of the content. Nothing exists for decoration alone.
