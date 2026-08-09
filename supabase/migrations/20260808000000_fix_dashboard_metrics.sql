-- =============================================================================
-- RecruitOS: Fix Dashboard Metrics
-- =============================================================================
-- This migration updates the get_dashboard_metrics function to return the new 
-- structured JSON expected by RecruitOS, while mapping the metrics to the 
-- correct created_at columns that exist in production.
-- =============================================================================

CREATE OR REPLACE FUNCTION get_dashboard_metrics(p_workspace_id UUID, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  -- Actuals
  v_leads_today INT;
  v_calls_today INT;
  v_interviews_scheduled_today INT;
  v_interviews_attended_today INT;
  v_walkins_today INT;
  v_recharges_today INT;
  v_trainings_today INT;
  v_activations_today INT;
  v_followups_pending INT;
  v_followups_today INT;
  
  -- Targets
  t_leads INT;
  t_calls INT;
  t_interviews INT;
  t_walkins INT;
  t_recharges INT;
  t_trainings INT;
  t_activations INT;

  -- Other
  v_total_contacts INT;
  v_active_contacts INT;
  v_pending_referrals INT;
  v_paid_referrals INT;
BEGIN
  -- 1. Fetch Targets
  SELECT 
    target_leads, target_calls, target_interviews, target_walkins, target_recharges, target_trainings, target_activations
  INTO 
    t_leads, t_calls, t_interviews, t_walkins, t_recharges, t_trainings, t_activations
  FROM workspace_members 
  WHERE workspace_id = p_workspace_id AND user_id = p_user_id;

  -- Default targets if null
  t_leads := COALESCE(t_leads, 10);
  t_calls := COALESCE(t_calls, 20);
  t_interviews := COALESCE(t_interviews, 5);
  t_walkins := COALESCE(t_walkins, 5);
  t_recharges := COALESCE(t_recharges, 2);
  t_trainings := COALESCE(t_trainings, 2);
  t_activations := COALESCE(t_activations, 1);

  -- 2. Fetch Actuals (Today)
  SELECT COUNT(*) INTO v_leads_today FROM contacts 
  WHERE workspace_id = p_workspace_id AND created_by = p_user_id AND created_at::date = CURRENT_DATE;

  SELECT COUNT(*) INTO v_calls_today FROM contact_activities
  WHERE workspace_id = p_workspace_id AND created_by = p_user_id AND activity_type = 'called' AND created_at::date = CURRENT_DATE;

  SELECT COUNT(*) INTO v_interviews_scheduled_today FROM interviews
  WHERE workspace_id = p_workspace_id AND created_by = p_user_id AND created_at >= CURRENT_DATE;
  
  SELECT COUNT(*) INTO v_interviews_attended_today FROM interviews
  WHERE workspace_id = p_workspace_id AND created_by = p_user_id AND interview_date = CURRENT_DATE AND status = 'attended';

  SELECT COUNT(*) INTO v_walkins_today FROM contact_activities
  WHERE workspace_id = p_workspace_id AND created_by = p_user_id AND activity_type = 'visited' AND created_at::date = CURRENT_DATE;

  SELECT COUNT(*) INTO v_recharges_today FROM contact_activities
  WHERE workspace_id = p_workspace_id AND created_by = p_user_id AND activity_type = 'recharged' AND created_at::date = CURRENT_DATE;

  SELECT COUNT(*) INTO v_trainings_today FROM contact_activities
  WHERE workspace_id = p_workspace_id AND created_by = p_user_id AND activity_type = 'training_started' AND created_at::date = CURRENT_DATE;

  SELECT COUNT(*) INTO v_activations_today FROM contact_activities
  WHERE workspace_id = p_workspace_id AND created_by = p_user_id AND activity_type = 'activated' AND created_at::date = CURRENT_DATE;

  -- 3. Follow-ups
  SELECT COUNT(*) INTO v_followups_pending FROM follow_ups
  WHERE workspace_id = p_workspace_id AND created_by = p_user_id AND status = 'pending' AND follow_up_date < CURRENT_DATE;
  
  SELECT COUNT(*) INTO v_followups_today FROM follow_ups
  WHERE workspace_id = p_workspace_id AND created_by = p_user_id AND status = 'pending' AND follow_up_date = CURRENT_DATE;

  -- 4. Contact Metrics
  SELECT COUNT(*) INTO v_total_contacts FROM contacts WHERE workspace_id = p_workspace_id AND created_by = p_user_id AND is_deleted = FALSE;
  SELECT COUNT(*) INTO v_active_contacts FROM opportunities 
  WHERE workspace_id = p_workspace_id AND status NOT IN ('lost', 'completed', 'activated') 
  AND contact_id IN (SELECT id FROM contacts WHERE created_by = p_user_id);

  -- 5. Referral Metrics
  SELECT COUNT(*) INTO v_pending_referrals FROM referrals WHERE workspace_id = p_workspace_id AND status = 'pending';
  SELECT COUNT(*) INTO v_paid_referrals FROM referrals WHERE workspace_id = p_workspace_id AND status = 'paid';

  RETURN jsonb_build_object(
    'mission', jsonb_build_object(
      'leads', jsonb_build_object('actual', v_leads_today, 'target', t_leads),
      'calls', jsonb_build_object('actual', v_calls_today, 'target', t_calls),
      'interviews', jsonb_build_object('actual', v_interviews_scheduled_today, 'target', t_interviews),
      'walkins', jsonb_build_object('actual', v_walkins_today, 'target', t_walkins),
      'recharges', jsonb_build_object('actual', v_recharges_today, 'target', t_recharges),
      'trainings', jsonb_build_object('actual', v_trainings_today, 'target', t_trainings),
      'activations', jsonb_build_object('actual', v_activations_today, 'target', t_activations),
      'followupsPending', v_followups_pending,
      'followupsToday', v_followups_today,
      -- Backwards compatibility
      'walkinsToday', v_walkins_today,
      'targetRemaining', GREATEST(0, t_walkins - v_walkins_today)
    ),
    'contacts', jsonb_build_object('total', v_total_contacts, 'active', v_active_contacts),
    'referrals', jsonb_build_object('pending', v_pending_referrals, 'paid', v_paid_referrals)
  );
END;
$$;
