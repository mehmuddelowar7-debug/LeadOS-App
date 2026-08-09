# 04 — Screen Map

> A complete inventory of every screen, its purpose, who uses it, what it contains, what happens in each state, and how it behaves on mobile vs desktop.

---

## Navigation Structure

```
RecruitOS
│
├── /           → Dashboard (Home)
├── /pipeline   → Kanban Pipeline [NEW]
├── /contacts   → Candidate List
│   └── /contacts/:id → Candidate Profile
├── /capture    → Quick Capture Form [ENHANCE]
├── /marketing  → Marketing Dashboard [NEW]
│   └── /marketing/:campaignId → Campaign Detail [NEW]
├── /analytics  → Reports & Analytics [ENHANCE]
├── /profile    → User Profile & Settings
└── /queue      → Follow-up Queue [ENHANCE]
```

**Navigation bar items (bottom bar on mobile, sidebar on desktop):**
1. 🏠 Home
2. 📋 Pipeline ← *New*
3. 👥 Candidates
4. 📣 Marketing ← *New*
5. 👤 Profile

> **Killed routes:** `/referrals` (moved to a tab inside Contact Profile), `/incentives` (hidden, preserved in DB), `/insights` (merged into `/analytics`), `/queue` (surfaced from Dashboard as a filtered view of Contacts)

---

## Screen 1: Dashboard (/)

**Purpose:** "What do I need to do RIGHT NOW?"
**Users:** Founder, Office BDA
**Not for:** Field BDA (they should land on Quick Capture)

### Content (Priority Order)
1. **Today's Mission** — Shows progress toward daily targets
   - Leads (x / target)
   - Calls (x / target)  
   - Interviews (x / target)
   - Joins (x / target)
2. **Work Queue** — Actionable items that need attention today
   - Overdue follow-ups (red, urgent)
   - Today's follow-ups (blue)
   - Today's interviews (purple)
   - Missed interviews (amber, needs rescheduling)
   - Recharge pending (emerald)
3. **Quick Actions:**
   - Quick Capture FAB (large, always visible)
   - End Day button

### States
- **Loading:** Skeleton cards (already implemented).
- **Empty Queue:** "Queue is clear! You're all caught up." ✓ (already exists)
- **Error:** "Unable to load metrics. Pull to refresh."
- **First time:** Onboarding prompt — "Add your first candidate to get started."

### Mobile
- Cards stack vertically.
- FAB spans full width at the bottom.
- Work Queue cards are horizontally swipeable.

### Desktop
- Two-column layout: Mission targets (left) + Work Queue (right).
- FAB becomes a top-right button "Quick Capture."

### Future Improvements
- Daily streak indicator.
- Pipeline health score (% of leads moving within 48h).
- One-sentence AI summary: "3 follow-ups overdue. 2 interviews today. You're on track."

---

## Screen 2: Pipeline / Kanban (/pipeline) [NEW]

**Purpose:** "Where is everyone right now?"
**Users:** Founder, Office BDA
**Not for:** Field BDA

### Content
- 5 columns representing the 5 pipeline stages:
  - **Lead** → **Interview Scheduled** → **Selected** → **Recharge** → **Joined**
- Each column shows:
  - Count badge (e.g., "12 Leads")
  - Candidate cards (Name + Phone + Days in stage)
- Additional implicit columns (not shown by default but filterable):
  - **Lost** — Dropped-out candidates (hidden by default, shown via filter)

### Candidate Cards in Kanban
- Name (bold)
- Phone (dimmed)
- Days in this stage (e.g., "Day 3") — color-coded red if too long
- Source icon (Instagram logo, Walk-in icon)

### Interactions
- **Drag & drop** (desktop): Move card from one column to another. Triggers pipeline progression modal if needed.
- **Click card** → Opens candidate profile as a side panel (desktop) or navigates to profile (mobile).
- **Column overflow:** If a column has more than 10 cards, show "See all 23" button.

### Filters (top bar)
- Assigned to: All / Me / [Name]
- Source: All / Instagram / Facebook / Walk-in / Referral
- Time range: Today / This week / This month / All time

### States
- **Empty column:** Dashed border with label. No alarm.
- **Error:** Retry button.
- **Loading:** Column skeleton (no flash).

### Mobile
- Horizontal scroll between columns (swipe left/right to navigate stages).
- Column header is sticky.
- Tap a card to open profile fullscreen.

### Desktop
- All 5 columns visible simultaneously.
- Side panel opens when clicking a card — profile loads inline.
- Keyboard shortcut: `K` to focus Kanban, arrow keys to navigate cards.

### Challenge to the Idea
> The founder asks for Kanban. But there's already a pipeline display inside `ContactProfileView.tsx` (lines 122-212). Instead of building a full standalone Kanban from scratch, we should first enhance the existing pipeline component to work in a board view. This reuses 70%+ of the existing logic.

---

## Screen 3: Candidate List (/contacts)

**Purpose:** "Find a specific candidate or browse all candidates."
**Users:** All
**Existing:** Highly functional. Already has search, filter chips, virtual scroll, swipe actions.

### What Exists (Keep)
- Virtualized list with @tanstack/react-virtual ✓
- Search bar with 300ms debounce ✓
- Role filter chips ✓
- Swipe-right-to-call, swipe-left-to-WhatsApp ✓
- Bulk select mode ✓

### What Needs Changing
- **Filter chips should filter by PIPELINE STAGE, not by contact role.** The current filter by "opportunity", "referral_partner" etc. maps to a CRM model, not a recruitment pipeline.
  - New filters: Lead / Interview Scheduled / Selected / Recharge / Joined / Lost
- **The page title "Network" should become "Candidates."** This is a recruitment OS, not a social network CRM.
- **Candidate cards should show pipeline stage** instead of contact role badges.

### States
- Loading: Skeleton (already exists) ✓
- Empty: Custom empty state with Quick Capture CTA ✓
- Search empty: "No candidates found" ✓
- Error: "Failed to load candidates. Tap to retry."

---

## Screen 4: Candidate Profile (/contacts/:id)

**Purpose:** "Everything about one candidate."
**Users:** Founder, Office BDA
**Existing:** Very solid. 654 lines. Already has tabs, timeline, pipeline, call/WhatsApp/Interview/Follow-up sheets.

### What Exists (Keep)
- Pipeline status bar at the top ✓
- Tab navigation: Profile / History / Operations ✓
- Call/WhatsApp quick actions ✓
- Activity timeline ✓
- Interview scheduling sheet ✓
- Follow-up sheet ✓

### What Needs Changing
- **Pipeline stages must match exactly:** The current `PIPELINE_STAGES` in ContactProfileView.tsx (line 123-130) maps to old status labels ("new", "interested", "registration", etc.). These must be remapped to the exact 5-stage pipeline: Lead → Interview Scheduled → Selected → Recharge → Joined.
- **"Operations" tab** needs to be surfaced as "Notes & Actions" — more descriptive.
- **The call log sheet should auto-advance to "Set Follow-up"** if the outcome is "Call Later."
- **Notes need their own visible section** — not buried in Operations.

### Fields (Profile Tab)
- Name, Phone, WhatsApp
- Age, Gender
- Area / Location
- Source (with campaign attribution if available)
- Interest level
- Education, English level, Experience
- Parents support, Husband support
- Has smartphone / internet
- Notes (free text)

### Desktop Behavior
- Opens as a right-side panel beside the Candidate List (master-detail layout).
- Never navigates away from the list on desktop.

### Mobile Behavior
- Full-screen page. Back button returns to list.

---

## Screen 5: Quick Capture Form (/capture)

**Purpose:** "Add a lead in under 30 seconds."
**Users:** Field BDA (primarily), anyone who needs to add a lead fast.
**Existing:** Already exists at `/capture` route pointing to `ContactEntryView.tsx`.

### What Exists (Keep)
- Form with Name, Phone, Area fields ✓
- Duplicate detection ✓
- Offline push via `pushToMutationQueue` ✓
- TouchCardSelect for source selection ✓

### What Needs Changing
- **The form has too many optional fields visible by default.** Field BDAs should see: Name → Phone → Area → Source. Nothing else unless they tap "Add more details."
- **The submit button must be visible at all times** without scrolling. Currently, if the phone's keyboard is open, the Save button might be covered.
- **After saving, the form should IMMEDIATELY reset** and show "Lead saved ✓ | Tap to view" — not navigate away. The BDA may need to capture another lead in 30 seconds.
- **Source selection should default to "Walk-in"** for Field BDAs.

### States
- **Default:** 3 fields visible, big save button.
- **Duplicate detected:** Warning banner, 3 options.
- **Saving:** Button shows spinner, fields are frozen.
- **Saved:** Toast confirmation, form resets.
- **Offline:** No change in UX. Toast: "Saved offline. Will sync when connected."

### Mobile
- Full-screen form. Keyboard pushes up, button stays visible (fixed positioning).

### Desktop
- Modal overlay or dedicated panel.

---

## Screen 6: Marketing Dashboard (/marketing) [NEW]

**Purpose:** "Is my money working? Which campaign is winning?"
**Users:** Founder only
**Not for:** Field BDA, Office BDA

### Content
- **Campaign List:** All active campaigns with key metrics
  - Campaign name + platform icon (Insta, FB)
  - Spend
  - Leads generated
  - CPL (cost per lead)
  - Interview rate (leads → interviews %)
  - Join rate (leads → joined %)
- **Summary bar:** Total Spend, Total Leads, Blended CPL
- **Platform breakdown:** Instagram vs Facebook vs Organic breakdown
- **Top performing creative** (V2: when creative-level tracking is added)

### Campaign Detail (/marketing/:campaignId)
- All ads in the campaign
- Per-ad performance
- Full funnel for this campaign: Leads → Interviews → Selected → Recharge → Joined

### V1 Behavior (Manual Entry)
- Founder manually enters campaign data: name, platform, spend, reach, leads.
- System computes: CPL, conversion rates from the pipeline.

### V2 Behavior (API Integration)
- Meta Ads API feeds data automatically.
- System cross-references with actual candidates in the pipeline.

### States
- **No campaigns:** "Add your first campaign to start tracking ROI."
- **Loading:** Skeleton.
- **Zero spend on a campaign:** Warning badge.

---

## Screen 7: Analytics / Reports (/analytics)

**Purpose:** "How did we perform over time?"
**Users:** Founder
**Existing:** Exists. Currently shows basic metrics and CSV export buttons.

### What Exists (Keep)
- CSV export for daily, weekly, monthly reports ✓
- Total contacts / active contacts display ✓

### What Needs Adding
- **Funnel visualization:** Lead → Interview → Selected → Recharge → Joined (conversion % at each step).
- **Time-series chart:** Leads added per day over the past 30 days.
- **Source breakdown:** Pie/bar chart showing where leads come from.
- **Report filters:** Date range, source, assigned BDA.

---

## Screen 8: User Profile & Settings (/profile)

**Purpose:** "Manage your account, set targets, and configure preferences."
**Users:** All

### Content
- Profile: Name, Avatar, Phone
- Daily Targets (already exists in TargetSettingsSheet.tsx — surface this here too)
- Notifications: On/Off
- Theme: Dark / Light
- Bug Report (already exists in `BugReportSheet.tsx`)
- Sign Out

---

## Screen Summary Table

| Screen | Route | Existing? | Status | Priority |
|---|---|---|---|---|
| Dashboard | / | ✓ Yes | Enhance | P0 |
| Kanban Pipeline | /pipeline | ✗ No | Build | P0 |
| Candidate List | /contacts | ✓ Yes | Enhance | P0 |
| Candidate Profile | /contacts/:id | ✓ Yes | Enhance | P0 |
| Quick Capture | /capture | ✓ Yes | Enhance | P0 |
| Marketing Dashboard | /marketing | ✗ No | Build | P1 |
| Campaign Detail | /marketing/:id | ✗ No | Build | P2 |
| Analytics / Reports | /analytics | ✓ Partial | Enhance | P1 |
| Profile / Settings | /profile | ✓ Yes | Minor polish | P2 |
