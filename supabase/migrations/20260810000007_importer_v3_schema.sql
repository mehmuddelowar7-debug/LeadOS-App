-- Add new demographic columns to contacts
ALTER TABLE contacts 
ADD COLUMN hometown TEXT,
ADD COLUMN currently_in_bangalore BOOLEAN,
ADD COLUMN bangalore_tenure TEXT,
ADD COLUMN education TEXT,
ADD COLUMN current_occupation TEXT,
ADD COLUMN current_salary INT,
ADD COLUMN total_experience INT;

-- Create Candidate Finance table
CREATE TABLE candidate_finance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    pr_done BOOLEAN DEFAULT FALSE,
    pr_amount DECIMAL(10, 2) DEFAULT 0,
    amount_to_be_paid DECIMAL(10, 2) DEFAULT 0,
    agent_referral BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_candidate_finance_workspace ON candidate_finance(workspace_id);
CREATE INDEX idx_candidate_finance_contact ON candidate_finance(contact_id);

-- Create Commission Transactions table
CREATE TABLE commission_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_type TEXT NOT NULL, -- 'bda_commission', 'agent_commission'
    status TEXT DEFAULT 'pending', -- 'pending', 'paid'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_commission_transactions_workspace ON commission_transactions(workspace_id);
CREATE INDEX idx_commission_transactions_contact ON commission_transactions(contact_id);

-- Create Payment History table
CREATE TABLE payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMPTZ NOT NULL,
    reference_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_payment_history_workspace ON payment_history(workspace_id);
CREATE INDEX idx_payment_history_contact ON payment_history(contact_id);


-- Create the High Performance Batch RPC
CREATE OR REPLACE FUNCTION import_historical_batch_v3(batch_payload JSONB)
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
            -- PL/pgSQL block handles exceptions inherently as a savepoint per iteration
            
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
                CONTINUE; -- Skip this record safely
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
                notes, custom_fields
            ) VALUES (
                v_workspace_id, v_created_by, v_created_at, v_created_at,
                v_name, v_phone, v_whatsapp, v_age, v_gender, v_origin, v_connection_status,
                v_hometown, v_currently_in_bangalore, v_bangalore_tenure, v_education,
                v_current_occupation, v_current_salary, v_total_experience,
                v_notes, v_custom_fields
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
            -- If this particular row fails, catch the error, add to results, and continue with the loop.
            v_result_obj := jsonb_build_object('phone', COALESCE(v_phone, 'unknown'), 'success', false, 'error', SQLERRM);
            v_results := v_results || v_result_obj;
        END;
    END LOOP;
    
    RETURN v_results;
END;
$$;
