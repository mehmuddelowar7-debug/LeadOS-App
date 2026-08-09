-- =============================================================================
-- LeadOS — Migration: Prevent duplicate contacts by phone within workspace
-- =============================================================================

-- Step 1: Delete zero-UUID orphan contacts (created before RLS fix, belong to no workspace)
DELETE FROM contacts
WHERE workspace_id = '00000000-0000-0000-0000-000000000000';

-- Step 2: Delete duplicate phones within the same workspace, keep the newest
DELETE FROM contacts
WHERE id NOT IN (
  SELECT DISTINCT ON (workspace_id, phone) id
  FROM contacts
  ORDER BY workspace_id, phone, created_at DESC
);

-- Step 3: Add partial unique index - excludes archived contacts so they don't
-- block re-registration of the same phone number
CREATE UNIQUE INDEX IF NOT EXISTS contacts_workspace_phone_unique
  ON contacts (workspace_id, phone)
  WHERE is_deleted = FALSE;

-- Verify: should return 0 rows
SELECT workspace_id, phone, COUNT(*) AS count
FROM contacts
WHERE is_deleted = FALSE
GROUP BY workspace_id, phone
HAVING COUNT(*) > 1;
