-- =============================================================================
-- SPRINT 5A - MARKETING SAMPLE DATA
-- Run this AFTER the marketing_foundation migration is applied.
-- Uses generic UUIDs. Requires an existing workspace to attach to.
-- =============================================================================

DO $$
DECLARE
  v_workspace_id UUID;
  v_user_id UUID;
  v_source_ig UUID;
  v_source_agent UUID;
  v_source_field UUID;
  v_campaign_august UUID;
  v_adset_assam UUID;
  v_creative_kitchen UUID;
  v_contact_priya UUID;
  v_contact_nisha UUID;
  v_contact_anita UUID;
  v_attribution_priya UUID;
BEGIN
  -- Get the first available workspace
  SELECT id INTO v_workspace_id FROM workspaces LIMIT 1;
  IF v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'No workspace found to seed data into';
  END IF;

  -- Get the first user to act as created_by
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  -- 1. Create Sources
  INSERT INTO marketing_sources (workspace_id, name, type, created_by, updated_by) 
  VALUES 
    (v_workspace_id, 'Instagram Organic', 'instagram', v_user_id, v_user_id),
    (v_workspace_id, 'Agent Network', 'agent', v_user_id, v_user_id),
    (v_workspace_id, 'Field Marketing', 'field', v_user_id, v_user_id),
    (v_workspace_id, 'Meta Ads', 'meta_ads', v_user_id, v_user_id),
    (v_workspace_id, 'WhatsApp Organic', 'whatsapp', v_user_id, v_user_id)
  RETURNING id INTO v_source_ig;

  SELECT id INTO v_source_agent FROM marketing_sources WHERE name = 'Agent Network' LIMIT 1;
  SELECT id INTO v_source_field FROM marketing_sources WHERE name = 'Field Marketing' LIMIT 1;

  -- 2. Create Campaigns
  INSERT INTO marketing_campaigns (source_id, name, status, budget, created_by, updated_by)
  VALUES 
    (v_source_ig, 'August Hiring', 'active', 5000, v_user_id, v_user_id),
    (v_source_agent, 'Muktadir Referral Drive', 'active', NULL, v_user_id, v_user_id),
    (v_source_field, 'Commercial Street Saturday', 'completed', 200, v_user_id, v_user_id)
  RETURNING id INTO v_campaign_august;

  -- 3. Create Ad Sets
  INSERT INTO marketing_ad_sets (campaign_id, name, daily_budget, created_by, updated_by)
  VALUES (v_campaign_august, 'Assam Girls 18-25', 500, v_user_id, v_user_id)
  RETURNING id INTO v_adset_assam;

  -- 4. Create Creatives
  INSERT INTO marketing_creatives (ad_set_id, name, type, url, created_by, updated_by)
  VALUES (v_adset_assam, 'Kitchen Reel V3', 'video', 'https://example.com/reel3.mp4', v_user_id, v_user_id)
  RETURNING id INTO v_creative_kitchen;

  -- 5. Link to Contacts (Simulating candidates already exist)
  -- Just grab any 3 contacts to use as dummies
  SELECT id INTO v_contact_priya FROM contacts LIMIT 1;
  SELECT id INTO v_contact_nisha FROM contacts OFFSET 1 LIMIT 1;
  SELECT id INTO v_contact_anita FROM contacts OFFSET 2 LIMIT 1;

  IF v_contact_priya IS NOT NULL THEN
    -- Attribution for Priya (Instagram -> August Hiring -> Assam Girls -> Kitchen Reel)
    INSERT INTO marketing_attributions (contact_id, source_id, campaign_id, ad_set_id, creative_id, source_reference, created_by, updated_by)
    VALUES (v_contact_priya, v_source_ig, v_campaign_august, v_adset_assam, v_creative_kitchen, 'Reel #42', v_user_id, v_user_id)
    RETURNING id INTO v_attribution_priya;

    -- Touchpoints for Priya (The Journey)
    INSERT INTO marketing_touchpoints (contact_id, attribution_id, event_type, source_system, timestamp, created_by, updated_by)
    VALUES 
      (v_contact_priya, v_attribution_priya, 'reel_viewed', 'system', NOW() - INTERVAL '5 days', v_user_id, v_user_id),
      (v_contact_priya, v_attribution_priya, 'dm_sent', 'manual', NOW() - INTERVAL '4 days', v_user_id, v_user_id),
      (v_contact_priya, v_attribution_priya, 'lead_created', 'system', NOW() - INTERVAL '4 days', v_user_id, v_user_id),
      (v_contact_priya, v_attribution_priya, 'phone_called', 'manual', NOW() - INTERVAL '3 days', v_user_id, v_user_id),
      (v_contact_priya, v_attribution_priya, 'interview', 'system', NOW() - INTERVAL '1 days', v_user_id, v_user_id),
      (v_contact_priya, v_attribution_priya, 'joined', 'system', NOW(), v_user_id, v_user_id);
  END IF;

  IF v_contact_nisha IS NOT NULL THEN
    -- Attribution for Nisha (Agent -> Muktadir -> No Ad Set -> No Creative)
    INSERT INTO marketing_attributions (contact_id, source_id, source_reference, created_by, updated_by)
    VALUES (v_contact_nisha, v_source_agent, 'Muktadir', v_user_id, v_user_id);
  END IF;

  IF v_contact_anita IS NOT NULL THEN
    -- Attribution for Anita (Field Marketing -> Commercial Street)
    INSERT INTO marketing_attributions (contact_id, source_id, source_reference, created_by, updated_by)
    VALUES (v_contact_anita, v_source_field, 'Commercial Street', v_user_id, v_user_id);
  END IF;

  -- 6. Insert Daily Metrics (For Analytics Engine)
  INSERT INTO marketing_daily_metrics (campaign_id, date, spend, impressions, clicks, leads, created_by, updated_by)
  VALUES 
    (v_campaign_august, CURRENT_DATE - INTERVAL '2 days', 500, 10000, 400, 25, v_user_id, v_user_id),
    (v_campaign_august, CURRENT_DATE - INTERVAL '1 days', 500, 11000, 420, 28, v_user_id, v_user_id),
    (v_campaign_august, CURRENT_DATE, 250, 5000, 180, 10, v_user_id, v_user_id);

END $$;
