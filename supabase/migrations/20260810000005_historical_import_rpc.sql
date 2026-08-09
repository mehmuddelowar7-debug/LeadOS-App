CREATE OR REPLACE FUNCTION import_historical_candidate(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_workspace_id UUID;
    v_created_by UUID;
    v_created_at TIMESTAMPTZ;
    v_contact_id UUID;
    v_opportunity_id UUID;
    v_phone TEXT;
    
    -- Candidate payload variables
    v_name TEXT;
    v_whatsapp TEXT;
    v_age INT;
    v_gender lead_gender;
    v_origin TEXT;
    v_current_area TEXT;
    v_custom_fields JSONB;
    
    -- Opportunity variables
    v_status opportunity_status;
    v_priority lead_priority;
    v_total_experience INT;
    v_highest_qualification TEXT;
    
    -- Timeline variables
    v_follow_up_date TIMESTAMPTZ;
    v_walkin_date TIMESTAMPTZ;
    v_activities JSONB;
    v_activity JSONB;
BEGIN
    -- Extract top-level fields
    v_workspace_id := (payload->>'workspace_id')::UUID;
    v_created_by := (payload->>'created_by')::UUID;
    
    v_created_at := (payload->>'created_at')::TIMESTAMPTZ;
    IF v_created_at IS NULL THEN
        v_created_at := NOW();
    END IF;
    
    v_phone := payload->>'phone';
    v_name := payload->>'name';
    v_whatsapp := payload->>'whatsapp';
    v_origin := payload->>'origin';
    v_current_area := payload->>'current_area';
    v_custom_fields := COALESCE((payload->>'custom_fields')::JSONB, '{}'::JSONB);
    
    -- Handle age safely
    BEGIN
        v_age := (payload->>'age')::INT;
    EXCEPTION WHEN OTHERS THEN
        v_age := NULL;
    END;
    
    -- Handle gender safely
    BEGIN
        v_gender := (payload->>'gender')::lead_gender;
    EXCEPTION WHEN OTHERS THEN
        v_gender := NULL;
    END;
    
    -- Extract opportunity fields
    BEGIN
        v_status := (payload->'opportunity'->>'status')::opportunity_status;
    EXCEPTION WHEN OTHERS THEN
        v_status := 'new';
    END;
    
    BEGIN
        v_priority := (payload->'opportunity'->>'priority')::lead_priority;
    EXCEPTION WHEN OTHERS THEN
        v_priority := 'medium';
    END;
    
    BEGIN
        v_total_experience := (payload->'opportunity'->>'total_experience')::INT;
    EXCEPTION WHEN OTHERS THEN
        v_total_experience := NULL;
    END;
    
    v_highest_qualification := payload->'opportunity'->>'highest_qualification';

    -- 1. Check for Duplicate
    SELECT id INTO v_contact_id FROM contacts 
    WHERE workspace_id = v_workspace_id AND phone = v_phone 
    LIMIT 1;

    IF v_contact_id IS NOT NULL THEN
        -- Duplicate found.
        RETURN jsonb_build_object('success', false, 'error', 'DUPLICATE', 'contact_id', v_contact_id);
    END IF;

    -- 2. Insert Contact
    INSERT INTO contacts (
        workspace_id, created_by, created_at, updated_at,
        name, phone, whatsapp, age, gender, origin, current_area, custom_fields
    ) VALUES (
        v_workspace_id, v_created_by, v_created_at, v_created_at,
        v_name, v_phone, v_whatsapp, v_age, v_gender, v_origin, v_current_area, v_custom_fields
    ) RETURNING id INTO v_contact_id;

    -- 3. Insert Opportunity
    INSERT INTO opportunities (
        workspace_id, contact_id, status, priority,
        total_experience, highest_qualification, created_at
    ) VALUES (
        v_workspace_id, v_contact_id, COALESCE(v_status, 'new'), COALESCE(v_priority, 'medium'),
        v_total_experience, v_highest_qualification, v_created_at
    ) RETURNING id INTO v_opportunity_id;

    -- 4. Insert Activities
    v_activities := payload->'activities';
    IF v_activities IS NOT NULL AND jsonb_typeof(v_activities) = 'array' THEN
        FOR v_activity IN SELECT * FROM jsonb_array_elements(v_activities)
        LOOP
            INSERT INTO contact_activities (
                contact_id, workspace_id, created_by,
                activity_type, content, created_at
            ) VALUES (
                v_contact_id,
                v_workspace_id,
                v_created_by,
                (v_activity->>'type')::activity_type,
                (v_activity->>'content'),
                (v_activity->>'created_at')::TIMESTAMPTZ
            );
        END LOOP;
    END IF;
    
    -- 5. Insert Follow-up / Interview if exists
    v_follow_up_date := (payload->>'follow_up_date')::TIMESTAMPTZ;
    IF v_follow_up_date IS NOT NULL THEN
        INSERT INTO follow_ups (
            opportunity_id, due_date, status, created_by, created_at
        ) VALUES (
            v_opportunity_id, v_follow_up_date, 'pending', v_created_by, v_created_at
        );
        
        -- Update next_followup on opportunity
        UPDATE opportunities SET next_followup = v_follow_up_date WHERE id = v_opportunity_id;
    END IF;
    
    v_walkin_date := (payload->>'walkin_date')::TIMESTAMPTZ;
    IF v_walkin_date IS NOT NULL THEN
        INSERT INTO interviews (
            opportunity_id, scheduled_at, status, created_by, created_at
        ) VALUES (
            v_opportunity_id, v_walkin_date, 'scheduled', v_created_by, v_created_at
        );
    END IF;

    -- Return success
    RETURN jsonb_build_object('success', true, 'contact_id', v_contact_id);

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
