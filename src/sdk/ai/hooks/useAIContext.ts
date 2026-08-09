import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useEventSubscription } from '../../events'
import { useCandidateIntelligence } from '@/hooks/useCandidateIntelligence'
import { useAutomationEngine } from '@/engine/automation/useAutomationEngine'
import { useMarketing } from '@/features/marketing/hooks/useMarketing'
import { useContacts } from '@/hooks/useContacts'
import { useInterviews } from '@/hooks/useInterviews'
import { useFollowUps } from '@/hooks/useFollowUps'

import { buildCandidateGraphIndexes } from '../graph/candidateGraph'
import { buildMarketingGraphIndexes } from '../graph/marketingGraph'
import { buildWorkspaceGraphIndexes } from '../graph/workspaceGraph'

import { buildCandidateContext } from '../builders/candidateBuilder'
import { buildMarketingContext } from '../builders/marketingBuilder'
import { buildOperationsContext } from '../builders/operationsBuilder'
import { buildRecruiterContext } from '../builders/recruiterBuilder'
import { buildWorkspaceContext } from '../builders/workspaceBuilder'
import { buildRecruitOSContext } from '../builders/contextBuilder'

import type { ContextSnapshot } from '../schemas/context'

export function useAIContextBuilder(workspaceId: string = 'default', masked: boolean = true): ContextSnapshot {
  const queryClient = useQueryClient()

  // Subscribe to real-time events to invalidate caches and trigger AI refresh
  useEventSubscription('candidate.created', () => {
    console.log('[AIContext] Candidate created event received. Invalidating cache...')
    queryClient.invalidateQueries({ queryKey: ['contacts'] })
    // In a real app, also invalidate candidates, opportunities, etc.
  })

  // 1. Consume existing hooks (cache reads only)
  const { candidates, mission, queues } = useCandidateIntelligence()
  // Mock revisions until proper caching is built
  const candidateRev = candidates.length
  const { automations }                                              = useAutomationEngine()
  const { sources, campaigns, touchpoints, dataUpdatedAt: marketingRev } = useMarketing()
  
  // Contacts, interviews, followUps are foundational caches
  const { data: contacts = [], dataUpdatedAt: contactsRev }     = useContacts()
  const { data: interviews = [], dataUpdatedAt: interviewsRev }   = useInterviews()
  const { data: followUps = [], dataUpdatedAt: followUpsRev }    = useFollowUps()

  // For operations and recruiter, we use a combined revision to trigger rebuilds
  const operationsRev = candidateRev + automations.length
  const workspaceRev  = contactsRev + candidateRev

  // 2. Graph Indexes
  const candidateGraph = useMemo(() => buildCandidateGraphIndexes(
    interviews, followUps, touchpoints, [], sources, campaigns
  ), [interviewsRev, followUpsRev, marketingRev, contactsRev])

  const marketingGraph = useMemo(() => buildMarketingGraphIndexes(
    sources, campaigns
  ), [marketingRev])

  const workspaceGraph = useMemo(() => buildWorkspaceGraphIndexes(
    candidates
  ), [candidateRev])

  // 3. Independent Domain Builds
  const candidateCtx = useMemo(() => buildCandidateContext(
    candidates, contacts, candidateGraph, automations, masked
  ), [candidateRev, contactsRev, candidateGraph, automations, masked])

  const marketingCtx = useMemo(() => buildMarketingContext(
    sources, campaigns, touchpoints, [], marketingGraph
  ), [marketingRev, marketingGraph])

  const operationsCtx = useMemo(() => buildOperationsContext(
    mission, queues, automations
  ), [operationsRev])

  const recruiterCtx = useMemo(() => buildRecruiterContext(
    interviews, followUps
  ), [interviewsRev, followUpsRev])

  const workspaceCtx = useMemo(() => buildWorkspaceContext(
    candidates, contacts, workspaceGraph
  ), [workspaceRev, workspaceGraph])

  // 4. Single Compose Build
  const snapshot = useMemo(() => buildRecruitOSContext({
    candidateCtx,
    marketingCtx,
    operationsCtx,
    recruiterCtx,
    workspaceCtx,
    workspaceId,
    masked,
    candidateRev,
    marketingRev,
    operationsRev,
    workspaceRev,
  }), [candidateCtx, marketingCtx, operationsCtx, recruiterCtx, workspaceCtx, workspaceId, masked])

  return snapshot
}
