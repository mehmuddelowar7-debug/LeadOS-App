-- =============================================================================
-- Migration: Add missing tables needed for Operations Center
-- interviews, follow_ups
-- These tables were defined in schema.sql but never applied to the remote DB.
-- =============================================================================

-- Ensure required type exists (idempotent)
DO $$ BEGIN
  CREATE TYPE lead_priority AS ENUM ('high', 'medium', 'low');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =============================================================================
-- INTERVIEWS
-- =============================================================================

CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  
  interview_date DATE NOT NULL,
  interview_time TIME NOT NULL,
  location TEXT,
  branch TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'attended', 'no_show', 'rescheduled', 'cancelled')),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interviews_workspace ON interviews(workspace_id);
CREATE INDEX IF NOT EXISTS idx_interviews_contact ON interviews(contact_id);
CREATE INDEX IF NOT EXISTS idx_interviews_date ON interviews(interview_date);

-- RLS
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workspace members can read interviews" ON interviews;
CREATE POLICY "Workspace members can read interviews" ON interviews
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Workspace members can insert interviews" ON interviews;
CREATE POLICY "Workspace members can insert interviews" ON interviews
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Workspace members can update interviews" ON interviews;
CREATE POLICY "Workspace members can update interviews" ON interviews
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- FOLLOW-UPS
-- =============================================================================

CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  
  follow_up_date DATE NOT NULL,
  follow_up_time TIME,
  reminder TEXT,
  priority lead_priority DEFAULT 'medium',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_workspace ON follow_ups(workspace_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_contact ON follow_ups(contact_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_date ON follow_ups(follow_up_date);

-- RLS
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workspace members can read follow_ups" ON follow_ups;
CREATE POLICY "Workspace members can read follow_ups" ON follow_ups
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Workspace members can insert follow_ups" ON follow_ups;
CREATE POLICY "Workspace members can insert follow_ups" ON follow_ups
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Workspace members can update follow_ups" ON follow_ups;
CREATE POLICY "Workspace members can update follow_ups" ON follow_ups
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- REFERRALS — add missing column referral_date if not present
-- =============================================================================

ALTER TABLE referrals
  ADD COLUMN IF NOT EXISTS referral_date DATE DEFAULT CURRENT_DATE;
