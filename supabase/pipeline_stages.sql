-- =============================================================================
-- LeadOS — Pipeline Configuration (Dynamic Status)
-- =============================================================================
-- Allows workspace-specific pipeline stages instead of hardcoded statuses.
-- =============================================================================

CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  is_terminal BOOLEAN DEFAULT FALSE, -- marks "completed" / "activated" stages
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (workspace_id, slug)
);

CREATE INDEX idx_pipeline_stages_workspace ON pipeline_stages(workspace_id, sort_order);

-- Auto-update updated_at
CREATE TRIGGER pipeline_stages_updated_at BEFORE UPDATE ON pipeline_stages FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY pipeline_stages_select ON pipeline_stages FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY pipeline_stages_manage ON pipeline_stages FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

-- =============================================================================
-- Default Pipeline Seed (Urban Company)
-- =============================================================================
-- INSERT INTO pipeline_stages (workspace_id, name, slug, color, sort_order, is_default, is_terminal) VALUES
--   (:ws_id, 'New Lead',           'new',                '#3b82f6', 0, TRUE,  FALSE),
--   (:ws_id, 'Interested',         'interested',         '#22c55e', 1, FALSE, FALSE),
--   (:ws_id, 'Registration',       'registration',       '#8b5cf6', 2, FALSE, FALSE),
--   (:ws_id, 'Recharge Pending',   'recharge_pending',   '#f59e0b', 3, FALSE, FALSE),
--   (:ws_id, 'Recharge Completed', 'recharge_completed', '#16a34a', 4, FALSE, FALSE),
--   (:ws_id, 'Training',           'training',           '#0ea5e9', 5, FALSE, FALSE),
--   (:ws_id, 'Completed',          'completed',          '#14b8a6', 6, FALSE, TRUE),
--   (:ws_id, 'Activated',          'activated',          '#22c55e', 7, FALSE, TRUE);
