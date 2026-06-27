-- =============================================================================
-- LeadOS — Supabase Database Schema
-- =============================================================================
-- Designed for millions of leads. Normalized. Soft delete. Audit logs.
-- Multi-workspace from day one. Full RLS.
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE opportunity_status AS ENUM (
  'new', 'interested', 'registration', 'recharge_pending',
  'recharge_completed', 'training', 'completed', 'activated', 'consulting', 'lost'
);

CREATE TYPE contact_role AS ENUM (
  'opportunity', 'referral_partner', 'uc_partner', 'friend', 'business_contact', 'influencer', 'other'
);

CREATE TYPE referral_status AS ENUM ('pending', 'successful', 'rejected');
CREATE TYPE reward_status AS ENUM ('pending', 'paid');

-- (daily_snapshots moved below workspaces)

-- =============================================================================
-- WORKSPACES
-- =============================================================================

CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  daily_target INT DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);

CREATE TYPE lead_priority AS ENUM ('high', 'medium', 'low');
CREATE TYPE lead_gender AS ENUM ('female', 'male', 'other');
CREATE TYPE english_level AS ENUM ('none', 'basic', 'intermediate', 'good');
CREATE TYPE interview_ready AS ENUM ('yes', 'no', 'practice_needed');
CREATE TYPE doc_status AS ENUM ('available', 'pending', 'not_available');
CREATE TYPE support_status AS ENUM ('yes', 'no', 'need_discussion', 'na');
CREATE TYPE interest_level AS ENUM ('very_interested', 'interested', 'maybe', 'not_interested');
CREATE TYPE call_outcome AS ENUM ('interested', 'busy', 'no_answer', 'call_later', 'wrong_number');
CREATE TYPE activity_type AS ENUM (
  'created', 'called', 'whatsapp_sent', 'visited', 'note_added',
  'status_changed', 'registered', 'recharged', 'training_started',
  'training_completed', 'activated', 'document_updated', 'follow_up_set',
  'referral_received', 'reward_paid'
);
CREATE TYPE contact_source AS ENUM (
  'walk_in', 'referral', 'instagram', 'facebook', 'whatsapp', 'friend', 'other'
);
CREATE TYPE gamification_level AS ENUM ('bronze', 'silver', 'gold', 'diamond');

-- Daily Snapshots Table
CREATE TABLE daily_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  leads_collected INT DEFAULT 0,
  walk_ins INT DEFAULT 0,
  screenings INT DEFAULT 0,
  recharges INT DEFAULT 0,
  trainings INT DEFAULT 0,
  activations INT DEFAULT 0,
  incentives_earned DECIMAL(10,2) DEFAULT 0,
  hours_worked DECIMAL(5,2),
  metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- OPPORTUNITY TYPES (Configurable Recruitment Campaigns)
-- =============================================================================

CREATE TABLE opportunity_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  program_type TEXT NOT NULL, -- e.g., 'beautician', 'insta_help'
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  incentive_amount DECIMAL(10, 2) DEFAULT 0,
  eligibility_rules JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  color TEXT,
  icon TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_opportunity_types_workspace ON opportunity_types(workspace_id);
CREATE INDEX idx_opportunity_types_active ON opportunity_types(workspace_id, is_active);

-- =============================================================================
-- CONTACTS (Core Network Entity)
-- =============================================================================

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  -- Core Info
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  age INT CHECK (age > 0 AND age < 120),
  gender lead_gender,
  photo_url TEXT,
  
  -- Roles
  roles contact_role[] DEFAULT '{opportunity}',
  labels TEXT[] DEFAULT '{}',

  -- Origin & Location
  origin TEXT,
  native_language TEXT,
  current_area TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,

  -- Source
  source contact_source DEFAULT 'walk_in',

  -- Notes & Custom
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',

  -- Contact Health (Rollups)
  last_interaction_date TIMESTAMPTZ,
  total_referrals INT DEFAULT 0,
  total_successful_referrals INT DEFAULT 0,
  lifetime_referral_rewards DECIMAL(10, 2) DEFAULT 0,

  -- Audit & Soft Delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_workspace ON contacts(workspace_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_contacts_whatsapp ON contacts(whatsapp) WHERE whatsapp IS NOT NULL;
CREATE INDEX idx_contacts_roles ON contacts USING gin (roles);
CREATE INDEX idx_contacts_search ON contacts USING gin (
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(phone, '') || ' ' || coalesce(current_area, '') || ' ' || coalesce(origin, ''))
);

-- =============================================================================
-- OPPORTUNITIES (Recruitment Pipeline Entity)
-- =============================================================================

CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  
  -- Pipeline
  opportunity_type_id UUID REFERENCES opportunity_types(id),
  status opportunity_status NOT NULL DEFAULT 'new',
  priority lead_priority DEFAULT 'medium',
  
  -- Scoring
  score INT DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  score_label TEXT GENERATED ALWAYS AS (
    CASE
      WHEN score >= 70 THEN 'hot'
      WHEN score >= 40 THEN 'warm'
      ELSE 'cold'
    END
  ) STORED,

  -- Skills & Background
  education TEXT CHECK (education IN ('below_10', '10th', '12th', 'graduate', 'other')),
  english_level english_level DEFAULT 'none',
  interview_ready interview_ready DEFAULT 'no',
  experience TEXT CHECK (experience IN ('fresher', '0-1', '1-3', '3-5', '5+')),

  -- Objections & Support
  interest_level interest_level DEFAULT 'maybe',
  objections TEXT[], 
  parents_support support_status DEFAULT 'na',
  husband_support support_status DEFAULT 'na',

  -- Tech Readiness
  has_android BOOLEAN,
  has_internet BOOLEAN,
  has_smartphone BOOLEAN,

  -- Competitor Tracking
  competitor TEXT,
  currently_working BOOLEAN,
  previous_company TEXT,
  reason_for_switching TEXT,
  expected_income DECIMAL(10, 2),
  notice_period TEXT,

  -- Follow-up
  next_followup TIMESTAMPTZ,
  reminder_time TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (contact_id) -- A contact can only have one active opportunity profile at a time
);

CREATE INDEX idx_opportunities_workspace ON opportunities(workspace_id);
CREATE INDEX idx_opportunities_status ON opportunities(workspace_id, status);
CREATE INDEX idx_opportunities_opportunity_type ON opportunities(opportunity_type_id);
CREATE INDEX idx_opportunities_score ON opportunities(workspace_id, score DESC);
CREATE INDEX idx_opportunities_followup ON opportunities(workspace_id, next_followup) WHERE next_followup IS NOT NULL;

-- =============================================================================
-- REFERRALS (Network Growth Entity)
-- =============================================================================

CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES contacts(id),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id),
  
  status referral_status DEFAULT 'pending',
  reward_amount DECIMAL(10, 2) DEFAULT 0,
  reward_status reward_status DEFAULT 'pending',
  payment_date TIMESTAMPTZ,
  payment_reference TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (opportunity_id) -- A opportunity can only be referred once
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);

-- =============================================================================
-- CONTACT SERVICES (Many-to-Many)
-- =============================================================================

CREATE TABLE contact_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  UNIQUE (contact_id, service_name)
);

CREATE INDEX idx_contact_services_contact ON contact_services(contact_id);

-- =============================================================================
-- CONTACT DOCUMENTS
-- =============================================================================

CREATE TABLE contact_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('aadhaar', 'pan', 'bank', 'photo')),
  status doc_status DEFAULT 'pending',
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (contact_id, doc_type)
);

CREATE INDEX idx_contact_documents_contact ON contact_documents(contact_id);

-- =============================================================================
-- CONTACT ACTIVITIES (Unified Timeline)
-- =============================================================================

CREATE TABLE contact_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_contact ON contact_activities(contact_id, created_at DESC);
CREATE INDEX idx_activities_workspace ON contact_activities(workspace_id, created_at DESC);
CREATE INDEX idx_activities_type ON contact_activities(workspace_id, activity_type, created_at DESC);



-- =============================================================================
-- INCENTIVES (Decision #16)
-- =============================================================================

CREATE TABLE incentives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  contact_id UUID REFERENCES contacts(id),
  category TEXT NOT NULL CHECK (category IN ('walk_in', 'referral', 'experienced_referral', 'training_completed')),
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  earned_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_incentives_user ON incentives(user_id, earned_at DESC);
CREATE INDEX idx_incentives_workspace ON incentives(workspace_id, earned_at DESC);

-- =============================================================================
-- USER PROFILES (Decision #17 + #18 Gamification)
-- =============================================================================

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  level gamification_level DEFAULT 'bronze',
  total_points INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  badges JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- OFFLINE SYNC QUEUE (Decision #2)
-- =============================================================================

CREATE TABLE sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  payload JSONB NOT NULL,
  synced BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

CREATE INDEX idx_sync_queue_user ON sync_queue(user_id, synced, created_at);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Security Definer Function to bypass RLS recursion for workspace lookups
CREATE OR REPLACE FUNCTION get_user_workspaces()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid();
$$;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER opportunities_updated_at BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER referrals_updated_at BEFORE UPDATE ON referrals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER workspaces_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER opportunity_types_updated_at BEFORE UPDATE ON opportunity_types FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER contact_documents_updated_at BEFORE UPDATE ON contact_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Candidate score calculation (Decision #8, updated for Recruitment Intelligence)
CREATE OR REPLACE FUNCTION calculate_opportunity_score(opportunity_row opportunities)
RETURNS INT AS $$
DECLARE
  score INT := 0;
BEGIN
  -- Interest (30 points)
  CASE opportunity_row.interest_level
    WHEN 'very_interested' THEN score := score + 30;
    WHEN 'interested' THEN score := score + 20;
    WHEN 'maybe' THEN score := score + 10;
    ELSE score := score + 0;
  END CASE;

  -- Skills (30 points: English 15, Experience 15)
  CASE opportunity_row.english_level
    WHEN 'good' THEN score := score + 15;
    WHEN 'intermediate' THEN score := score + 10;
    WHEN 'basic' THEN score := score + 5;
    ELSE score := score + 0;
  END CASE;

  CASE opportunity_row.experience
    WHEN '5+' THEN score := score + 15;
    WHEN '3-5' THEN score := score + 12;
    WHEN '1-3' THEN score := score + 9;
    WHEN '0-1' THEN score := score + 5;
    ELSE score := score + 0;
  END CASE;

  -- Readiness (20 points)
  IF opportunity_row.has_smartphone = TRUE THEN score := score + 10; END IF;
  
  IF opportunity_row.education IS NOT NULL AND opportunity_row.education != 'below_10' THEN
    score := score + 10;
  END IF;

  -- Support (10 points)
  IF opportunity_row.parents_support = 'yes' THEN score := score + 5; END IF;
  IF opportunity_row.husband_support = 'yes' OR opportunity_row.husband_support = 'na' THEN score := score + 5; END IF;

  score := LEAST(score, 100);

  RETURN score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Auto-calculate score on insert/update
CREATE OR REPLACE FUNCTION auto_score_opportunity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.score := calculate_opportunity_score(NEW);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER opportunities_auto_score BEFORE INSERT OR UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION auto_score_opportunity();

-- Contact Health Triggers

CREATE OR REPLACE FUNCTION update_contact_last_interaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE contacts SET last_interaction_date = NEW.created_at WHERE id = NEW.contact_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_last_interaction AFTER INSERT ON contact_activities FOR EACH ROW EXECUTE FUNCTION update_contact_last_interaction();

CREATE OR REPLACE FUNCTION update_contact_referral_metrics()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE contacts 
    SET total_referrals = total_referrals + 1 
    WHERE id = NEW.referrer_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'successful' AND NEW.status = 'successful' THEN
      UPDATE contacts 
      SET total_successful_referrals = total_successful_referrals + 1 
      WHERE id = NEW.referrer_id;
    END IF;
    IF OLD.reward_status != 'paid' AND NEW.reward_status = 'paid' THEN
      UPDATE contacts 
      SET lifetime_referral_rewards = lifetime_referral_rewards + NEW.reward_amount 
      WHERE id = NEW.referrer_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_referral_metrics AFTER INSERT OR UPDATE ON referrals FOR EACH ROW EXECUTE FUNCTION update_contact_referral_metrics();

-- Duplicate detection function
CREATE OR REPLACE FUNCTION check_duplicate_contact(
  p_workspace_id UUID,
  p_phone TEXT,
  p_whatsapp TEXT DEFAULT NULL,
  p_name TEXT DEFAULT NULL,
  p_area TEXT DEFAULT NULL
)
RETURNS TABLE(id UUID, name TEXT, phone TEXT, match_type TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name, c.phone,
    CASE
      WHEN c.phone = p_phone THEN 'phone'
      WHEN c.whatsapp = p_whatsapp AND p_whatsapp IS NOT NULL THEN 'whatsapp'
      WHEN c.name = p_name AND c.current_area = p_area AND p_name IS NOT NULL AND p_area IS NOT NULL THEN 'name_area'
    END AS match_type
  FROM contacts c
  WHERE c.workspace_id = p_workspace_id
    AND c.is_deleted = FALSE
    AND (
      c.phone = p_phone
      OR (p_whatsapp IS NOT NULL AND c.whatsapp = p_whatsapp)
      OR (p_name IS NOT NULL AND p_area IS NOT NULL AND c.name = p_name AND c.current_area = p_area)
    );
END;
$$ LANGUAGE plpgsql;

-- End-Day Rollover Logic (Decision #25: Shift to Edge Compute)
CREATE OR REPLACE FUNCTION rollover_end_day(p_user_id UUID, p_workspace_id UUID)
RETURNS INT AS $$
DECLARE
  rolled_over_count INT := 0;
  tomorrow_morning TIMESTAMPTZ := date_trunc('day', NOW() + INTERVAL '1 day') + INTERVAL '9 hours';
BEGIN
  -- Roll over all tasks where next_followup is in the past
  WITH updated AS (
    UPDATE opportunities
    SET 
      next_followup = tomorrow_morning,
      updated_at = NOW()
    WHERE 
      workspace_id = p_workspace_id
      AND next_followup < NOW()
      AND contact_id IN (SELECT id FROM contacts WHERE created_by = p_user_id AND is_deleted = FALSE)
    RETURNING id
  )
  SELECT count(*) INTO rolled_over_count FROM updated;

  RETURN rolled_over_count;
END;
$$ LANGUAGE plpgsql;

-- Dashboard Metrics RPC
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
  WHERE workspace_id = p_workspace_id AND created_by = p_user_id AND date_trunc('day', created_at) = date_trunc('day', NOW());

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
  SELECT COUNT(*) INTO v_paid_referrals FROM referrals WHERE workspace_id = p_workspace_id AND reward_status = 'paid';

  RETURN jsonb_build_object(
    'mission', jsonb_build_object('walkinsToday', v_walkins_today, 'followupsPending', v_followups_pending, 'targetRemaining', v_target_remaining),
    'contacts', jsonb_build_object('total', v_total_contacts, 'active', v_active_contacts),
    'referrals', jsonb_build_object('pending', v_pending_referrals, 'paid', v_paid_referrals)
  );
END;
$$;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE incentives ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_snapshots ENABLE ROW LEVEL SECURITY;

-- Workspace: users can see workspaces they are members of
CREATE POLICY workspace_select ON workspaces FOR SELECT
  USING (id IN (SELECT get_user_workspaces()));

-- Workspace Members: users can see members of their workspaces
CREATE POLICY workspace_members_select ON workspace_members FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspaces()));

-- Campaigns
CREATE POLICY opportunity_types_select ON opportunity_types FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspaces()));

CREATE POLICY opportunity_types_all ON opportunity_types FOR ALL
  USING (workspace_id IN (SELECT get_user_workspaces()) AND auth.uid() IN (SELECT user_id FROM workspace_members WHERE workspace_id = opportunity_types.workspace_id AND role IN ('owner', 'admin')));

-- Contacts: users can CRUD contacts in their workspace
CREATE POLICY contacts_select ON contacts FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspaces()));

CREATE POLICY contacts_insert ON contacts FOR INSERT
  WITH CHECK (workspace_id IN (SELECT get_user_workspaces()));

CREATE POLICY contacts_update ON contacts FOR UPDATE
  USING (workspace_id IN (SELECT get_user_workspaces()));

CREATE POLICY contacts_delete ON contacts FOR DELETE
  USING (workspace_id IN (SELECT get_user_workspaces()));

-- Candidates
CREATE POLICY opportunities_all ON opportunities FOR ALL
  USING (workspace_id IN (SELECT get_user_workspaces()));

-- Referrals
CREATE POLICY referrals_all ON referrals FOR ALL
  USING (workspace_id IN (SELECT get_user_workspaces()));

-- Contact Services
CREATE POLICY contact_services_all ON contact_services FOR ALL
  USING (contact_id IN (SELECT id FROM contacts WHERE workspace_id IN (SELECT get_user_workspaces())));

-- Contact Documents
CREATE POLICY contact_documents_all ON contact_documents FOR ALL
  USING (contact_id IN (SELECT id FROM contacts WHERE workspace_id IN (SELECT get_user_workspaces())));

-- Contact Activities
CREATE POLICY contact_activities_select ON contact_activities FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspaces()));

CREATE POLICY "Users can create contact activities" ON contact_activities FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Daily Snapshots
CREATE POLICY "Users can view their own snapshots" ON daily_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create snapshots" ON daily_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Incentives
CREATE POLICY incentives_select ON incentives FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspaces()));

CREATE POLICY incentives_insert ON incentives FOR INSERT
  WITH CHECK (workspace_id IN (SELECT get_user_workspaces()));

-- User Profiles
CREATE POLICY user_profiles_select ON user_profiles FOR SELECT
  USING (TRUE);

CREATE POLICY user_profiles_update ON user_profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY user_profiles_insert ON user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Sync Queue
CREATE POLICY sync_queue_all ON sync_queue FOR ALL
  USING (user_id = auth.uid());

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Default workspace will be created via the app on first login

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload avatars." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own avatars." ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() = owner);

