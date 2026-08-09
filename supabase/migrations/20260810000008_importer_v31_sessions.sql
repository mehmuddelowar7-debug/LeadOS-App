CREATE TYPE import_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'rolled_back');

CREATE TABLE import_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    filename TEXT NOT NULL,
    file_url TEXT,
    total_rows INT DEFAULT 0,
    imported INT DEFAULT 0,
    failed INT DEFAULT 0,
    duplicates INT DEFAULT 0,
    duration_ms INT DEFAULT 0,
    status import_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_import_sessions_workspace ON import_sessions(workspace_id);

ALTER TABLE contacts 
ADD COLUMN import_session_id UUID REFERENCES import_sessions(id) ON DELETE CASCADE;
CREATE INDEX idx_contacts_import_session ON contacts(import_session_id);

-- Create Storage Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('historical_imports', 'historical_imports', false) 
ON CONFLICT (id) DO NOTHING;

-- RLS for import_sessions
ALTER TABLE import_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view workspace import sessions" ON import_sessions 
FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert workspace import sessions" ON import_sessions 
FOR INSERT WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can update workspace import sessions" ON import_sessions 
FOR UPDATE USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete workspace import sessions" ON import_sessions 
FOR DELETE USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));


-- Rollback RPC
CREATE OR REPLACE FUNCTION rollback_import_session(p_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_workspace_id UUID;
BEGIN
    SELECT workspace_id INTO v_workspace_id FROM import_sessions WHERE id = p_session_id;
    
    IF v_workspace_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Session not found');
    END IF;

    -- Update session status
    UPDATE import_sessions SET status = 'rolled_back' WHERE id = p_session_id;

    -- Delete contacts (this will CASCADE to opportunities, finance, activities, etc)
    DELETE FROM contacts WHERE import_session_id = p_session_id;

    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- Update Batch RPC to take session ID
CREATE OR REPLACE FUNCTION import_historical_batch_v3(p_session_id UUID, batch_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item JSONB;
    v_results JSONB := '[]'::JSONB;
    
    -- Variables for single row
    v_workspace_id UUID;
    v_created_by UUID;
    v_created_at TIMESTAMPTZ;
    v_contact_id UUID;
    v_opportunity_id UUID;
    v_phone TEXT;
    
    -- Candidate demographics
    v_name TEXT;
    v_whatsapp TEXT;
    v_age INT;
    v_gender lead_gender;
    v_origin TEXT;
    v_hometown TEXT;
    v_currently_in_bangalore BOOLEAN;
    v_bangalore_tenure TEXT;
    v_education TEXT;
    v_current_occupation TEXT;
    v_current_salary INT;
    v_total_experience INT;
    
    v_connection_status connection_status;
    v_notes TEXT;
    v_custom_fields JSONB;
    
    -- Opportunity
    v_status opportunity_status;
    v_candidate_category candidate_category;
    
    -- Finance
    v_pr_done BOOLEAN;
    v_pr_amount DECIMAL;
    v_amount_to_be_paid DECIMAL;
    v_bda_commission DECIMAL;
    v_agent_referral BOOLEAN;
    
    -- Dates
    v_follow_up_date TIMESTAMPTZ;
    v_walkin_date TIMESTAMPTZ;
    v_walkin_attended BOOLEAN;
    
    v_result_obj JSONB;
BEGIN
    FOR v_item IN SELECT * FROM jsonb_array_elements(batch_payload)
    LOOP
        BEGIN
            v_workspace_id := (v_item->>'workspace_id')::UUID;
            v_created_by := (v_item->>'created_by')::UUID;
            v_created_at := (v_item->>'created_at')::TIMESTAMPTZ;
            IF v_created_at IS NULL THEN v_created_at := NOW(); END IF;
            
            v_phone := v_item->>'phone';
            v_name := v_item->>'name';
            
            -- Check for Duplicate
            v_contact_id := NULL;
            SELECT id INTO v_contact_id FROM contacts 
            WHERE workspace_id = v_workspace_id AND phone = v_phone LIMIT 1;
            
            IF v_contact_id IS NOT NULL THEN
                v_result_obj := jsonb_build_object('phone', v_phone, 'success', false, 'error', 'DUPLICATE');
                v_results := v_results || v_result_obj;
                CONTINUE; 
            END IF;
            
            -- Extract fields safely
            v_whatsapp := v_item->>'whatsapp';
            BEGIN v_age := (v_item->>'age')::INT; EXCEPTION WHEN OTHERS THEN v_age := NULL; END;
            BEGIN v_gender := (v_item->>'gender')::lead_gender; EXCEPTION WHEN OTHERS THEN v_gender := NULL; END;
            
            v_origin := v_item->>'origin';
            v_hometown := v_item->>'hometown';
            BEGIN v_currently_in_bangalore := (v_item->>'currently_in_bangalore')::BOOLEAN; EXCEPTION WHEN OTHERS THEN v_currently_in_bangalore := NULL; END;
            v_bangalore_tenure := v_item->>'bangalore_tenure';
            v_education := v_item->>'education';
            v_current_occupation := v_item->>'current_occupation';
            BEGIN v_current_salary := (v_item->>'current_salary')::INT; EXCEPTION WHEN OTHERS THEN v_current_salary := NULL; END;
            BEGIN v_total_experience := (v_item->>'total_experience')::INT; EXCEPTION WHEN OTHERS THEN v_total_experience := NULL; END;
            
            BEGIN v_connection_status := (v_item->>'connection_status')::connection_status; EXCEPTION WHEN OTHERS THEN v_connection_status := NULL; END;
            
            v_notes := v_item->>'notes';
            v_custom_fields := COALESCE((v_item->>'custom_fields')::JSONB, '{}'::JSONB);
            
            -- Insert Contact
            INSERT INTO contacts (
                workspace_id, created_by, created_at, updated_at,
                name, phone, whatsapp, age, gender, origin, connection_status,
                hometown, currently_in_bangalore, bangalore_tenure, education,
                current_occupation, current_salary, total_experience,
                notes, custom_fields, import_session_id
            ) VALUES (
                v_workspace_id, v_created_by, v_created_at, v_created_at,
                v_name, v_phone, v_whatsapp, v_age, v_gender, v_origin, v_connection_status,
                v_hometown, v_currently_in_bangalore, v_bangalore_tenure, v_education,
                v_current_occupation, v_current_salary, v_total_experience,
                v_notes, v_custom_fields, p_session_id
            ) RETURNING id INTO v_contact_id;
            
            -- Insert Timeline Activity for Lead Created
            INSERT INTO contact_activities (
                contact_id, workspace_id, created_by, activity_type, content, created_at
            ) VALUES (
                v_contact_id, v_workspace_id, v_created_by, 'note', 'Historical Lead Created', v_created_at
            );

            -- Insert Timeline Note for comment
            IF v_notes IS NOT NULL AND v_notes != '' THEN
                INSERT INTO contact_activities (
                    contact_id, workspace_id, created_by, activity_type, content, created_at
                ) VALUES (
                    v_contact_id, v_workspace_id, v_created_by, 'note', v_notes, v_created_at
                );
            END IF;

            -- Insert Opportunity
            BEGIN v_candidate_category := (v_item->'opportunity'->>'candidate_category')::candidate_category; EXCEPTION WHEN OTHERS THEN v_candidate_category := NULL; END;
            BEGIN v_status := (v_item->'opportunity'->>'status')::opportunity_status; EXCEPTION WHEN OTHERS THEN v_status := 'new'; END;
            
            INSERT INTO opportunities (
                workspace_id, contact_id, candidate_category, status, priority, created_at
            ) VALUES (
                v_workspace_id, v_contact_id, v_candidate_category, COALESCE(v_status, 'new'), 'medium', v_created_at
            ) RETURNING id INTO v_opportunity_id;
            
            -- Handle Finance
            BEGIN v_pr_done := (v_item->'finance'->>'pr_done')::BOOLEAN; EXCEPTION WHEN OTHERS THEN v_pr_done := FALSE; END;
            BEGIN v_pr_amount := (v_item->'finance'->>'pr_amount')::DECIMAL; EXCEPTION WHEN OTHERS THEN v_pr_amount := 0; END;
            BEGIN v_amount_to_be_paid := (v_item->'finance'->>'amount_to_be_paid')::DECIMAL; EXCEPTION WHEN OTHERS THEN v_amount_to_be_paid := 0; END;
            BEGIN v_agent_referral := (v_item->'finance'->>'agent_referral')::BOOLEAN; EXCEPTION WHEN OTHERS THEN v_agent_referral := FALSE; END;
            BEGIN v_bda_commission := (v_item->'finance'->>'bda_commission')::DECIMAL; EXCEPTION WHEN OTHERS THEN v_bda_commission := 0; END;
            
            IF v_pr_done OR v_pr_amount > 0 OR v_amount_to_be_paid > 0 OR v_agent_referral THEN
                INSERT INTO candidate_finance (
                    workspace_id, contact_id, pr_done, pr_amount, amount_to_be_paid, agent_referral, created_at
                ) VALUES (
                    v_workspace_id, v_contact_id, v_pr_done, COALESCE(v_pr_amount, 0), COALESCE(v_amount_to_be_paid, 0), v_agent_referral, v_created_at
                );
            END IF;
            
            IF v_bda_commission > 0 THEN
                INSERT INTO commission_transactions (
                    workspace_id, contact_id, amount, transaction_type, status, created_at
                ) VALUES (
                    v_workspace_id, v_contact_id, v_bda_commission, 'bda_commission', 'pending', v_created_at
                );
            END IF;
            
            -- Follow Up / Interviews
            v_follow_up_date := (v_item->>'follow_up_date')::TIMESTAMPTZ;
            IF v_follow_up_date IS NOT NULL THEN
                INSERT INTO follow_ups (
                    opportunity_id, due_date, status, created_by, created_at
                ) VALUES (
                    v_opportunity_id, v_follow_up_date, 'pending', v_created_by, v_created_at
                );
                INSERT INTO contact_activities (
                    contact_id, workspace_id, created_by, activity_type, content, created_at
                ) VALUES (
                    v_contact_id, v_workspace_id, v_created_by, 'interview_scheduled', 'Interview Scheduled', v_created_at
                );
            END IF;
            
            v_walkin_date := (v_item->>'walkin_date')::TIMESTAMPTZ;
            BEGIN v_walkin_attended := (v_item->>'walkin_attended')::BOOLEAN; EXCEPTION WHEN OTHERS THEN v_walkin_attended := FALSE; END;
            
            IF v_walkin_date IS NOT NULL THEN
                INSERT INTO interviews (
                    opportunity_id, scheduled_at, status, created_by, created_at
                ) VALUES (
                    v_opportunity_id, v_walkin_date, CASE WHEN v_walkin_attended THEN 'completed' ELSE 'scheduled' END, v_created_by, v_created_at
                );
                
                IF v_walkin_attended THEN
                    INSERT INTO contact_activities (
                        contact_id, workspace_id, created_by, activity_type, content, created_at
                    ) VALUES (
                        v_contact_id, v_workspace_id, v_created_by, 'stage_change', 'Walk-in Attended', v_created_at
                    );
                END IF;
            END IF;
            
            v_result_obj := jsonb_build_object('phone', v_phone, 'success', true, 'contact_id', v_contact_id);
            v_results := v_results || v_result_obj;
            
        EXCEPTION WHEN OTHERS THEN
            v_result_obj := jsonb_build_object('phone', COALESCE(v_phone, 'unknown'), 'success', false, 'error', SQLERRM);
            v_results := v_results || v_result_obj;
        END;
    END LOOP;
    
    RETURN v_results;
END;
$$;
