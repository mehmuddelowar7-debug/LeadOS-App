# 06 — Component Map

> A precise inventory of every existing component in LeadOS, its current state, its RecruitOS fate, and what new components need to be built. This is the bridge between the design vision and the engineering plan.

---

## Existing Components: Fate Decisions

### 📦 Features Layer (`src/features/`)

#### `features/dashboard/DashboardView.tsx` ✅ ENHANCE
**What it does:** Shows daily targets, work queue (follow-ups, interviews, recharge pending), End Day button, Quick Capture FAB.
**What works:** The entire structure is correct. Mission targets, work queue, FAB — all valid.
**What to change:**
- Work queue card clicks should navigate to the Kanban view filtered by that type, not just `/contacts`.
- The target labels ("Walk-ins", "Trainings", "Activations") must be renamed to match the 5-stage pipeline ("Interviews", "Recharges", "Joins").
- Gamification imports (`useReferrals`, `useReferralEarnings`) should be removed from this view — not relevant to daily ops.

#### `features/dashboard/EndDaySheet.tsx` ✅ KEEP
**What it does:** A sheet that summarizes the day and triggers a rollover.
**Action:** Keep as-is. Minor label updates only.

#### `features/dashboard/InsightsView.tsx` ⚠️ MERGE INTO ANALYTICS
**What it does:** A productivity insights view — currently shows charts via `useProductivityInsights`.
**Action:** Merge into the enhanced `/analytics` route. Remove as a separate route.

#### `features/dashboard/TargetSettingsSheet.tsx` ✅ KEEP
**What it does:** Allows setting daily targets per user.
**Action:** Keep as-is. Surface it from the Profile page as well.

---

#### `features/contacts/ContactsView.tsx` ✅ ENHANCE
**What it does:** List of all contacts with search, filter chips, virtual scroll, swipe actions.
**What to change:**
- Filter chips: replace role-based filters with pipeline-stage filters.
- Page title: "Network" → "Candidates."
- Contact cards: show pipeline stage badge instead of role badge.

#### `features/contacts/ContactProfileView.tsx` ✅ ENHANCE
**What it does:** Full candidate profile with tabs, pipeline bar, call/WhatsApp actions, interview scheduling, activity timeline.
**What to change:**
- Pipeline stages must be remapped to the 5-stage model.
- "Operations" tab renamed to "Actions."
- Call log should chain to follow-up creation.
- Notes should have their own clearly visible section.

#### `features/contacts/ContactEntryView.tsx` ✅ ENHANCE
**What it does:** Multi-step form for adding a new contact. Has Quick Capture mode.
**What to change:**
- Quick Capture mode should show only 3 fields by default.
- Submit button must always be visible (sticky).
- After save, form resets without navigating away.
- Add source defaulting to "walk_in" for Field BDA context.

#### `features/contacts/AddInterviewSheet.tsx` ✅ KEEP
**Action:** Keep. Minor UX polish.

#### `features/contacts/AddFollowUpSheet.tsx` ✅ KEEP
**Action:** Keep. Minor UX polish.

#### `features/contacts/CallLogSheet.tsx` ✅ KEEP
**Action:** Keep. Add: if outcome is "Call Later", automatically open AddFollowUpSheet.

#### `features/contacts/WhatsAppTemplates.tsx` ✅ KEEP (HIDDEN)
**Action:** Keep. Not surfaced prominently in V1 (no WhatsApp API). Available as a manual helper.

#### `features/contacts/ContactsLayout.tsx` ✅ KEEP
**What it does:** Wrapper layout for the contacts section.
**Action:** No changes.

---

#### `features/analytics/AnalyticsView.tsx` ✅ ENHANCE
**What it does:** Shows basic metrics and CSV export buttons.
**What to change:**
- Add pipeline funnel chart (Lead → Joined conversion).
- Add time-series chart (leads per day).
- Add source breakdown chart.
- Keep CSV export (it's already useful).
- Merge InsightsView content here.

---

#### `features/followups/QueueLayout.tsx` ⚠️ REPURPOSE
**What it does:** A layout shell for Call Queue / WhatsApp Queue / Pending Sync sub-routes. Currently most sub-routes are empty divs.
**Current sub-routes:** /queue/calls, /queue/whatsapp, /queue/pending.
**Action:** The follow-up queue should be accessed from the Dashboard directly (click on "8 Follow-ups Today"). The `/queue` route can be repurposed as a full-page follow-up list, or removed and folded into the Candidates view with a filter. **Remove from main navigation.**

#### `features/followups/DailyPriorityQueueView.tsx` ✅ INTEGRATE INTO KANBAN
**What it does:** Shows a priority-sorted queue of follow-ups.
**Action:** Integrate this view as a "Follow-up Mode" filter in the Kanban or Candidates view. Remove as a standalone route.

---

#### `features/referrals/ReferralDashboardView.tsx` ⚠️ HIDE FROM NAV
**What it does:** Shows referral dashboard with earnings and referral list.
**Action:** Remove from main navigation. Keep accessible from individual candidate profiles. The data and code remain intact.

---

#### `features/incentives/IncentiveTrackerView.tsx` ⚠️ HIDE FROM NAV
**Action:** Remove from main navigation. Keep code intact.

---

#### `features/auth/` ✅ KEEP AS-IS
**LoginView, AuthStore, ProtectedRoute** — all working correctly. No changes.

---

#### `features/profile/ProfileView.tsx` ✅ MINOR ENHANCE
**What to change:** Surface TargetSettingsSheet from here. Add proper navigation structure.

#### `features/profile/BugReportSheet.tsx` ✅ KEEP
**Action:** Keep. Useful for internal QA.

---

#### `features/dev/SetupScreen.tsx` ✅ KEEP
**What it does:** First-run setup/diagnostics screen.
**Action:** Keep. Critical for initial configuration.

#### `features/dev/HealthView.tsx` ✅ KEEP
**Action:** Keep. Good for debugging.

---

### 📦 Components Layer (`src/components/`)

#### `components/layout/AppShell.tsx` ✅ KEEP
#### `components/layout/BottomNav.tsx` ✅ ENHANCE
**What to change:** Update nav items to: Home, Pipeline, Candidates, Marketing, Profile.

#### `components/layout/NavRail.tsx` ✅ ENHANCE
**What to change:** Same nav item updates as BottomNav.

#### `components/layout/Sidebar.tsx` ✅ ENHANCE
**What to change:** Same nav item updates. Rename "LeadOS" to "RecruitOS" in the brand header.

#### `components/layout/navItems.ts` ✅ UPDATE
**Current nav:** Home, Network, Tasks, Referrals, Insights.
**New nav:** Home, Pipeline, Candidates, Marketing, Profile.

#### `components/layout/KeepAliveTabs.tsx` ✅ KEEP
**What it does:** Preserves tab state in memory for smooth navigation. Keep.

#### `components/layout/PWAUpdater.tsx` ✅ KEEP
#### `components/layout/NotFoundRedirect.tsx` ✅ KEEP

---

#### `components/shared/StatusBadge.tsx` ✅ ENHANCE
**What to change:** Status labels must reflect the 5-stage pipeline. Add pipeline stage colors.

#### `components/ui/` ✅ KEEP ALL
All Shadcn UI components stay as-is.

#### `components/providers/NetworkProvider.tsx` ✅ KEEP
#### `components/providers/RouteErrorBoundary.tsx` ✅ KEEP

#### `components/dev/PerformanceProfiler.tsx` ✅ KEEP (DEV ONLY)
#### `components/dev/RouteTracker.tsx` ✅ KEEP (DEV ONLY)

---

### 📦 Hooks Layer (`src/hooks/`)

| Hook | Status | Notes |
|---|---|---|
| `useContactProfile.ts` | ✅ Keep | Loads full profile + activities + opportunity |
| `useContacts.ts` | ✅ Keep | Lists all contacts |
| `useDashboardMetrics.ts` | ✅ Enhance | Update to use new pipeline stage names |
| `useDataQuality.ts` | ✅ Keep | Surfaces data issues in dashboard |
| `useFollowUps.ts` | ✅ Keep | |
| `useInterviews.ts` | ✅ Keep | |
| `useKeyboardShortcuts.ts` | ✅ Keep | Add shortcuts for Kanban navigation |
| `usePerformanceStore.ts` | ✅ Keep (DEV) | Dev tooling only |
| `useProductivityInsights.ts` | ✅ Merge into analytics | |
| `useQueue.ts` | ✅ Repurpose | Power the Kanban column data |
| `useReferralEarnings.ts` | ✅ Keep (hidden) | Keep code, not surfaced in nav |
| `useReferrals.ts` | ✅ Keep (hidden) | Keep code, not surfaced in nav |
| `useRenderProfiler.ts` | ✅ Keep (DEV) | |
| `useSearchStore.ts` | ✅ Keep | Powers global search |

---

### 📦 Lib Layer (`src/lib/`)

| File | Status | Notes |
|---|---|---|
| `analytics.ts` | ✅ Keep | Event tracking |
| `diagnostics.ts` | ✅ Keep | App health checks |
| `endDayEngine.ts` | ✅ Keep | End-of-day rollover logic |
| `export.ts` | ✅ Keep | CSV export utility |
| `logger.ts` | ✅ Keep | Logging |
| `offlineSync.ts` | ✅ Keep | Critical for Field BDA |
| `routes.ts` | ✅ Update | Add new routes |
| `supabase.ts` | ✅ Keep | Client config |
| `useDebounce.ts` | ✅ Keep | Used in search |
| `utils.ts` | ✅ Keep | `cn()` utility |

---

## New Components to Build

### 🆕 `features/pipeline/KanbanView.tsx` [P0]
**Purpose:** Full Kanban board with 5 pipeline stage columns.
**Reuses:**
- `useContacts` hook (data source)
- `StatusBadge` component (stage colors)
- `ContactProfileView` (opens on card click)
- The existing `CandidatePipeline` component from ContactProfileView can be adapted for cards.

### 🆕 `features/pipeline/KanbanColumn.tsx` [P0]
**Purpose:** A single pipeline stage column with candidate cards.

### 🆕 `features/pipeline/KanbanCard.tsx` [P0]
**Purpose:** A candidate card in the Kanban. Compact: Name, Phone, Days in stage, Source icon.

### 🆕 `features/marketing/MarketingView.tsx` [P1]
**Purpose:** Marketing dashboard showing all campaigns.

### 🆕 `features/marketing/CampaignCard.tsx` [P1]
**Purpose:** A single campaign card with key metrics.

### 🆕 `features/marketing/CampaignDetailView.tsx` [P2]
**Purpose:** Full campaign detail with funnel breakdown.

### 🆕 `features/marketing/AddCampaignSheet.tsx` [P1]
**Purpose:** Form to manually add/edit a campaign.

### 🆕 `hooks/usePipeline.ts` [P0]
**Purpose:** Fetch all opportunities grouped by pipeline stage. Powers the Kanban.

### 🆕 `hooks/useCampaigns.ts` [P1]
**Purpose:** Fetch all marketing campaigns.

---

## Component Dependency Map

```
DashboardView
├── useDashboardMetrics
├── useFollowUps
├── useInterviews
├── useContacts (for pending stages)
├── EndDaySheet
└── TargetSettingsSheet

KanbanView [NEW]
├── usePipeline [NEW]
├── KanbanColumn [NEW]
│   └── KanbanCard [NEW]
│       └── StatusBadge
└── ContactProfileView (side panel on desktop)

ContactsView
├── useContacts
└── ContactCard (inline)
    └── swipe actions (call, WhatsApp)

ContactProfileView
├── useContactProfile
├── CandidatePipeline (needs remapping)
├── Timeline (already built)
├── CallLogSheet → AddFollowUpSheet (chained)
├── AddInterviewSheet
└── AddFollowUpSheet

MarketingView [NEW]
├── useCampaigns [NEW]
├── CampaignCard [NEW]
└── AddCampaignSheet [NEW]
```
