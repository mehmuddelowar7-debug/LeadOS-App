# 13 — Database Migration Plan

> Every database change is listed here with the exact SQL, the reason, the risk level, and the rollback strategy. No migration runs in production without a founder sign-off.

---

## Migration Principles

1. **Never drop a table in production without a verified data export first.**
2. **Always add before you remove.** Add new enum values before remapping data.
3. **Test every migration in staging (Supabase branch) before production.**
4. **Every migration is a numbered file** in `/supabase/migrations/`.
5. **Rollback = reverse migration.** Every migration must have a corresponding undo script.

---

## Migration 001: Add New Pipeline Stage Enum Values

**File:** `/supabase/migrations/20260810_001_add_pipeline_stages.sql`
**Priority:** P0
**Risk:** MEDIUM — Modifying a PostgreSQL enum. In PG, adding values is safe. Removing values requires dropping and recreating the type.

**Why:** The current `opportunity_status` enum has 10 values that don't match the 5-stage RecruitOS pipeline. We add the new values before remapping data.

```sql
-- ============================================================
-- Migration 001: Add RecruitOS pipeline stage enum values
-- Safe: PostgreSQL allows adding values to enums
-- ============================================================

ALTER TYPE opportunity_status ADD VALUE IF NOT EXISTS 'lead';
ALTER TYPE opportunity_status ADD VALUE IF NOT EXISTS 'interview_scheduled';
ALTER TYPE opportunity_status ADD VALUE IF NOT EXISTS 'selected';
ALTER TYPE opportunity_status ADD VALUE IF NOT EXISTS 'recharge';
ALTER TYPE opportunity_status ADD VALUE IF NOT EXISTS 'joined';

-- Verification query (run after migration):
-- SELECT unnest(enum_range(NULL::opportunity_status));
```

**Rollback:** Cannot remove enum values in PostgreSQL without dropping and recreating the type. However, since no data uses these new values yet (we haven't run Migration 002), the rollback is to simply not use the new values in the application. They remain in the enum but are ignored.

---

## Migration 002: Remap Opportunity Statuses to Pipeline Stages

**File:** `/supabase/migrations/20260810_002_remap_opportunity_statuses.sql`
**Priority:** P0
**Risk:** HIGH — This transforms existing data. Must run Migration 001 first. Must have a backup.

**Why:** Existing opportunities use the old status values. After this migration, they use the 5-stage pipeline values.

**Mapping logic:**
| Old Status | New Status | Reasoning |
|---|---|---|
| `new` | `lead` | Uncontacted leads are in Lead stage |
| `interested` | `lead` | Still in early contact — still Lead |
| `registration` | `interview_scheduled` | Registration = interview was scheduled |
| `recharge_pending` | `selected` | Selected but recharge not done |
| `recharge_completed` | `recharge` | Recharge step initiated |
| `training` | `joined` | Training means they joined |
| `completed` | `joined` | Completed = fully joined |
| `activated` | `joined` | Activated = fully joined |
| `consulting` | `lost` | Consulting was a dead-end status |
| `lost` | `lost` | Stays lost |

```sql
-- ============================================================
-- Migration 002: Remap old opportunity statuses to pipeline stages
-- Prerequisites: Migration 001 must be applied first
-- BACKUP DATABASE BEFORE RUNNING THIS
-- ============================================================

-- Step 1: Create a backup snapshot
CREATE TABLE opportunities_backup_pre_migration AS
  SELECT * FROM opportunities;

-- Step 2: Remap statuses
UPDATE opportunities SET status = 'lead' WHERE status IN ('new', 'interested');
UPDATE opportunities SET status = 'interview_scheduled' WHERE status = 'registration';
UPDATE opportunities SET status = 'selected' WHERE status = 'recharge_pending';
UPDATE opportunities SET status = 'recharge' WHERE status = 'recharge_completed';
UPDATE opportunities SET status = 'joined' WHERE status IN ('training', 'completed', 'activated');
UPDATE opportunities SET status = 'lost' WHERE status = 'consulting';

-- Step 3: Verify counts (run manually to confirm)
-- SELECT status, count(*) FROM opportunities GROUP BY status ORDER BY count DESC;
```

**Rollback:**
```sql
-- Rollback Migration 002: Restore from backup
-- WARNING: This will overwrite ALL opportunity status changes since migration
DELETE FROM opportunities;
INSERT INTO opportunities SELECT * FROM opportunities_backup_pre_migration;
DROP TABLE opportunities_backup_pre_migration;
```

**Post-migration cleanup (run after 4 weeks if everything is stable):**
```sql
-- Remove backup table
DROP TABLE IF EXISTS opportunities_backup_pre_migration;
```

---

## Migration 003: Add campaign_id to contacts

**File:** `/supabase/migrations/20260811_003_add_campaign_to_contacts.sql`
**Priority:** P1
**Risk:** LOW — Adding a nullable column. No existing data affected.

**Why:** Marketing attribution requires linking a contact to the campaign that generated them.

```sql
-- ============================================================
-- Migration 003: Add campaign attribution to contacts
-- Safe: Adds nullable column with no data change
-- ============================================================

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_campaign
  ON contacts(campaign_id, workspace_id)
  WHERE campaign_id IS NOT NULL;

COMMENT ON COLUMN contacts.campaign_id IS
  'The marketing campaign that generated this lead. NULL for walk-ins and non-campaign leads.';
```

**Rollback:**
```sql
DROP INDEX IF EXISTS idx_contacts_campaign;
ALTER TABLE contacts DROP COLUMN IF EXISTS campaign_id;
```

---

## Migration 004: Create campaigns table

**File:** `/supabase/migrations/20260811_004_create_campaigns.sql`
**Priority:** P1
**Risk:** LOW — Creating a new table. No existing data affected.

**Why:** Required for the Marketing Dashboard feature.

```sql
-- ============================================================
-- Migration 004: Create campaigns table for marketing tracking
-- ============================================================

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),

  -- Campaign Identity
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'meta_ads', 'organic', 'google_forms', 'other')),
  campaign_type TEXT DEFAULT 'paid' CHECK (campaign_type IN ('paid', 'organic')),

  -- Performance Data (manually entered in V1)
  spend DECIMAL(10,2) DEFAULT 0,
  reach INT DEFAULT 0,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  form_leads INT DEFAULT 0,

  -- Dates
  start_date DATE,
  end_date DATE,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,

  -- Future API integration
  external_id TEXT,
  raw_data JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_workspace ON campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_platform ON campaigns(workspace_id, platform);
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON campaigns(workspace_id, is_active);

-- Auto-update timestamp
CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY campaigns_select ON campaigns FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspaces()));

CREATE POLICY campaigns_insert ON campaigns FOR INSERT
  WITH CHECK (workspace_id IN (SELECT get_user_workspaces()));

CREATE POLICY campaigns_update ON campaigns FOR UPDATE
  USING (workspace_id IN (SELECT get_user_workspaces()));

CREATE POLICY campaigns_delete ON campaigns FOR DELETE
  USING (
    workspace_id IN (SELECT get_user_workspaces())
    AND auth.uid() IN (
      SELECT user_id FROM workspace_members
      WHERE workspace_id = campaigns.workspace_id
      AND role IN ('owner', 'admin')
    )
  );
```

**Rollback:**
```sql
DROP TABLE IF EXISTS campaigns CASCADE;
-- Note: Dropping campaigns CASCADE will also nullify any campaign_id references in contacts
-- (because of ON DELETE SET NULL). This is safe.
```

---

## Migration 005: Performance Indexes

**File:** `/supabase/migrations/20260812_005_add_performance_indexes.sql`
**Priority:** P1
**Risk:** VERY LOW — Adding indexes only. No data change. Existing queries are unaffected.

```sql
-- ============================================================
-- Migration 005: Add missing performance indexes
-- ============================================================

-- Kanban query: fast filter of opportunities by workspace + status
CREATE INDEX IF NOT EXISTS idx_opportunities_kanban
  ON opportunities(workspace_id, status)
  WHERE status NOT IN ('lost');

-- Follow-up queue: overdue + today
CREATE INDEX IF NOT EXISTS idx_followups_queue
  ON follow_ups(workspace_id, follow_up_date, status)
  WHERE status = 'pending';

-- Activity timeline: fast per-contact lookup
CREATE INDEX IF NOT EXISTS idx_activities_contact_desc
  ON contact_activities(contact_id, created_at DESC);
```

**Rollback:**
```sql
DROP INDEX IF EXISTS idx_opportunities_kanban;
DROP INDEX IF EXISTS idx_followups_queue;
DROP INDEX IF EXISTS idx_activities_contact_desc;
```

---

## Deferred Migrations (V2)

These migrations are documented here for planning purposes but are NOT to be run in V1.

### Future Migration: creative_id on contacts
```sql
-- V2: Add creative-level attribution
ALTER TABLE contacts ADD COLUMN creative_id UUID REFERENCES campaign_creatives(id) ON DELETE SET NULL;
```

### Future Migration: campaign_creatives table
```sql
-- V2: Track individual ad creatives
CREATE TABLE campaign_creatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  creative_type TEXT CHECK (creative_type IN ('reel', 'static', 'story', 'carousel')),
  spend DECIMAL(10,2) DEFAULT 0,
  reach INT DEFAULT 0,
  leads INT DEFAULT 0,
  external_id TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Future Migration: assigned_to on contacts
```sql
-- V3: Lead assignment for team management
ALTER TABLE contacts ADD COLUMN assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;
```

---

## Migration Execution Checklist

For each migration, before running in production:

- [ ] Migration tested in Supabase staging/branch environment
- [ ] Data verified correct after staging test
- [ ] Database backup taken (Supabase auto-backups, but verify)
- [ ] Rollback script written and tested
- [ ] Frontend code updated to use new schema values
- [ ] Frontend deployed and tested against staging DB
- [ ] Founder sign-off given
- [ ] Migration run in production
- [ ] Post-migration verification query run
- [ ] Results recorded in this document with date and outcome

---

## What We Are NOT Doing

| Action | Reason |
|---|---|
| Dropping `contact_documents` | Has RLS policies and foreign keys. Data safety. Remove in V2 after confirmed empty. |
| Dropping `contact_services` | Same reason. |
| Dropping `incentives` | Data may be referenced. Hidden from UI, not deleted. |
| Removing old enum values | PostgreSQL cannot remove enum values without dropping and recreating the type. Old values become deprecated (not used by app, still valid SQL). |
| Merging contacts + opportunities | History preservation. A candidate may return. The separation is correct. |
