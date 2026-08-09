export type MarketingSourceType = 
  | 'instagram' | 'facebook' | 'meta_ads' | 'google_ads' 
  | 'field' | 'agent' | 'walk_in' | 'referral' | 'whatsapp' 
  | 'organic' | 'manual'

export type MarketingTouchpointType = 
  | 'lead_created' | 'reel_viewed' | 'story_viewed' | 'ad_clicked' 
  | 'dm_sent' | 'phone_called' | 'followup' | 'interview' 
  | 'selected' | 'recharge' | 'joined' | 'lost'

export interface MarketingSource {
  id: string
  workspace_id: string
  name: string
  type: MarketingSourceType
  created_at: string
}

export interface MarketingCampaign {
  id: string
  source_id: string
  name: string
  status: 'active' | 'paused' | 'completed'
  budget: number | null
  created_at: string
}

export interface MarketingCreative {
  id: string
  ad_set_id?: string
  campaign_id?: string
  name: string
  type: 'image' | 'video' | 'carousel' | 'text'
  url?: string
}

export interface MarketingAttribution {
  id: string
  contact_id: string
  source_id: string
  campaign_id?: string
  creative_id?: string
  source_reference?: string
}

export interface MarketingTouchpoint {
  id: string
  contact_id: string
  attribution_id: string
  event_type: MarketingTouchpointType
  source_system: string
  timestamp: string
}

export interface MarketingImport {
  id: string
  workspace_id: string
  provider: string
  started_at: string
  completed_at?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  records_processed: number
  records_inserted: number
  records_updated: number
}
