# 15 — Backend Refactor Plan

> Changes to Supabase, RLS policies, Edge Functions, and database-level logic. Every backend change is listed with the reason, risk, and rollback.

---

## What "Backend" Means Here

LeadOS/RecruitOS uses Supabase as the backend. The "backend" layer consists of:
1. **PostgreSQL schema** — Tables, indexes, enums.
2. **Row Level Security (RLS)** — Who can access what.
3. **PostgreSQL Functions** — `get_dashboard_metrics`, `rollover_end_day`, `calculate_opportunity_score`, etc.
4. **Triggers** — `auto_score_opportunity`, `update_updated_at`, `update_contact_last_interaction`, etc.
5. **Supabase Edge Functions** — Not currently used. Planned for V2.

---

## Section 1: Schema Changes

These are covered in detail in `13_DATABASE_MIGRATION_PLAN.md`. Summary:

| Migration | Action | Risk |
|---|---|---|
| 001 | Add new enum values to `opportunity_status` | Medium |
| 002 | Remap existing opportunity statuses | High |
| 003 | Add `campaign_id` to contacts | Low |
| 004 | Create `campaigns` table | Low |
| 005 | Add performance indexes | Very Low |

---

## Section 2: RLS Policy Review

### Current RLS Analysis

The existing RLS is **comprehensive and correct** for the current multi-tenant model. The `get_user_workspaces()` security definer function is a clever, correct solution to the RLS recursion problem.

**Current assessment:** The RLS policies are enterprise-grade and will work perfectly for RecruitOS. No changes are required except:

### New: RLS for `campaigns` table

Added in Migration 004. See `13_DATABASE_MIGRATION_PLAN.md` for the exact SQL.

**Policy intent:**
- All workspace members can read campaigns.
- All workspace members can insert/update campaigns (V1: everyone is trusted).
- Only owners and admins can delete campaigns.

### RLS Gap: `interviews` and `follow_ups`

Currently, the RLS for these tables uses `workspace_members` directly instead of the `get_user_workspaces()` helper function. This is a minor inconsistency but functionally correct.

**Non-critical finding.** Leave as-is for V1.

### RLS Gap: No policy for `UPDATE/DELETE` on contacts

Currently there are policies for SELECT, INSERT, UPDATE on contacts, but the `contacts_delete` policy is there too. **This is correct.** Leave as-is.

---

## Section 3: PostgreSQL Functions

### 3.1 `get_dashboard_metrics(p_workspace_id, p_user_id)` — UPDATE REQUIRED

**Current issue:** This function references old status values and old column names.

**Line 670:** References `entry_date` column which may not exist (contacts table has `created_at`, not `entry_date`).
```sql
-- Current (potentially broken):
SELECT COUNT(*) INTO v_leads_today FROM contacts 
WHERE workspace_id = p_workspace_id AND created_by = p_user_id AND entry_date = CURRENT_DATE;

-- Fix:
SELECT COUNT(*) INTO v_leads_today FROM contacts 
WHERE workspace_id = p_workspace_id AND created_by = p_user_id 
AND created_at::date = CURRENT_DATE;
```

**Line 703:** References old status values for "active":
```sql
-- Current:
WHERE status NOT IN ('lost', 'completed', 'activated')

-- After migration:
WHERE status NOT IN ('lost', 'joined')
```

**Line 708:** References `status = 'paid'` for referrals — this is a valid referral status. Leave.

**Action:** Update this function after Migration 002 is applied.

```sql
CREATE OR REPLACE FUNCTION get_dashboard_metrics(p_workspace_id UUID, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  -- [Same variables as before, but update the logic below]
BEGIN
  -- Fix leads today query:
  SELECT COUNT(*) INTO v_leads_today FROM contacts 
  WHERE workspace_id = p_workspace_id 
  AND created_by = p_user_id 
  AND created_at::date = CURRENT_DATE
  AND is_deleted = FALSE;

  -- Fix active contacts query:
  SELECT COUNT(*) INTO v_active_contacts FROM opportunities 
  WHERE workspace_id = p_workspace_id 
  AND status NOT IN ('lost', 'joined')
  AND contact_id IN (SELECT id FROM contacts WHERE created_by = p_user_id AND is_deleted = FALSE);

  -- [Rest remains the same]
END;
$$;
```

---

### 3.2 `rollover_end_day(p_user_id, p_workspace_id)` — KEEP AS-IS

This function rolls over overdue follow-ups to tomorrow morning at 9 AM. The logic is correct and doesn't reference status values. **No changes needed.**

---

### 3.3 `calculate_opportunity_score(opportunity_row)` — KEEP AS-IS

The scoring function still works correctly. Score is computed from `interest_level`, `english_level`, `experience`, `has_smartphone`, `education`, `parents_support`, `husband_support`. None of these are affected by the pipeline stage migration. **No changes needed.**

---

### 3.4 `check_duplicate_contact(...)` — KEEP AS-IS

Duplicate detection by phone, WhatsApp, and name+area. Correct and useful. **No changes needed.**

---

### 3.5 `update_contact_last_interaction()` — KEEP AS-IS

Trigger that updates `contacts.last_interaction_date` when a new activity is inserted. Correct. **No changes needed.**

---

### 3.6 `update_contact_referral_metrics()` — KEEP AS-IS

Referral metric rollups. Referrals are hidden in V1 but the data is still being collected. Triggers should keep running. **No changes needed.**

---

## Section 4: Triggers

All existing triggers are correct and should be preserved:

| Trigger | Table | Purpose | V1 Status |
|---|---|---|---|
| `contacts_updated_at` | contacts | Auto-update timestamp | ✅ Keep |
| `opportunities_updated_at` | opportunities | Auto-update timestamp | ✅ Keep |
| `referrals_updated_at` | referrals | Auto-update timestamp | ✅ Keep |
| `workspaces_updated_at` | workspaces | Auto-update timestamp | ✅ Keep |
| `opportunity_types_updated_at` | opportunity_types | Auto-update timestamp | ✅ Keep |
| `user_profiles_updated_at` | user_profiles | Auto-update timestamp | ✅ Keep |
| `contact_documents_updated_at` | contact_documents | Auto-update timestamp | ✅ Keep |
| `opportunities_auto_score` | opportunities | Auto-score on insert/update | ✅ Keep |
| `trigger_update_last_interaction` | contact_activities | Updates last_interaction_date | ✅ Keep |
| `trigger_update_referral_metrics` | referrals | Referral rollups | ✅ Keep |
| **NEW:** `campaigns_updated_at` | campaigns | Auto-update timestamp | ✅ Add in Migration 004 |

---

## Section 5: Edge Functions (Planned — V2)

No Supabase Edge Functions exist in V1. The following are planned for V2:

### V2 Edge Function 1: Meta Ads Sync
**Trigger:** Cron (every 6 hours)
**Purpose:** Pull campaign data from Meta Ads API and update `campaigns` table.

### V2 Edge Function 2: Lead Form Webhook
**Trigger:** HTTP POST from Meta lead form webhook
**Purpose:** Auto-create a contact from a Meta lead form submission, link to the campaign, push to pipeline.

### V2 Edge Function 3: Daily Report Digest
**Trigger:** Cron (daily at 9 PM IST)
**Purpose:** Generate a daily summary and store in `daily_snapshots`.

---

## Section 6: Supabase Storage

**Current:** An `avatars` bucket is created in the schema seed.

**V1:** No changes needed. The bucket is used for user profile photos only.

**V1 NOTE:** `contact_documents` table references file URLs but we're not using it. The bucket for candidate documents should NOT be created in V1. Only the `avatars` bucket is needed.

---

## Section 7: Supabase Realtime

**Current:** Not explicitly configured.

**V1 Usage:** The Kanban board could benefit from realtime updates when candidates are moved between stages by different users. However, since V1 is a single-user system, realtime is not critical.

**Recommendation:** Enable realtime on `opportunities` table for V1.5. This requires:
1. Enable replication on the `opportunities` table in Supabase dashboard.
2. Subscribe to changes in `usePipeline.ts`.

```typescript
// V1.5 addition to usePipeline.ts:
supabase
  .channel('pipeline-changes')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'opportunities' 
  }, () => {
    queryClient.invalidateQueries({ queryKey: ['pipeline'] })
  })
  .subscribe()
```

---

## Section 8: Environment Variables

**Current `.env` analysis:**
The `.env` file contains 129 bytes — suggesting 2-3 environment variables. Standard Supabase setup.

**Required for V1:**
```env
VITE_SUPABASE_URL=https://[your-project].supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]
VITE_SENTRY_DSN=[optional, for error tracking]
```

**V2 additions (when Meta API is integrated):**
```env
VITE_META_APP_ID=[Meta App ID]
META_APP_SECRET=[Server-side only — use Edge Function env, NOT VITE prefix]
```

> ⚠️ **Security note:** Any `VITE_` prefixed variable is exposed to the client browser. Meta App Secret must NEVER use the VITE prefix. It must only exist in Supabase Edge Function environment variables.

---

## Backend Health Checklist

Before deploying RecruitOS V1 to production, verify:

- [ ] All 5 migrations applied in order.
- [ ] `get_dashboard_metrics` function updated with fixed queries.
- [ ] `campaigns` table exists with correct RLS.
- [ ] `campaign_id` column exists on `contacts`.
- [ ] All existing triggers still firing (test by creating a contact and verifying `last_interaction_date` updates).
- [ ] Opportunity score auto-calculated on insert (test by creating an opportunity and checking `score` column).
- [ ] Duplicate detection function still works (`check_duplicate_contact`).
- [ ] RLS: Unauthenticated access returns 0 rows (test from Supabase SQL editor without auth).
