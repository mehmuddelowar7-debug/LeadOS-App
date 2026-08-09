# 16 — Technical Debt Plan

> An honest inventory of every engineering problem in the current LeadOS codebase, ranked by impact and urgency. This is not a list of things to fix immediately — it's a list of things to fix in the right order, without disrupting the working app.

---

## Debt Classification

| Level | Meaning |
|---|---|
| **Critical** | Will cause bugs, data loss, or security issues. Fix before shipping. |
| **High** | Slows development or causes user-visible problems. Fix in the current sprint. |
| **Medium** | Creates maintenance burden or UX friction. Fix in next sprint. |
| **Low** | Code quality improvements. Fix when nearby code is being changed. |
| **Defer** | Real problem, but not impactful enough to address now. |

---

## Debt 001: Pipeline Stage Mismatch (Critical)

**File:** `src/types/index.ts`, `src/features/contacts/ContactProfileView.tsx`, `supabase/schema.sql`
**Problem:** The `opportunity_status` enum has 10 values. The RecruitOS pipeline has 5. The frontend `PIPELINE_STAGES` array in `ContactProfileView.tsx` (line 123) maps to completely different status IDs than the database enum values. The pipeline bar shown to users does not accurately reflect the database state.

**Example of the mismatch:**
```typescript
// Frontend says:
{ id: 'new', label: 'Lead' }

// But the actual navigation logic uses 'interested' as the next status:
{ id: 'new', label: 'Lead', nextStatus: 'interested' }

// And the database has both 'new' AND 'interested' as separate statuses
// that BOTH map to "Lead" in the UI — two database states, one UI label.
```

**Impact:** If you move a candidate in the UI from "Lead" to "Contacted", it silently sets them to 'interested' in the database. But 'interested' still shows as the same "Lead" label in the filter chips. The filter doesn't distinguish between `new` and `interested` — both show as "Lead" but they're different DB records.

**Fix:** Migration 001 + 002 from `13_DATABASE_MIGRATION_PLAN.md`. Then update all frontend status references.

---

## Debt 002: `get_dashboard_metrics` References Non-Existent Column (Critical)

**File:** `supabase/schema.sql` line 670
**Problem:**
```sql
-- This query uses entry_date which does NOT exist on the contacts table:
SELECT COUNT(*) INTO v_leads_today FROM contacts 
WHERE workspace_id = p_workspace_id AND created_by = p_user_id AND entry_date = CURRENT_DATE;
```
The `contacts` table has `created_at TIMESTAMPTZ`, not `entry_date DATE`. This means the "Leads Today" metric in the dashboard is **always returning 0** or throwing a PostgreSQL error that is silently swallowed.

**Impact:** Daily lead count on dashboard is inaccurate. Targets tracking is broken.

**Fix:** Update the function — replace `entry_date = CURRENT_DATE` with `created_at::date = CURRENT_DATE`.

**Also:** `contact_activities` queries in the same function reference `activity_date` which also may not exist. Verify column names in the function against actual table schema.

---

## Debt 003: Empty `src/store/` Directory

**Location:** `src/store/`
**Problem:** An empty directory exists. Either it was planned but not used, or it was abandoned. It creates confusion for new developers.

**Fix:** Delete the directory. Trivial.

---

## Debt 004: `ContactsView` Filter Only Works on Contact Roles, Not Pipeline Stage

**File:** `src/features/contacts/ContactsView.tsx` lines 211-225
**Problem:** The filter chips filter on `contact.roles` (opportunity, referral_partner, etc.) — but what users actually want to filter by is the candidate's pipeline stage. The current filter behavior is confusing and not useful for the recruitment workflow.

**Impact:** Medium. Users see contacts correctly but cannot filter by "Show me all 'Interview Scheduled' candidates."

**Fix:** Update `filteredContacts` to filter by `contact.opportunity?.status`.

---

## Debt 005: Bulk Action Bar in Contacts View is Scaffolded, Not Functional

**File:** `src/features/contacts/ContactsView.tsx` lines 399-419
**Problem:** The bulk action bar shows buttons for Status, Interview, Follow-up, Export, Delete — but all buttons call `toast.success('Bulk action scheduled')` with no actual implementation.

**Impact:** Medium. Users who discover bulk select mode will be misled into thinking they performed an action.

**Fix:** Either implement bulk actions properly or hide bulk select mode until it's implemented. Preferred: implement bulk stage move (most common use case) and bulk export.

---

## Debt 006: `window.confirm()` Used for Delete Confirmation

**File:** `src/features/contacts/ContactProfileView.tsx` line 237
**Problem:**
```typescript
if (window.confirm('Are you sure you want to delete this contact?')) {
```
`window.confirm()` is a blocking synchronous call that renders a browser-native dialog. It looks out of place in a premium app, it cannot be styled, and on mobile Safari it sometimes doesn't display at all.

**Fix:** Replace with a Shadcn `AlertDialog` component. Blocking dialog with "Delete" and "Cancel" buttons, styled to match the app.

---

## Debt 007: `WhatsAppSheet` Shows Templates That Open `wa.me` URLs Without Verification

**File:** `src/features/contacts/WhatsAppTemplates.tsx`
**Problem:** WhatsApp link generation uses `contact.phone` directly as the number. If the phone number has a country code prefix, spaces, or special characters, the WhatsApp link will fail silently (the URL will open but the conversation won't start).

**Fix:** Phone number normalization utility. Strip spaces, dashes, add +91 if missing (or whatever the local country code is).

---

## Debt 008: No Error Boundaries Around Individual Features

**File:** `src/components/providers/RouteErrorBoundary.tsx`
**Problem:** There is a route-level error boundary, which is good. But there are no feature-level error boundaries. If `DashboardView` throws an unhandled error during a render, the entire app shell crashes.

**Fix:** Wrap each major feature view in its own `Suspense` + error boundary. This is already partially done with the lazy-loaded routes, but non-lazy routes (like `DashboardView` and `ContactsView`) have no individual error protection.

---

## Debt 009: `useRenderProfiler` is in Every Production Component

**Files:** Multiple
**Problem:** `useRenderProfiler('DashboardView', ...)` is called at the top of every major component. This is a development tool. It should be stripped from production builds.

**Fix:** Wrap with `if (import.meta.env.DEV) { useRenderProfiler(...) }`, or gate it in the hook itself (already done in the hook, so this may be fine — verify).

---

## Debt 010: Toast in `ContactCard` on Context Menu is Misleading

**File:** `src/features/contacts/ContactsView.tsx` line 56
**Problem:**
```typescript
onContextMenu={(e) => {
  e.preventDefault()
  toast.success('Quick actions opened for ' + contact.name)
}}
```
This shows a success toast that says "Quick actions opened" but doesn't actually open any quick actions. It's a placeholder that creates false feedback.

**Fix:** Either implement quick actions (a context menu with call, WhatsApp, follow-up options) or remove the onContextMenu handler.

---

## Debt 011: `InsightsView` is Disconnected from Analytics

**Routes:** `/insights` and `/analytics` both exist and are separate routes. `InsightsView` shows a different dataset from `AnalyticsView`. The user sees two different views doing similar things.

**Fix:** Merge `InsightsView` content into `AnalyticsView`. Remove the `/insights` route (or redirect it to `/analytics`).

---

## Debt 012: `QueueLayout` Has Empty Sub-Routes

**File:** `src/features/followups/QueueLayout.tsx` + `App.tsx` lines 157-160
**Problem:**
```tsx
<Route path="calls" element={<div className="p-4">Call Queue</div>} />
<Route path="whatsapp" element={<div className="p-4">WhatsApp Queue</div>} />
<Route path="pending" element={<div className="p-4">Pending Sync</div>} />
```
These are literally `<div>` placeholder components that show raw text. If a user navigates to `/queue/calls`, they see a blank div that says "Call Queue."

**Fix:** Remove the `/queue` route from navigation. The follow-up queue functionality should live in the Candidates screen with a filter, not as a separate route. Keep the route handler but redirect to `/contacts?filter=follow_up_today`.

---

## Debt 013: Opportunity Score Used Inconsistently

**Files:** `ContactProfileView.tsx` uses `getProbabilityLabel(opportunity.score)` but the pipeline progression in the same file doesn't use the score to inform actions.

**Problem:** The score exists in the database, is calculated automatically, and is displayed — but it never influences any behavior in the UI. It's a vanity metric.

**Options:**
1. **Remove score display from UI.** The score doesn't help the recruitment workflow.
2. **Use score to sort candidates in Kanban.** Higher score candidates shown first in each column.

**Recommendation:** Option 2. Sort Kanban column by score descending. This gives the score a purpose.

---

## Debt 014: Referral Module Conflates Commission Tracking

**File:** `supabase/schema.sql` lines 313-323
**Problem:** The `referrals` table has both `reward_amount`/`reward_status` (original design) AND `commission_amount`/`paid_date`/`approved_by` (V1.1 fields) doing similar things. It's unclear which fields are authoritative.

**Fix:** In V2, when the referral module is resurfaced, audit which fields are actually used and remove duplicates. In V1, just hide the module — don't try to fix the schema confusion.

---

## Debt 015: Daily Snapshot Not Being Auto-Created

**File:** `src/lib/endDayEngine.ts`
**Problem:** The `daily_snapshots` table exists and the schema is defined, but the End Day sheet needs to explicitly trigger a snapshot save. If the user doesn't click "End Day", no snapshot is created for that day.

**Impact:** Low. Snapshots are historical data — missing a day is not catastrophic.

**Fix (V1.5):** Auto-create a snapshot when the user opens the app after midnight (rollover detection). This is an enhancement, not a blocker.

---

## Debt Summary Table

| ID | Problem | Severity | Fix Sprint |
|---|---|---|---|
| 001 | Pipeline stage mismatch | Critical | Phase 1 |
| 002 | Dashboard metrics uses wrong column name | Critical | Phase 1 |
| 003 | Empty src/store/ directory | Low | Whenever |
| 004 | Contact list filters by role not pipeline stage | High | Phase 3 |
| 005 | Bulk actions are scaffolded but non-functional | High | Phase 9 |
| 006 | window.confirm() for delete | Medium | Phase 9 |
| 007 | Phone number not normalized for WhatsApp | Medium | Phase 9 |
| 008 | No feature-level error boundaries | Medium | V1.5 |
| 009 | useRenderProfiler in production components | Low | When nearby |
| 010 | Context menu shows misleading toast | Medium | Phase 3 |
| 011 | InsightsView + AnalyticsView duplication | High | Phase 8 |
| 012 | QueueLayout has empty placeholder sub-routes | High | Phase 0 |
| 013 | Score computed but not used in Kanban sorting | Low | Phase 4 |
| 014 | Referral table has duplicate commission fields | Low | V2 |
| 015 | Daily snapshot not auto-created | Low | V1.5 |
