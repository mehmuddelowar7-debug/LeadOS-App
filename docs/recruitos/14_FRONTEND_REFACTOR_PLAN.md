# 14 — Frontend Refactor Plan

> A precise, file-by-file plan for every frontend change required to transform LeadOS into RecruitOS V1. No code is deleted without a reason. Every change is explained.

---

## Guiding Principle

> Before refactoring any component, search the codebase for all places it is used. A refactor that breaks an import chain creates debugging time that defeats the purpose of speed.

---

## File 1: `src/lib/routes.ts`

**Change type:** Update + Add
**Risk:** Low

```diff
export const ROUTES = {
  HOME: "/",
  AUTH: "/auth",
  CONTACTS: "/contacts",
  CONTACT_DETAILS: "/contacts/:id",
  CONTACTS_NEW: "/contacts/new",
  QUICK_CAPTURE: "/capture",
- REFERRALS: "/referrals",
- INSIGHTS: "/insights",
+ PIPELINE: "/pipeline",
+ MARKETING: "/marketing",
+ MARKETING_DETAIL: "/marketing/:id",
  PROFILE: "/profile",
  SETTINGS: "/settings",
  ANALYTICS: "/analytics",
- INCENTIVES: "/incentives",
- QUEUE: "/queue",
- QUEUE_CALLS: "/queue/calls",
- QUEUE_WHATSAPP: "/queue/whatsapp",
- QUEUE_PENDING: "/queue/pending",
  HEALTH: "/health"
} as const;
```

**Note:** We are NOT deleting the route handlers from App.tsx immediately — just removing them from the ROUTES constant and from navigation. The actual route components can remain for a period to avoid 404s for users who bookmarked those paths. Add a redirect from old routes to new routes after Phase 0 is stable.

---

## File 2: `src/components/layout/navItems.ts`

**Change type:** Complete rewrite of the array
**Risk:** Very Low

```typescript
// BEFORE
export const NAV_ITEMS = [
  { path: ROUTES.HOME, label: 'Home', icon: LayoutDashboard },
  { path: ROUTES.CONTACTS, label: 'Network', icon: Users },
  { path: ROUTES.QUEUE, label: 'Tasks', icon: Clock },
  { path: ROUTES.REFERRALS, label: 'Referrals', icon: Award },
  { path: ROUTES.INSIGHTS, label: 'Insights', icon: LineChart },
]

// AFTER
import { LayoutDashboard, Users, Kanban, Megaphone, User } from 'lucide-react'

export const NAV_ITEMS = [
  { path: ROUTES.HOME, label: 'Home', icon: LayoutDashboard },
  { path: ROUTES.PIPELINE, label: 'Pipeline', icon: Kanban },
  { path: ROUTES.CONTACTS, label: 'Candidates', icon: Users },
  { path: ROUTES.MARKETING, label: 'Marketing', icon: Megaphone },
  { path: ROUTES.PROFILE, label: 'Profile', icon: User },
]
```

---

## File 3: `src/components/layout/Sidebar.tsx`

**Change type:** Update brand name + sync nav
**Risk:** Very Low

- Line 17: Change `<h1>LeadOS</h1>` → `<h1>RecruitOS</h1>`
- Sidebar already maps from `NAV_ITEMS` — nav change in File 2 flows here automatically.
- Update "New Contact" button to "Quick Capture" or "Add Lead" to align with new terminology.

---

## File 4: `src/App.tsx`

**Change type:** Add new routes, remove dead routes from render
**Risk:** Low

```diff
// Remove from lazy imports:
- const IncentiveTrackerView = lazy(...)

// Add new lazy imports:
+ const KanbanView = lazy(() => import("@/features/pipeline/KanbanView").then(m => ({ default: m.KanbanView })))
+ const MarketingView = lazy(() => import("@/features/marketing/MarketingView").then(m => ({ default: m.MarketingView })))

// Update routes inside <KeepAliveTabs>:
+ <Route path={ROUTES.PIPELINE} element={<KanbanView />} />
+ <Route path={ROUTES.MARKETING} element={<MarketingView />} />
- <Route path={ROUTES.INCENTIVES} element={<IncentiveTrackerView />} />
// Keep /referrals, /queue, /insights as redirects to home temporarily
+ <Route path="/referrals" element={<NotFoundRedirect />} />
+ <Route path="/insights" element={<Navigate to={ROUTES.ANALYTICS} replace />} />
```

---

## File 5: `src/types/index.ts`

**Change type:** Update enum arrays and label maps
**Risk:** Medium — Many files import from here. Run `grep -r "OPPORTUNITY_STATUSES"` before changing.

```typescript
// BEFORE
export const OPPORTUNITY_STATUSES = [
  'new', 'interested', 'registration', 'recharge_pending',
  'recharge_completed', 'training', 'completed', 'activated', 'consulting', 'lost'
] as const

// AFTER — 5 stages + 1 exit
export const PIPELINE_STAGES = [
  'lead', 'interview_scheduled', 'selected', 'recharge', 'joined'
] as const
export type PipelineStage = typeof PIPELINE_STAGES[number]

export const OPPORTUNITY_STATUSES = [
  ...PIPELINE_STAGES, 'lost'
] as const  // Keep OPPORTUNITY_STATUSES for backward compat

export const PIPELINE_STAGE_LABELS: Record<string, string> = {
  lead: 'Lead',
  interview_scheduled: 'Interview Scheduled',
  selected: 'Selected',
  recharge: 'Recharge',
  joined: 'Joined',
  lost: 'Lost',
}

export const PIPELINE_STAGE_COLORS: Record<string, string> = {
  lead: 'hsl(210, 90%, 60%)',            // Blue
  interview_scheduled: 'hsl(262, 83%, 65%)', // Violet
  selected: 'hsl(38, 95%, 55%)',         // Amber
  recharge: 'hsl(152, 76%, 45%)',        // Emerald
  joined: 'hsl(142, 71%, 45%)',          // Green
  lost: 'hsl(220, 10%, 40%)',            // Muted
}
```

**Also update:**
- `CONTACT_SOURCES`: Add 'meta_lead_form' as a source type.
- Keep all other enums unchanged.

---

## File 6: `src/features/contacts/ContactsView.tsx`

**Change type:** Update title, filter chips, card badges
**Risk:** Low — contained within this component

**Changes:**
1. `<h1>Network</h1>` → `<h1>Candidates</h1>`
2. Filter chips: Replace role-based with pipeline-stage based
3. `filteredContacts`: Filter by `opportunity?.status` instead of `contact.roles`
4. Contact cards: Show pipeline stage badge instead of role chip

**Hook dependency:** `useContacts` must return opportunity status with each contact. Check if it already does via a join. If not, update `useContacts.ts` to join with opportunities.

---

## File 7: `src/features/contacts/ContactProfileView.tsx`

**Change type:** Remap pipeline stages, rename tabs, chain actions
**Risk:** Medium — this is the largest and most complex file

**Specific changes:**

### Pipeline stages (lines 123-130):
```typescript
// BEFORE
const PIPELINE_STAGES = [
  { id: 'new', label: 'Lead', nextStatus: 'interested' },
  { id: 'interested', label: 'Contacted', nextStatus: 'registration' },
  { id: 'interview', label: 'Interview', action: 'open_interview' },
  { id: 'recharge_pending', label: 'Recharge', nextStatus: 'recharge_completed' },
  { id: 'recharge_completed', label: 'Training', nextStatus: 'training' },
  { id: 'training', label: 'Activated', nextStatus: 'activated' }
]

// AFTER — exact 5-stage pipeline
const PIPELINE_STAGES = [
  { id: 'lead', label: 'Lead', nextStatus: 'interview_scheduled' },
  { id: 'interview_scheduled', label: 'Interview', action: 'open_interview' },
  { id: 'selected', label: 'Selected', nextStatus: 'recharge' },
  { id: 'recharge', label: 'Recharge', nextStatus: 'joined' },
  { id: 'joined', label: 'Joined', nextStatus: null },
]
```

### Tab names (line 217):
```typescript
// BEFORE
const TABS = ['Profile', 'History', 'Operations'] as const

// AFTER
const TABS = ['Profile', 'Timeline', 'Actions'] as const
```

### Call log chaining (in CallLogSheet.tsx invocation):
- After closing CallLogSheet with outcome "call_later" → auto-open `AddFollowUpSheet`.
- This can be done via an `onOutcome` callback prop.

### Notes section:
- Add a "Notes" section prominently in the Profile tab (not buried in Actions/Operations).
- Display existing notes from `contact.notes`.
- Add a "Edit Note" button.

---

## File 8: `src/features/contacts/ContactEntryView.tsx`

**Change type:** Quick Capture UX overhaul
**Risk:** Medium — core field capture flow

**Changes:**
1. In Quick Capture mode (when `?mode=quick` is in URL):
   - Show only: Name, Phone, Area, Source
   - Hide all other fields behind an "Add more details" disclosure
2. Make Save button `position: fixed; bottom: env(safe-area-inset-bottom, 16px)`
3. After successful save: reset form (call `reset()` from react-hook-form), show toast
4. Change navigation on save: Stay on form instead of navigating to profile
5. Add campaign selector (optional): dropdown of active campaigns
6. Default source to 'walk_in' unless URL param says otherwise

---

## File 9: `src/features/dashboard/DashboardView.tsx`

**Change type:** Update target labels, update work queue links
**Risk:** Low

**Changes:**
1. Rename target labels in the mission grid:
   - "Walk-ins" → "Interviews"
   - "Trainings" → Remove or merge
   - "Activations" → "Joins"
2. Update work queue card onClick handlers to use new routes:
   - Follow-ups → `/contacts?filter=follow_up_today`
   - Interviews → `/pipeline?filter=interview`
   - Recharge Pending → `/pipeline?stage=recharge`
3. Remove `useReferrals()` and `useReferralEarnings()` imports from dashboard (referrals are hidden from nav)

---

## File 10: `src/components/shared/StatusBadge.tsx`

**Change type:** Add new stage colors, update label mapping
**Risk:** Low

- Map new stage IDs to their display labels and colors.
- Keep old status mappings for backward compatibility during migration.
- After Migration 002 is applied, old status values should be unreachable.

---

## File 11: `src/features/analytics/AnalyticsView.tsx`

**Change type:** Enhance with pipeline funnel and source breakdown
**Risk:** Low — additive changes only

**Additions:**
1. Fetch pipeline stage counts from Supabase (GROUP BY status).
2. Render a visual funnel (can be done with simple div width percentages — no chart library needed).
3. Fetch contact source breakdown (GROUP BY source).
4. Render as a horizontal bar chart (CSS only — no library).

---

## New Files to Create

### `src/features/pipeline/KanbanView.tsx`
**Purpose:** Main Kanban Board component.
**Dependencies:** `usePipeline`, `KanbanColumn`, `KanbanCard`.
**See:** `06_COMPONENT_MAP.md` for full dependency tree.

### `src/features/pipeline/KanbanColumn.tsx`
**Purpose:** Single stage column.

### `src/features/pipeline/KanbanCard.tsx`
**Purpose:** Candidate card in Kanban.

### `src/features/marketing/MarketingView.tsx`
**Purpose:** Marketing campaign dashboard.

### `src/features/marketing/CampaignCard.tsx`
**Purpose:** Campaign summary card.

### `src/features/marketing/AddCampaignSheet.tsx`
**Purpose:** Form to add/edit a campaign.

### `src/hooks/usePipeline.ts`
**Purpose:** Fetch contacts+opportunities grouped by pipeline stage.
```typescript
// Returns: Record<PipelineStage | 'lost', ContactWithOpportunity[]>
export function usePipeline() {
  const user = useAuthStore(state => state.user)
  const workspaceId = user?.user_metadata?.workspace_id
  
  return useQuery({
    queryKey: ['pipeline', workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*, opportunity:opportunities(*)')
        .eq('workspace_id', workspaceId)
        .eq('is_deleted', false)
      if (error) throw error
      // Group by stage
      return groupBy(data, c => c.opportunity?.status ?? 'lead')
    }
  })
}
```

### `src/hooks/useCampaigns.ts`
**Purpose:** Fetch marketing campaigns.

---

## Files to Leave Completely Untouched

| File | Reason |
|---|---|
| `src/lib/offlineSync.ts` | Perfect implementation. Zero changes. |
| `src/lib/supabase.ts` | Infrastructure. Zero changes. |
| `src/lib/endDayEngine.ts` | Works correctly. Zero changes. |
| `src/features/auth/` | Auth is working. Zero changes. |
| `src/features/contacts/AddInterviewSheet.tsx` | Works. Minor polish only. |
| `src/features/contacts/AddFollowUpSheet.tsx` | Works. Minor polish only. |
| `src/features/contacts/CallLogSheet.tsx` | Works. Add chaining only. |
| `src/bootstrap.tsx` | App bootstrap. Zero changes. |
| `src/components/providers/` | Provider layer. Zero changes. |
| `src/components/ui/` | Shadcn UI. Never modify. |
| `vite.config.ts` | Build config. Zero changes. |
| `index.css` | Design tokens are correct. Minor additions only. |

---

## Refactor Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Breaking `useContacts` by requiring opportunity status | Add the join incrementally. Test that existing contact list still loads. |
| `opportunity_status` type mismatch in TypeScript after enum rename | Update types first. Use TypeScript errors to find all affected files before migrating DB. |
| Kanban column overflowing on mobile | Use horizontal scroll with snap — already a pattern in `ContactsView.tsx` filter chips. |
| Marketing module being visible to Field BDA | Role-based visibility in V1: the Marketing nav item is simply always visible. V2 will add role-gating. This is acceptable for a personal tool where you are the only real user. |
