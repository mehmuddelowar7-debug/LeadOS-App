-- =============================================================================
-- SPRINT 5A: OMNI-CHANNEL MARKETING DATA MODEL
-- Foundation for Lead Acquisition Operating System
-- =============================================================================

-- 1. Create Enum Types
CREATE TYPE marketing_source_type AS ENUM (
  'instagram',
  'facebook',
  'meta_ads',
  'google_ads',
  'field',
  'agent',
  'walk_in',
  'referral',
  'whatsapp',
  'organic',
  'manual'
);

CREATE TYPE marketing_campaign_status AS ENUM (
  'active',
  'paused',
  'completed'
);

CREATE TYPE marketing_creative_type AS ENUM (
  'image',
  'video',
  'carousel',
  'text'
);

CREATE TYPE marketing_touchpoint_type AS ENUM (
  'lead_created',
  'reel_viewed',
  'story_viewed',
  'ad_clicked',
  'dm_sent',
  'phone_called',
  'followup',
  'interview',
  'selected',
  'recharge',
  'joined',
  'lost'
);

CREATE TYPE marketing_source_system AS ENUM (
  'manual',
  'meta_api',
  'google_ads_api',
  'csv_import',
  'google_form',
  'whatsapp',
  'system'
);

CREATE TYPE marketing_import_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed'
);

-- =============================================================================
-- 2. Core Hierarchy Tables
-- =============================================================================

-- MARKETING SOURCES (The Root)
CREATE TABLE marketing_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type marketing_source_type NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MARKETING CAMPAIGNS (Optional, belongs to Source)
CREATE TABLE marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID NOT NULL REFERENCES marketing_sources(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status marketing_campaign_status DEFAULT 'active',
  budget DECIMAL(12, 2),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MARKETING AD SETS (Optional, belongs to Campaign)
CREATE TABLE marketing_ad_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_audience JSONB DEFAULT '{}',
  daily_budget DECIMAL(12, 2),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MARKETING CREATIVES (Optional, belongs to Ad Set or Campaign directly)
CREATE TABLE marketing_creatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_set_id UUID REFERENCES marketing_ad_sets(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type marketing_creative_type NOT NULL,
  url TEXT,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure it belongs to at least one parent
  CONSTRAINT chk_creative_parent CHECK (ad_set_id IS NOT NULL OR campaign_id IS NOT NULL)
);

-- =============================================================================
-- 3. Analytics & Attribution Tables
-- =============================================================================

-- MARKETING ATTRIBUTIONS (The Junction, 1:1 with Contacts)
CREATE TABLE marketing_attributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL UNIQUE REFERENCES contacts(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES marketing_sources(id) ON DELETE RESTRICT,
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  ad_set_id UUID REFERENCES marketing_ad_sets(id) ON DELETE SET NULL,
  creative_id UUID REFERENCES marketing_creatives(id) ON DELETE SET NULL,
  
  -- Flexible identifier for organic/manual (e.g., "Muktadir", "Commercial Street")
  source_reference TEXT,
  
  -- Standard UTMs for web traffic
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  click_id TEXT,
  
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MARKETING TOUCHPOINTS (The Analytics Engine)
CREATE TABLE marketing_touchpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  attribution_id UUID REFERENCES marketing_attributions(id) ON DELETE SET NULL,
  event_type marketing_touchpoint_type NOT NULL,
  source_system marketing_source_system NOT NULL DEFAULT 'system',
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MARKETING DAILY METRICS (For external API ingestion)
CREATE TABLE marketing_daily_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  spend DECIMAL(12, 2) DEFAULT 0,
  reach INT DEFAULT 0,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  cpc DECIMAL(10, 4) DEFAULT 0,
  cpm DECIMAL(10, 4) DEFAULT 0,
  ctr DECIMAL(5, 4) DEFAULT 0,
  leads INT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, date)
);

-- MARKETING IMPORTS (Audit log for external integrations)
CREATE TABLE marketing_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- e.g., 'meta_api', 'google_ads_api', 'csv'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status marketing_import_status DEFAULT 'pending',
  records_processed INT DEFAULT 0,
  records_inserted INT DEFAULT 0,
  records_updated INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 4. Indexes for Analytics Performance
-- =============================================================================

CREATE INDEX idx_marketing_sources_workspace ON marketing_sources(workspace_id);
CREATE INDEX idx_marketing_campaigns_source ON marketing_campaigns(source_id);
CREATE INDEX idx_marketing_ad_sets_campaign ON marketing_ad_sets(campaign_id);
CREATE INDEX idx_marketing_creatives_ad_set ON marketing_creatives(ad_set_id);
CREATE INDEX idx_marketing_creatives_campaign ON marketing_creatives(campaign_id);

CREATE INDEX idx_marketing_attributions_contact ON marketing_attributions(contact_id);
CREATE INDEX idx_marketing_attributions_source ON marketing_attributions(source_id, campaign_id);
CREATE INDEX idx_marketing_touchpoints_contact_type ON marketing_touchpoints(contact_id, event_type);
CREATE INDEX idx_marketing_touchpoints_timestamp ON marketing_touchpoints(timestamp);
CREATE INDEX idx_marketing_daily_metrics_campaign_date ON marketing_daily_metrics(campaign_id, date);
CREATE INDEX idx_marketing_imports_workspace ON marketing_imports(workspace_id);

-- =============================================================================
-- 5. Row Level Security (RLS)
-- =============================================================================

ALTER TABLE marketing_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_ad_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_touchpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_imports ENABLE ROW LEVEL SECURITY;

-- Sources RLS
CREATE POLICY "Users can view workspace sources" ON marketing_sources FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert workspace sources" ON marketing_sources FOR INSERT WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can update workspace sources" ON marketing_sources FOR UPDATE USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- Campaigns RLS
CREATE POLICY "Users can view workspace campaigns" ON marketing_campaigns FOR SELECT USING (source_id IN (SELECT id FROM marketing_sources WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())));
CREATE POLICY "Users can insert workspace campaigns" ON marketing_campaigns FOR INSERT WITH CHECK (source_id IN (SELECT id FROM marketing_sources WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())));
CREATE POLICY "Users can update workspace campaigns" ON marketing_campaigns FOR UPDATE USING (source_id IN (SELECT id FROM marketing_sources WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())));

-- Ad Sets RLS
CREATE POLICY "Users can view workspace ad sets" ON marketing_ad_sets FOR SELECT USING (campaign_id IN (SELECT id FROM marketing_campaigns WHERE source_id IN (SELECT id FROM marketing_sources WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))));
CREATE POLICY "Users can insert workspace ad sets" ON marketing_ad_sets FOR INSERT WITH CHECK (campaign_id IN (SELECT id FROM marketing_campaigns WHERE source_id IN (SELECT id FROM marketing_sources WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))));
CREATE POLICY "Users can update workspace ad sets" ON marketing_ad_sets FOR UPDATE USING (campaign_id IN (SELECT id FROM marketing_campaigns WHERE source_id IN (SELECT id FROM marketing_sources WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))));

-- Creatives RLS
CREATE POLICY "Users can view workspace creatives" ON marketing_creatives FOR SELECT USING (ad_set_id IN (SELECT id FROM marketing_ad_sets WHERE campaign_id IN (SELECT id FROM marketing_campaigns WHERE source_id IN (SELECT id FROM marketing_sources WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())))) OR campaign_id IN (SELECT id FROM marketing_campaigns WHERE source_id IN (SELECT id FROM marketing_sources WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))));
CREATE POLICY "Users can insert workspace creatives" ON marketing_creatives FOR INSERT WITH CHECK (ad_set_id IN (SELECT id FROM marketing_ad_sets WHERE campaign_id IN (SELECT id FROM marketing_campaigns WHERE source_id IN (SELECT id FROM marketing_sources WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())))) OR campaign_id IN (SELECT id FROM marketing_campaigns WHERE source_id IN (SELECT id FROM marketing_sources WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))));
CREATE POLICY "Users can update workspace creatives" ON marketing_creatives FOR UPDATE USING (ad_set_id IN (SELECT id FROM marketing_ad_sets WHERE campaign_id IN (SELECT id FROM marketing_campaigns WHERE source_id IN (SELECT id FROM marketing_sources WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())))) OR campaign_id IN (SELECT id FROM marketing_campaigns WHERE source_id IN (SELECT id FROM marketing_sources WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))));

-- Attributions RLS
CREATE POLICY "Users can view workspace attributions" ON marketing_attributions FOR SELECT USING (contact_id IN (SELECT id FROM contacts WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())));
CREATE POLICY "Users can insert workspace attributions" ON marketing_attributions FOR INSERT WITH CHECK (contact_id IN (SELECT id FROM contacts WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())));
CREATE POLICY "Users can update workspace attributions" ON marketing_attributions FOR UPDATE USING (contact_id IN (SELECT id FROM contacts WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())));

-- Touchpoints RLS
CREATE POLICY "Users can view workspace touchpoints" ON marketing_touchpoints FOR SELECT USING (attribution_id IN (SELECT id FROM marketing_attributions WHERE contact_id IN (SELECT id FROM contacts WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))));
CREATE POLICY "Users can insert workspace touchpoints" ON marketing_touchpoints FOR INSERT WITH CHECK (attribution_id IN (SELECT id FROM marketing_attributions WHERE contact_id IN (SELECT id FROM contacts WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))));
CREATE POLICY "Users can update workspace touchpoints" ON marketing_touchpoints FOR UPDATE USING (attribution_id IN (SELECT id FROM marketing_attributions WHERE contact_id IN (SELECT id FROM contacts WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))));

-- Daily Metrics RLS
CREATE POLICY "Users can view workspace daily metrics" ON marketing_daily_metrics FOR SELECT USING (campaign_id IN (SELECT id FROM marketing_campaigns WHERE source_id IN (SELECT id FROM marketing_sources WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))));
CREATE POLICY "Users can insert workspace daily metrics" ON marketing_daily_metrics FOR INSERT WITH CHECK (campaign_id IN (SELECT id FROM marketing_campaigns WHERE source_id IN (SELECT id FROM marketing_sources WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))));
CREATE POLICY "Users can update workspace daily metrics" ON marketing_daily_metrics FOR UPDATE USING (campaign_id IN (SELECT id FROM marketing_campaigns WHERE source_id IN (SELECT id FROM marketing_sources WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))));

-- Imports RLS
CREATE POLICY "Users can view workspace imports" ON marketing_imports FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert workspace imports" ON marketing_imports FOR INSERT WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can update workspace imports" ON marketing_imports FOR UPDATE USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
