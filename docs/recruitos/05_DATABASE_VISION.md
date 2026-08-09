# 05 — Database Vision

> A precise analysis of the current Supabase schema, mapping every table to the RecruitOS pipeline. No tables are deleted without a founder decision. Everything here is a recommendation.

---

## Current Schema Reality Check

The current schema has **12 tables** and **17+ enums**. It was designed for a multi-tenant, enterprise CRM. Here is an honest assessment of each.

---

## Table-by-Table Analysis

### ✅ KEEP AS-IS: `workspaces`
**Why:** Multi-tenancy is correct architecture. Single workspace by default. Future-proof.
**Action:** No changes. Default workspace creation on first login continues.

---

### ✅ KEEP AS-IS: `workspace_members`
**Why:** Role management is critical. `owner` / `admin` / `member` maps naturally to Founder / Manager / BDA.
**Potential rename (V2):** `role` values could be extended to `field_bda`, `office_bda`, `marketing`, `owner` — but do NOT change in V1.
**Action:** No changes in V1.

---

### ✅ KEEP, SIMPLIFY: `contacts`
**Why:** This is the core entity. Everything else references it.
**What's correct:** name, phone, whatsapp, age, gender, current_area, source, notes, custom_fields, soft-delete, created_at.
**What's overbuilt but harmless:**
- `location_lat`, `location_lng` — not used in V1, but could power a map view in V2. Leave it.
- `total_referrals`, `total_successful_referrals`, `lifetime_referral_rewards` — rollup fields. Harmless. Leave them.
- `roles` array — currently used for CRM-style roles. In RecruitOS, every candidate is an "opportunity" by default. The other roles (referral_partner, etc.) can remain but should be de-emphasized in the UI.
**Action:** No schema changes. UI changes only (rename "opportunity" role to "Candidate", hide irrelevant role filters).

---

### ⚠️ KEEP, REMAP: `opportunities`
**Why:** This table IS the pipeline. It tracks every candidate's progress.
**Critical mismatch:** The current `opportunity_status` enum has 10 values that don't match the 5-stage RecruitOS pipeline:
```sql
-- Current (10 values, confusing):
'new', 'interested', 'registration', 'recharge_pending',
'recharge_completed', 'training', 'completed', 'activated', 'consulting', 'lost'

-- Required (5 stages + 1 exit):
'lead', 'interview_scheduled', 'selected', 'recharge', 'joined', 'lost'
```
**Migration decision:** This requires an enum migration. See `13_DATABASE_MIGRATION_PLAN.md`.
**Other fields to re-evaluate:**
- `score` / `score_label` — Harmless. Useful for sorting. Keep.
- `english_level`, `experience`, `education` — Valid recruitment data. Keep.
- `interest_level`, `objections` — Valid. Keep.
- `parents_support`, `husband_support` — Valid for this specific recruitment context. Keep.
- `has_android`, `has_internet`, `has_smartphone` — Valid. Keep.
- `competitor`, `currently_working`, `previous_company` — Valid for qualification. Keep.
- `next_followup`, `reminder_time` — Keep. Used by the dashboard.
- `UNIQUE(contact_id)` — **This is correct.** One active opportunity per contact.

---

### ✅ KEEP AS-IS: `interviews`
**Why:** Exactly right. Maps to "Interview Scheduled" stage.
**Fields:** interview_date, interview_time, location, branch, status ('scheduled', 'attended', 'no_show', 'rescheduled', 'cancelled'), notes.
**Action:** No changes.

---

### ✅ KEEP AS-IS: `follow_ups`
**Why:** Core to the daily workflow. Powers the Work Queue.
**Action:** No changes.

---

### ✅ KEEP AS-IS: `contact_activities`
**Why:** This is the activity timeline. Critical for candidate history.
**Needed addition (V1.5):** Add `interview_date`, `from_status`, `to_status` fields in the `metadata JSONB` column — not as schema changes, just as conventions in the metadata.
**Action:** No schema changes. Metadata convention update only.

---

### ⚠️ KEEP, EVALUATE IN V2: `referrals`
**Why:** The referral system is built and functional. However, it's creating noise in the UI for a V1 that is focused on the 5-stage pipeline.
**V1 decision:** Hide the `/referrals` route from the main navigation. Keep the data. Accessible from the candidate profile.
**V2 decision:** Resurface as a structured "Referral Network" section.
**Action:** Route removed from nav in V1. Code and schema untouched.

---

### 🗑️ HIDE IN V1, REMOVE IN V2: `contact_documents`
**Why:** Founder explicitly said: "NO document uploads."
**Action:** Remove from UI completely. Keep the table in DB for now (no data loss). Migration to drop the table can happen in V2 once confirmed no data exists.

---

### 🗑️ HIDE IN V1, REMOVE IN V2: `contact_services`
**Why:** This is a many-to-many for services (e.g., "beautician", "tailoring"). In RecruitOS, this is handled by `opportunity_type_id` on the opportunity. It's redundant.
**Action:** Remove from all frontend code. Keep in DB.

---

### ⚠️ HIDE IN V1, RECONSIDER: `incentives`
**Why:** Founder said no payroll/salary. Incentives is a grey area — it could be useful for tracking BDA performance bonuses. However, V1 should not surface this.
**Action:** Remove from nav. Keep data and schema. Revisit in V2.

---

### ⚠️ SIMPLIFY: `user_profiles`
**Why:** Contains gamification fields (level, total_points, current_streak, badges) that are not needed.
**What's useful:** display_name, avatar_url, phone.
**Action:** Gamification fields are simply not read or written from the frontend. Schema stays. UI ignores them.

---

### ✅ KEEP AS-IS: `sync_queue`
**Why:** Offline sync is a critical feature for Field BDAs. Do not remove.
**Note:** The implementation in `offlineSync.ts` uses IndexedDB for query caching (the `createIDBPersister`) and a mutation queue for offline writes. This is actually a clean, well-implemented approach. Keep it exactly as-is.
**Action:** No changes.

---

### ✅ KEEP AS-IS: `daily_snapshots`
**Why:** Powers the End Day feature and historical performance tracking. Already implemented and functional.
**Action:** No changes.

---

### ✅ KEEP AS-IS: `opportunity_types`
**Why:** This allows configurable recruitment programs (e.g., "Beautician", "Insta Help"). Good future-proofing.
**Action:** No changes.

---

## New Table Required: `campaigns` [V1]

This table does not exist yet and is required for the Marketing module.

```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),

  -- Campaign Identity
  name TEXT NOT NULL,                        -- "Reel #24 — Kitchen Worker"
  platform TEXT NOT NULL,                    -- 'instagram' | 'facebook' | 'meta_ads' | 'organic' | 'google_forms'
  campaign_type TEXT DEFAULT 'paid',         -- 'paid' | 'organic'

  -- Performance Data (manually entered in V1, API-synced in V2)
  spend DECIMAL(10,2) DEFAULT 0,            -- Money spent
  reach INT DEFAULT 0,                      -- People reached
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  form_leads INT DEFAULT 0,                 -- Leads from Meta lead forms

  -- Computed Fields (calculated in app, not triggers)
  -- cpl = spend / form_leads (computed in frontend)

  -- Dates
  start_date DATE,
  end_date DATE,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,

  -- Metadata for future API integration
  external_id TEXT,                         -- Meta Campaign ID for V2 sync
  raw_data JSONB DEFAULT '{}',              -- Store raw API response for V2

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_workspace ON campaigns(workspace_id);
CREATE INDEX idx_campaigns_platform ON campaigns(workspace_id, platform);
CREATE INDEX idx_campaigns_active ON campaigns(workspace_id, is_active);
```

---

## Contact ↔ Campaign Attribution

To track which campaign generated a lead, we need to add a `campaign_id` to the `contacts` table:

```sql
-- Migration: Add campaign attribution to contacts
ALTER TABLE contacts ADD COLUMN campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;
CREATE INDEX idx_contacts_campaign ON contacts(campaign_id) WHERE campaign_id IS NOT NULL;
```

This single column enables the entire marketing attribution chain:
```
Campaign → Contact → Opportunity (pipeline)
```

From this, we can compute per-campaign:
- How many leads came from this campaign
- How many reached "Interview Scheduled"
- How many joined
- ROI = Spend / Joins

---

## Current Enum Problem: `opportunity_status`

> This is the single most important schema fix required. The current 10-value enum must be migrated to align with the 5-stage pipeline.

### Migration Strategy (Safe)

1. **Do NOT drop the existing enum.**
2. Add new values to the enum (PostgreSQL allows adding values).
3. Write a data migration script to remap old statuses to new ones.
4. Update all frontend code to use new status values.
5. Old values can be deprecated (they remain valid SQL enum values but are no longer written by the app).

```sql
-- Step 1: Add new values to existing enum
ALTER TYPE opportunity_status ADD VALUE IF NOT EXISTS 'lead';
ALTER TYPE opportunity_status ADD VALUE IF NOT EXISTS 'interview_scheduled';
ALTER TYPE opportunity_status ADD VALUE IF NOT EXISTS 'selected';
ALTER TYPE opportunity_status ADD VALUE IF NOT EXISTS 'recharge';
ALTER TYPE opportunity_status ADD VALUE IF NOT EXISTS 'joined';

-- Step 2: Data migration (map old values to new)
UPDATE opportunities SET status = 'lead' WHERE status = 'new';
UPDATE opportunities SET status = 'lead' WHERE status = 'interested';
UPDATE opportunities SET status = 'interview_scheduled' WHERE status = 'registration';
UPDATE opportunities SET status = 'selected' WHERE status = 'recharge_pending';
UPDATE opportunities SET status = 'recharge' WHERE status = 'recharge_completed';
UPDATE opportunities SET status = 'joined' WHERE status IN ('training', 'completed', 'activated');
-- 'consulting' and 'lost' stay as 'lost'
UPDATE opportunities SET status = 'lost' WHERE status = 'consulting';
```

> ⚠️ This migration must be tested in a staging environment first. See `13_DATABASE_MIGRATION_PLAN.md`.

---

## Missing Indexes (Performance)

```sql
-- Fast filter of candidates by pipeline stage (for Kanban)
CREATE INDEX IF NOT EXISTS idx_opportunities_status_workspace
  ON opportunities(workspace_id, status)
  WHERE status NOT IN ('lost');

-- Fast attribution query (campaign → leads)
CREATE INDEX IF NOT EXISTS idx_contacts_campaign
  ON contacts(campaign_id, workspace_id)
  WHERE campaign_id IS NOT NULL;

-- Fast follow-up queue (overdue + today)
CREATE INDEX IF NOT EXISTS idx_followups_date_status
  ON follow_ups(workspace_id, follow_up_date, status)
  WHERE status = 'pending';
```

---

## Summary: Schema Health Score

| Table | Keep? | Changes Needed |
|---|---|---|
| workspaces | ✅ | None |
| workspace_members | ✅ | None |
| contacts | ✅ | Add `campaign_id` column |
| opportunities | ✅ | Remap status enum |
| interviews | ✅ | None |
| follow_ups | ✅ | None |
| contact_activities | ✅ | None |
| referrals | ✅ (hidden) | None |
| contact_documents | ⚠️ (hidden) | Drop in V2 |
| contact_services | ⚠️ (hidden) | Drop in V2 |
| incentives | ⚠️ (hidden) | Revisit V2 |
| user_profiles | ✅ | Ignore gamification fields |
| sync_queue | ✅ | None |
| daily_snapshots | ✅ | None |
| opportunity_types | ✅ | None |
| **campaigns** | 🆕 NEW | Create |
