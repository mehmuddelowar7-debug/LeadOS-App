-- 1. Insert a test Contact created today
INSERT INTO contacts (id, workspace_id, created_by, name, phone, roles, origin, current_area, source, created_at)
VALUES (
  '11111111-1111-1111-1111-111111111111', 
  (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() LIMIT 1),
  auth.uid(),
  'Test Candidate',
  '9999999999',
  '{opportunity}',
  'Test City',
  'Test Area',
  'walk_in',
  CURRENT_DATE
);

-- 2. Insert a test 'called' Activity today
INSERT INTO contact_activities (id, contact_id, workspace_id, activity_type, created_by, created_at)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() LIMIT 1),
  'called',
  auth.uid(),
  CURRENT_DATE
);

-- Run the RPC function to see the counts
SELECT get_dashboard_metrics(
  (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() LIMIT 1),
  auth.uid()
);

-- Cleanup
DELETE FROM contacts WHERE id = '11111111-1111-1111-1111-111111111111';
