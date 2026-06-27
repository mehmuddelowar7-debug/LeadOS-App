CREATE OR REPLACE FUNCTION get_dashboard_metrics(p_workspace_id UUID, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_today_start TIMESTAMP := date_trunc('day', now());
  v_today_end TIMESTAMP := v_today_start + interval '1 day';
  
  v_walkins_today INT;
  v_followups_pending INT;
  v_target_remaining INT := 10;
  
  v_total_contacts INT;
  v_active_opportunities INT;
  
  v_referrals_pending INT;
  v_rewards_paid INT;
  
  result JSONB;
BEGIN
  -- Mission
  SELECT count(*) INTO v_walkins_today 
  FROM contacts 
  WHERE workspace_id = p_workspace_id AND created_by = p_user_id AND created_at >= v_today_start AND created_at < v_today_end;

  SELECT count(*) INTO v_followups_pending 
  FROM opportunities 
  WHERE workspace_id = p_workspace_id AND next_followup IS NOT NULL AND next_followup < v_today_end;

  v_target_remaining := GREATEST(0, 10 - v_walkins_today);

  -- Contact Stats
  SELECT count(*) INTO v_total_contacts FROM contacts WHERE workspace_id = p_workspace_id AND created_by = p_user_id;
  SELECT count(*) INTO v_active_opportunities FROM opportunities WHERE workspace_id = p_workspace_id AND status NOT IN ('won', 'lost', 'rejected');

  -- Referral Stats
  SELECT count(*) INTO v_referrals_pending FROM referrals WHERE workspace_id = p_workspace_id AND reward_status = 'pending';
  SELECT count(*) INTO v_rewards_paid FROM referrals WHERE workspace_id = p_workspace_id AND reward_status = 'paid';

  result := jsonb_build_object(
    'mission', jsonb_build_object(
      'walkinsToday', v_walkins_today,
      'followupsPending', v_followups_pending,
      'targetRemaining', v_target_remaining
    ),
    'contacts', jsonb_build_object(
      'total', v_total_contacts,
      'active', v_active_opportunities
    ),
    'referrals', jsonb_build_object(
      'pending', v_referrals_pending,
      'paid', v_rewards_paid
    )
  );

  RETURN result;
END;
$$;
