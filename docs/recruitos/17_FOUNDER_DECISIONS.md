# 17 — Founder Decisions

> This document is the living record of every architectural, product, and design decision that required explicit founder sign-off. All decisions are dated and numbered. Every future deviation from existing decisions must be recorded here.

---

## How This Document Works

When a decision is made that:
1. Changes or removes existing functionality.
2. Deviates from the Product Bible.
3. Involves a trade-off with meaningful consequences.

→ It is recorded here with:
- **Date**
- **Decision ID**
- **What was decided**
- **Why**
- **What was the alternative**
- **Who decided**

---

## Decision Log

---

### D-001: The pipeline has exactly 5 stages

**Date:** 2026-08-08
**Decided by:** Founder

**Decision:** The RecruitOS pipeline is fixed at exactly 5 stages:
1. Lead
2. Interview Scheduled
3. Selected
4. Recharge
5. Joined

These stages are not configurable by users. They are not customizable. They are permanent.

**Why:** The recruitment process is fixed. Adding configurability adds complexity without adding value. The 5 stages represent the exact reality of the operation.

**Alternative considered:** Configurable pipeline stages (like Trello boards). Rejected because it creates decision paralysis and maintenance burden. The simplest system that matches the exact workflow is always correct.

**Impact:** The `opportunity_status` enum must be migrated. Old status values (`new`, `interested`, `registration`, `recharge_pending`, `recharge_completed`, `training`, `completed`, `activated`, `consulting`) are deprecated but not dropped (PostgreSQL limitation).

---

### D-002: Contacts and Opportunities are always separate entities

**Date:** 2026-08-08
**Decided by:** Founder

**Decision:** The `contacts` table and `opportunities` table are never merged. A contact can exist without an opportunity. An opportunity always belongs to a contact.

**Why:** A candidate may return after 3 months. Their history must be preserved. If we merge the tables, re-engaging a lost candidate becomes impossible without creating a duplicate record.

**Alternative considered:** Merging into a single `candidates` table. Rejected because it destroys the ability to track returning candidates and multi-program candidates.

**Impact:** `useContacts` hook must always join with `opportunities` to get pipeline status. This creates a join on every query — acceptable for the data volumes expected.

---

### D-003: Offline sync is preserved, not removed

**Date:** 2026-08-08
**Decided by:** Founder

**Decision:** The offline sync system (`offlineSync.ts`, `sync_queue` table, IndexedDB persister) is preserved exactly as-is in V1.

**Why:** Field BDAs operate in environments with poor connectivity. An offline-first Field BDA experience is a core product requirement. The current implementation (IndexedDB for read cache + mutation queue for write cache) is a correct and clean implementation.

**Alternative considered:** Removing offline sync to simplify the codebase. Rejected. The complexity is isolated in `offlineSync.ts` and doesn't leak into other components. The risk of removing it outweighs the maintenance benefit.

---

### D-004: Multi-tenant schema is preserved

**Date:** 2026-08-08
**Decided by:** Founder

**Decision:** The `workspaces` and `workspace_members` tables are preserved. Single workspace is the default in V1. Multi-workspace support in the UI is deferred to V3.

**Why:** Future-proofing. If the founder ever wants to manage recruitment for multiple companies, or if RecruitOS is opened to other users, the schema already supports it. The cost of removing multi-tenancy now and re-adding it later is enormous.

**Alternative considered:** Flattening to a single-tenant model (removing workspaces entirely). Rejected because the schema is already built, RLS already references it, and removing it would require a complete rewrite of security policies.

---

### D-005: The Marketing module is independent of the recruitment pipeline

**Date:** 2026-08-08
**Decided by:** Founder

**Decision:** The Marketing Dashboard (`/marketing`) never intermixes with the recruitment pipeline UI. Marketing metrics (CPL, Spend, Reach) are never shown on the Dashboard or Kanban. Candidate pipeline stages are never shown in the Marketing view.

**Why:** Different mental models, different questions, different decisions. The pipeline answers "Where is Priya?" The marketing view answers "How much did it cost to find Priya?"

**Implementation:** The connection between them is the `campaign_id` field on `contacts` — one-directional attribution. The marketing view queries this. The pipeline view ignores it.

---

### D-006: V1 Marketing is manual data entry

**Date:** 2026-08-08
**Decided by:** Founder

**Decision:** In V1, marketing campaign metrics (Spend, Reach, Leads from forms) are manually entered by the founder. Meta Ads API integration is deferred to V2.

**Why:** Building the Meta API integration requires OAuth flows, webhook handling, API rate limiting, and significant complexity. The manual entry flow validates the data model and UX before investing in automation. If the manual flow isn't used, the automated flow won't be either.

**Alternative considered:** Building Meta API integration in V1. Rejected. It's 30-40 hours of engineering work for a feature that could be validated manually in 1 hour.

---

### D-007: Gamification is hidden but not removed

**Date:** 2026-08-08
**Decided by:** Founder

**Decision:** The gamification schema fields (`level`, `total_points`, `current_streak`, `badges` in `user_profiles`) and the `incentives` table are preserved in the database but not surfaced in any frontend component.

**Why:** Removing them requires DB migrations and careful dependency analysis. Hiding them costs nothing. The fields may prove useful in V3 when the product is used by a team.

**Alternative considered:** Dropping gamification tables entirely. Deferred to V2 review.

---

### D-008: No document uploads, ever in V1

**Date:** 2026-08-08
**Decided by:** Founder

**Decision:** The `contact_documents` table exists in the schema but is permanently hidden from the UI. No file upload functionality is built in V1.

**Why:** Founder explicitly requested this. Document management adds significant UX and storage complexity for near-zero daily value. Candidates are managed by human conversation, not paperwork.

**Impact:** The `contact_documents` table is candidates for removal in V2. Note it here as a future clean-up.

---

### D-009: The app is renamed from LeadOS to RecruitOS

**Date:** 2026-08-08
**Decided by:** Founder

**Decision:** All user-visible strings, brand elements, and documentation are updated to "RecruitOS." The codebase package name (`package.json` `name: "leados"`) can stay as internal technical naming to avoid breaking npm dependencies and build artifacts.

**Impact:**
- `Sidebar.tsx` brand header: "LeadOS" → "RecruitOS"
- `App.tsx` error screen text: Update
- `index.css` comment header: Update
- `package.json` name: Leave as "leados" (internal)
- `vite.config.ts`: Leave
- Folder name `/Documents/LeadOS/`: Leave (too risky to rename, git history)

---

### D-010: Navigation restructure from 5 items to 5 new items

**Date:** 2026-08-08
**Decided by:** Founder

**Old navigation:**
- Home, Network, Tasks, Referrals, Insights

**New navigation:**
- Home, Pipeline, Candidates, Marketing, Profile

**What was removed from nav:** Tasks (→ surfaced from Dashboard), Referrals (→ hidden), Insights (→ merged into Analytics)
**What was added to nav:** Pipeline (Kanban), Marketing (new module), Profile (was in header/settings)
**What was renamed:** Network → Candidates

**Why:** The new navigation maps directly to the three operational modes (Dashboard + Pipeline for Office BDA, Candidates for search, Marketing for the founder). Profile is always accessible.

---

### D-011: Identified Critical Bug — Dashboard "Leads Today" is Always 0

**Date:** 2026-08-08
**Identified by:** Code audit during product design phase

**Finding:** The `get_dashboard_metrics` PostgreSQL function (schema.sql line 670) queries `entry_date = CURRENT_DATE` on the `contacts` table. The `contacts` table has no `entry_date` column — it has `created_at TIMESTAMPTZ`.

**Impact:** The "Leads" metric in the daily targets tracker has been returning 0 or erroring silently for all users. The dashboard target tracker for Leads is broken.

**Fix required:** Update the function to use `created_at::date = CURRENT_DATE`.
**Priority:** Critical. Fix before any other development work.

**Decision:** This bug is added to Phase 1 of the implementation order. The fix is a one-line SQL change that requires no schema migration (just updating the function definition).

---

### D-012: `contact_activities` should also reference `activity_date` for day-based filtering

**Date:** 2026-08-08
**Identified by:** Code audit

**Finding:** The `get_dashboard_metrics` function also queries `activity_date = CURRENT_DATE` on `contact_activities` (lines 673, 682, 685, 688, 691). The `contact_activities` table has `created_at TIMESTAMPTZ`, not `activity_date`.

**Impact:** All activity-based metrics on the dashboard (Calls, Walk-ins, Recharges, Trainings, Activations) are returning 0.

**Fix:** Same pattern as D-011. Replace `activity_date = CURRENT_DATE` with `created_at::date = CURRENT_DATE`.

**Decision:** Fix simultaneously with D-011 in a single function update.

---

## Open Questions (Pending Founder Decision)

The following questions require explicit founder input before they can be implemented:

### Q-001: Should "Walk-ins" and "Interviews" be the same target metric?

Currently, `walkins` and `interviews` are tracked as separate metrics in `get_dashboard_metrics`. But in the 5-stage pipeline:
- "Walk-in" = the act of a candidate physically attending a location (often confused with "Interview").
- "Interview" = the formal interview event.

**Question:** Are these distinct events in your workflow? Or should they be unified as "Interviews"?

**Impact:** Affects daily target tracking and the dashboard layout.

---

### Q-002: Should "Selected" candidates automatically advance to "Recharge"?

Or does "Selected" require a separate manual step where the Office BDA confirms the selection before moving to Recharge?

**Impact:** Affects the stage transition logic in `ContactProfileView.tsx` and potential automation in V2.

---

### Q-003: What is the "Recharge" stage in plain English?

From the schema context, it appears "Recharge" refers to a payment or commitment step. For candidates: what does "Recharge" mean to them? What does the Office BDA do in this stage?

**Why it matters:** The wording in the UI (notes in the confirmation dialog, the activity log entry, the follow-up prompt) should accurately reflect the real-world action.

---

### Q-004: Should Field BDAs see the Kanban or be locked to Quick Capture only?

Currently, the navigation is the same for all users. V1 decision was: "All users see the same navigation." But if Field BDAs are using the app, do you want them to accidentally access the Kanban or Marketing views?

**Options:**
- A: Leave as-is (all users see all screens). V1 is fine because it's mostly you and your immediate team.
- B: Add a simple role check — Field BDAs only see Quick Capture + their leads. Requires extending `workspace_members.role` and adding conditional nav rendering.

---

*This document is a living record. Every new founder decision must be added here before implementation begins.*
