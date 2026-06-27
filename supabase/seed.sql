-- =============================================================================
-- LeadOS — Database Seed Data
-- =============================================================================
-- Execute this file ONLY ONCE after running schema.sql to populate default configs.
-- DO NOT insert mock candidate or network data.

-- Note: We assume the first user creating an account automatically triggers a workspace creation via the UI/API, 
-- but we can seed common configuration tables that any workspace might need.

-- Opportunity Types (Campaigns)
-- Since Opportunity Types depend on workspace_id, we create a function to seed them per workspace, 
-- or you can manually insert them via the app's settings. 

-- However, for the sake of the initial setup, you can run this block manually by replacing 'YOUR_WORKSPACE_ID' 
-- with the actual workspace_id generated for your organization.

/* 
INSERT INTO opportunity_types (id, workspace_id, name, program_type, description, is_active, incentive_amount, status, color, sort_order)
VALUES
  (uuid_generate_v4(), 'YOUR_WORKSPACE_ID', 'Beautician - Fresher', 'beautician', 'Entry level beautician training program.', true, 3000, 'active', 'blue', 1),
  (uuid_generate_v4(), 'YOUR_WORKSPACE_ID', 'Beautician - Experienced', 'beautician', 'Experienced beautician fast-track.', true, 5000, 'active', 'purple', 2),
  (uuid_generate_v4(), 'YOUR_WORKSPACE_ID', 'Insta Help', 'insta_help', 'Helper and general staff.', true, 3000, 'active', 'emerald', 3);
*/

-- (End of Seed)
