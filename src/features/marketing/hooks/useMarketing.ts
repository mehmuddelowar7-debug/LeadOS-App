import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/AuthStore'
import { 
  fetchMarketingSources, 
  fetchMarketingCampaigns, 
  fetchMarketingCreatives, 
  fetchCandidateJourney,
  fetchMarketingImports 
} from '../queries/marketingQueries'

export const useMarketingSources = () => {
  const user = useAuthStore(state => state.user)
  const workspaceId = user?.user_metadata?.workspace_id || '00000000-0000-0000-0000-000000000000'
  
  return useQuery({
    queryKey: ['marketingSources', workspaceId],
    queryFn: () => fetchMarketingSources(workspaceId),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useMarketingCampaigns = (sourceId: string) => {
  return useQuery({
    queryKey: ['marketingCampaigns', sourceId],
    queryFn: () => fetchMarketingCampaigns(sourceId),
    enabled: !!sourceId,
    staleTime: 5 * 60 * 1000,
  })
}

export const useMarketingCreatives = (campaignId: string) => {
  return useQuery({
    queryKey: ['marketingCreatives', campaignId],
    queryFn: () => fetchMarketingCreatives(campaignId),
    enabled: !!campaignId,
    staleTime: 5 * 60 * 1000,
  })
}

export const useCandidateJourney = (attributionId: string) => {
  return useQuery({
    queryKey: ['candidateJourney', attributionId],
    queryFn: () => fetchCandidateJourney(attributionId),
    enabled: !!attributionId,
    staleTime: 5 * 60 * 1000,
  })
}

export const useMarketingImports = () => {
  const user = useAuthStore(state => state.user)
  const workspaceId = user?.user_metadata?.workspace_id || '00000000-0000-0000-0000-000000000000'
  
  return useQuery({
    queryKey: ['marketingImports', workspaceId],
    queryFn: () => fetchMarketingImports(workspaceId),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  })
}

export const useMarketing = () => {
  const { data: sources = [], dataUpdatedAt: sourcesRev } = useMarketingSources()
  
  // To keep this simple for the AI engine context builder, we'll just return sources 
  // and mock empty campaigns/touchpoints since they normally require specific IDs.
  // In a real implementation, you might fetch all campaigns for the workspace.
  return {
    sources,
    campaigns: [],
    touchpoints: [],
    dataUpdatedAt: sourcesRev
  }
}
