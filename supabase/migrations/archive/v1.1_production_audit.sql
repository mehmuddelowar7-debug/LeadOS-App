-- =============================================================================
-- LeadOS V1.1 Migration: Production Audit & Workflow
-- =============================================================================
-- Adds strict auditing fields to referrals and updates the dashboard metrics 
-- to correctly count backdated entries.
-- =============================================================================

-- 1. Add audit fields to referrals
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS approved_date DATE;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS commission_reason TEXT;

-- 2. Update get_dashboard_metrics RPC to use entry_date instead of created_at
CREATE OR REPLACE FUNCTION get_dashboard_metrics(p_workspace_id UUID, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_walkins_today INT;
  v_followups_pending INT;
  v_target_remaining INT;
  v_total_contacts INT;
  v_active_contacts INT;
  v_pending_referrals INT;
  v_paid_referrals INT;
  v_daily_target INT;
BEGIN
  -- 1. Mission Metrics
  SELECT COUNT(*) INTO v_walkins_today FROM contacts 
  WHERE workspace_id = p_workspace_id AND created_by = p_user_id 
  AND entry_date = date_trunc('day', NOW())::date;

  SELECT COUNT(*) INTO v_followups_pending FROM opportunities 
  WHERE workspace_id = p_workspace_id AND contact_id IN (SELECT id FROM contacts WHERE created_by = p_user_id) AND next_followup <= NOW();

  SELECT daily_target INTO v_daily_target FROM workspace_members WHERE workspace_id = p_workspace_id AND user_id = p_user_id;
  v_target_remaining := GREATEST(0, COALESCE(v_daily_target, 10) - v_walkins_today);

  -- 2. Contact Metrics
  SELECT COUNT(*) INTO v_total_contacts FROM contacts WHERE workspace_id = p_workspace_id AND created_by = p_user_id AND is_deleted = FALSE;
  
  SELECT COUNT(*) INTO v_active_contacts FROM opportunities 
  WHERE workspace_id = p_workspace_id AND status NOT IN ('lost', 'completed', 'activated') 
  AND contact_id IN (SELECT id FROM contacts WHERE created_by = p_user_id);

  -- 3. Referral Metrics
  SELECT COUNT(*) INTO v_pending_referrals FROM referrals WHERE workspace_id = p_workspace_id AND status = 'pending';
  SELECT COUNT(*) INTO v_paid_referrals FROM referrals WHERE workspace_id = p_workspace_id AND status = 'paid';

  RETURN jsonb_build_object(
    'mission', jsonb_build_object('walkinsToday', v_walkins_today, 'followupsPending', v_followups_pending, 'targetRemaining', v_target_remaining),
    'contacts', jsonb_build_object('total', v_total_contacts, 'active', v_active_contacts),
    'referrals', jsonb_build_object('pending', v_pending_referrals, 'paid', v_paid_referrals)
  );
END;
$$;
