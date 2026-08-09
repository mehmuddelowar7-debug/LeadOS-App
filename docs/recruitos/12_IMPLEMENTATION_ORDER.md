# 12 — Implementation Order

> This is the exact sequence in which work is performed. Every item is a discrete unit of work. Nothing starts until the item before it is verified complete. This prevents compounding errors.

---

## Principles

1. **Verify before building.** Check that the feature you are about to build doesn't already exist at 70%+.
2. **Smallest safe change.** Every change touches the minimum possible code.
3. **Working main.** The main branch must always be deployable. No broken states.
4. **Document the change.** Every step that touches the DB gets a migration file. Every component that gets deleted gets a note in `17_FOUNDER_DECISIONS.md`.

---

## Phase 0: Baseline Setup (Before Any Code)

These are configuration-only changes. Zero risk.

- [ ] **0.1** — Rename: Update `Sidebar.tsx` brand header from "LeadOS" to "RecruitOS"
- [ ] **0.2** — Update `navItems.ts`: Remove Referrals, add Pipeline (/pipeline), change Insights→Analytics (/analytics), add Marketing (/marketing)
- [ ] **0.3** — Update `ROUTES` in `routes.ts`: Add `/pipeline`, `/marketing`, `/marketing/:id`
- [ ] **0.4** — Update `BottomNav.tsx`: Sync with new nav items
- [ ] **0.5** — Update `NavRail.tsx`: Sync with new nav items
- [ ] **0.6** — Update `App.tsx` router: Add new route definitions
- [ ] **0.7** — Hide routes from nav: `/referrals`, `/incentives`, `/queue` (code stays, routes stay, nav items removed)

**Verification:** App runs. Navigation shows 5 items. Old routes still work if accessed directly. No broken imports.

---

## Phase 1: Pipeline Stage Migration (Critical Path)

> ⚠️ This is the highest-risk change. Must be done in a staging environment first.

- [ ] **1.1** — Create Supabase migration file: Add new enum values to `opportunity_status`
  ```sql
  ALTER TYPE opportunity_status ADD VALUE IF NOT EXISTS 'lead';
  ALTER TYPE opportunity_status ADD VALUE IF NOT EXISTS 'interview_scheduled';
  ALTER TYPE opportunity_status ADD VALUE IF NOT EXISTS 'selected';
  ALTER TYPE opportunity_status ADD VALUE IF NOT EXISTS 'recharge';
  ALTER TYPE opportunity_status ADD VALUE IF NOT EXISTS 'joined';
  ```

- [ ] **1.2** — Create data migration script: Remap old statuses to new ones
  ```sql
  UPDATE opportunities SET status = 'lead' WHERE status IN ('new', 'interested');
  UPDATE opportunities SET status = 'interview_scheduled' WHERE status = 'registration';
  UPDATE opportunities SET status = 'selected' WHERE status = 'recharge_pending';
  UPDATE opportunities SET status = 'recharge' WHERE status = 'recharge_completed';
  UPDATE opportunities SET status = 'joined' WHERE status IN ('training', 'completed', 'activated');
  UPDATE opportunities SET status = 'lost' WHERE status = 'consulting';
  ```

- [ ] **1.3** — Update `src/types/index.ts`: 
  - Replace `OPPORTUNITY_STATUSES` with new 5-stage array
  - Update `OPPORTUNITY_STATUS_LABELS` 
  - Update `OPPORTUNITY_STATUS_COLORS`

- [ ] **1.4** — Update `ContactProfileView.tsx`: Remap `PIPELINE_STAGES` array to 5-stage model

- [ ] **1.5** — Update `StatusBadge.tsx`: New stage colors

- [ ] **1.6** — Update `DashboardView.tsx`: Update target labels (Walkins → Interviews, remove Trainings, rename Activations → Joins)

- [ ] **1.7** — Update `ContactsView.tsx`: Replace role-filter chips with pipeline-stage filter chips

- [ ] **1.8** — Update `useDashboardMetrics.ts`: Align metric names with new pipeline stage names

- [ ] **1.9** — Update `get_dashboard_metrics` SQL function: Use new status values

**Verification:** 
- Existing candidates appear in the correct new stage.
- No candidates are in the "Error" state.
- Dashboard targets show correct labels.
- Profile pipeline bar shows 5 stages correctly.
- Candidate list filter chips show 5 stages.

---

## Phase 2: Quick Capture UX Polish

- [ ] **2.1** — Update `ContactEntryView.tsx` Quick Capture mode:
  - Hide all fields except Name, Phone, Area by default
  - Add "More details" accordion for optional fields
  - Make Save button sticky (fixed position, above keyboard)
  - After save: reset form, show toast, do NOT navigate away
  - Default source to "walk_in"

- [ ] **2.2** — Add `campaign_id` dropdown to Quick Capture form
  - Fetch active campaigns from DB
  - Show as optional select: "Link to campaign? (optional)"

**Verification:**
- Form resets in < 200ms after save.
- Save button always visible on various phone screen sizes.
- Duplicate detection still works.
- Offline save still works.

---

## Phase 3: Candidate List Updates

- [ ] **3.1** — Update `ContactsView.tsx`:
  - Title: "Network" → "Candidates"
  - Filter chips: Map to 5 pipeline stages (use opportunity status, not contact role)
  - Candidate cards: Show pipeline stage badge instead of role badge

- [ ] **3.2** — Update `useContacts` hook: Join with opportunities table to get status per contact (if not already doing this)

**Verification:**
- Filter by "Interview Scheduled" shows only candidates in that stage.
- Card badges show stage names, not role names.

---

## Phase 4: Kanban Board (New Feature)

- [ ] **4.1** — Create `src/hooks/usePipeline.ts`
  - Returns contacts grouped by opportunity status
  - Real-time subscription via Supabase
  - Cached with React Query

- [ ] **4.2** — Create `src/features/pipeline/KanbanCard.tsx`
  - Displays: Name, Phone, Days in Stage, Source icon
  - Click handler: navigate to profile (mobile) or open side panel (desktop)

- [ ] **4.3** — Create `src/features/pipeline/KanbanColumn.tsx`
  - Column header: Stage name + count
  - Renders list of KanbanCards
  - "See all N" expansion when count > 10

- [ ] **4.4** — Create `src/features/pipeline/KanbanView.tsx`
  - Desktop: 5 columns horizontal layout
  - Mobile: Horizontal scrollable tabs, one column visible at a time
  - Filter bar: All / Source filter
  - Links to candidate profile

- [ ] **4.5** — Register route in `App.tsx`: `/pipeline` → `<KanbanView />`

**Verification:**
- All 5 columns visible on desktop.
- Candidate appears in correct column based on their opportunity status.
- Clicking a card opens the profile.
- Counts in column headers are accurate.
- Empty columns show a subtle empty state.

---

## Phase 5: Dashboard Work Queue Links

- [ ] **5.1** — Update work queue card click handlers in `DashboardView.tsx`:
  - "Follow-ups Today" → Navigate to `/contacts?filter=follow_up_today`
  - "Overdue Follow-ups" → Navigate to `/contacts?filter=overdue`
  - "Interviews Today" → Navigate to `/pipeline?filter=interview_today`
  - "Recharge Pending" → Navigate to `/pipeline` filtered to Recharge column

**Verification:**
- Clicking each work queue card opens the correct filtered view.

---

## Phase 6: Database Migration — campaigns table

- [ ] **6.1** — Create Supabase migration file: `campaigns` table (see `05_DATABASE_VISION.md`)
- [ ] **6.2** — Create Supabase migration file: Add `campaign_id` to `contacts` table
- [ ] **6.3** — Add RLS policies for `campaigns` table
- [ ] **6.4** — Create `src/hooks/useCampaigns.ts`

---

## Phase 7: Marketing Dashboard (New Feature)

- [ ] **7.1** — Create `src/features/marketing/AddCampaignSheet.tsx`
  - Fields: Name, Platform, Spend, Reach, Leads, Start Date, Active
  - On save: Insert into campaigns table

- [ ] **7.2** — Create `src/features/marketing/CampaignCard.tsx`
  - Shows: Name, Platform icon, Spend, Leads, CPL, Funnel mini-bar

- [ ] **7.3** — Create `src/features/marketing/MarketingView.tsx`
  - Summary metrics (total spend, leads, CPL)
  - Platform tabs
  - Campaign list
  - "Add Campaign" button

- [ ] **7.4** — Register route: `/marketing` → `<MarketingView />`

**Verification:**
- Can add a campaign with spend and leads.
- CPL is computed correctly (Spend / Leads).
- Campaign card shows correct data.
- Platform filter tabs work.

---

## Phase 8: Analytics Upgrade

- [ ] **8.1** — Add pipeline funnel visualization to `AnalyticsView.tsx`
  - Shows: Lead → Interview → Selected → Recharge → Joined
  - Shows count and conversion % at each step

- [ ] **8.2** — Add source breakdown chart (bar or pie)
  - Shows: Walk-in, Instagram, Facebook, Referral, Other
  - Filtered by date range

- [ ] **8.3** — Update CSV export to include pipeline stage

---

## Phase 9: Polish Pass

- [ ] **9.1** — Call Log chains to Follow-up: If outcome is "Call Later", automatically open `AddFollowUpSheet`
- [ ] **9.2** — Interview No-Show: Auto-suggest follow-up creation
- [ ] **9.3** — Candidate profile: Show `campaign_id` attribution in Profile tab
- [ ] **9.4** — Kanban days-in-stage indicator: Color-code cards that have been in a stage too long
- [ ] **9.5** — "Candidates" section: Tab-based filter persistence (remember last used filter)

---

## Phase 10: Final QA & Deployment

- [ ] **10.1** — Test all flows from `03_USER_FLOWS.md` end-to-end
- [ ] **10.2** — Test offline capture: Disable network, capture leads, re-enable, verify sync
- [ ] **10.3** — Test mobile UX: Quick Capture on mobile, Kanban on mobile, Profile on mobile
- [ ] **10.4** — Verify all DB migrations ran successfully on production
- [ ] **10.5** — Update `docs/RELEASE_NOTES_V1.md` with what shipped

---

## Estimated Effort Per Phase

| Phase | Effort | Risk |
|---|---|---|
| 0 — Baseline Setup | 2-3 hours | Very Low |
| 1 — Pipeline Stage Migration | 4-6 hours | HIGH (DB migration) |
| 2 — Quick Capture Polish | 2-3 hours | Low |
| 3 — Candidate List Updates | 2-3 hours | Low |
| 4 — Kanban Board | 8-12 hours | Medium (new feature) |
| 5 — Dashboard Links | 1-2 hours | Very Low |
| 6 — DB Migration (campaigns) | 2-3 hours | Low-Medium |
| 7 — Marketing Dashboard | 8-10 hours | Medium (new feature) |
| 8 — Analytics Upgrade | 4-6 hours | Low |
| 9 — Polish Pass | 4-6 hours | Very Low |
| 10 — QA & Deploy | 3-4 hours | Medium |

**Total estimated:** ~40-55 hours of engineering work.

---

## Rollback Plan Per Phase

| Phase | Rollback Strategy |
|---|---|
| 0 | Git revert. No data changed. |
| 1 | Restore backup. Run reverse migration (old status values are still valid in the enum). |
| 2 | Git revert. Old form still works. |
| 3 | Git revert. Old filters still work. |
| 4 | Git revert. New route just 404s. No data changed. |
| 5 | Git revert. Clicking cards just does nothing or goes to old route. |
| 6 | Drop `campaigns` table. Remove `campaign_id` column (no data existed). |
| 7 | Git revert. Route removed. DB table still exists but empty. |
| 8 | Git revert. Analytics view falls back to old version. |
| 9 | Git revert. Individual Polish items are isolated. |
| 10 | N/A. This is the verification step. |
