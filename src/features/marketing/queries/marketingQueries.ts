import { supabase } from '@/lib/supabase'
import type { 
  MarketingSource, 
  MarketingCampaign, 
  MarketingCreative, 
  MarketingTouchpoint, 
  MarketingImport 
} from '../types'

export const fetchMarketingSources = async (workspaceId: string): Promise<MarketingSource[]> => {
  const { data, error } = await supabase
    .from('marketing_sources')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('name')
  
  if (error) throw error
  return data as MarketingSource[]
}

export const fetchMarketingCampaigns = async (sourceId: string): Promise<MarketingCampaign[]> => {
  const { data, error } = await supabase
    .from('marketing_campaigns')
    .select('*')
    .eq('source_id', sourceId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as MarketingCampaign[]
}

export const fetchMarketingCreatives = async (campaignId: string): Promise<MarketingCreative[]> => {
  const { data, error } = await supabase
    .from('marketing_creatives')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('name')
  
  if (error) throw error
  return data as MarketingCreative[]
}

export const fetchCandidateJourney = async (attributionId: string): Promise<MarketingTouchpoint[]> => {
  const { data, error } = await supabase
    .from('marketing_touchpoints')
    .select('*')
    .eq('attribution_id', attributionId)
    .order('timestamp', { ascending: true })
  
  if (error) throw error
  return data as MarketingTouchpoint[]
}

export const fetchMarketingImports = async (workspaceId: string): Promise<MarketingImport[]> => {
  const { data, error } = await supabase
    .from('marketing_imports')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('started_at', { ascending: false })
  
  if (error) throw error
  return data as MarketingImport[]
}
