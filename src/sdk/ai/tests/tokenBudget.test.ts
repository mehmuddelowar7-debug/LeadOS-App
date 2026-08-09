import { describe, it, expect } from 'vitest'
import { buildCandidateGraphIndexes } from '../graph/candidateGraph'
import { buildMarketingGraphIndexes } from '../graph/marketingGraph'
import { buildWorkspaceGraphIndexes } from '../graph/workspaceGraph'
import { buildCandidateContext } from '../builders/candidateBuilder'
import { buildMarketingContext } from '../builders/marketingBuilder'
import { buildOperationsContext } from '../builders/operationsBuilder'
import { buildRecruiterContext } from '../builders/recruiterBuilder'
import { buildWorkspaceContext } from '../builders/workspaceBuilder'
import { buildRecruitOSContext } from '../builders/contextBuilder'
import { ContextSerializer } from '../serializer/contextSerializer'
import type { CandidateData } from '@/engine/intelligence/rules/candidateRules'

describe('Gate 2: Token Budget Tests', () => {
  it('enforces maximum token constraints on serialization (small batch)', () => {
    // Generate a representative batch (5 candidates) to test token density
    const mockCandidates: CandidateData[] = Array.from({ length: 5 }, (_, i) => ({
      id: `c${i}`, name: `Candidate ${i}`, stage: 'lead',
      lastContactedAt: new Date().toISOString(), stageUpdatedAt: new Date().toISOString()
    })) as unknown as CandidateData[]
    const mockContacts = Array.from({ length: 5 }, (_, i) => ({ id: `c${i}`, phone: '555' }))

    const candidateGraph = buildCandidateGraphIndexes([], [], [], [], [], [])
    const marketingGraph = buildMarketingGraphIndexes([], [])
    const workspaceGraph = buildWorkspaceGraphIndexes(mockCandidates)

    const candidateCtx = buildCandidateContext(mockCandidates, mockContacts, candidateGraph, [], true)
    const marketingCtx = buildMarketingContext([], [], [], [], marketingGraph)
    const operationsCtx = buildOperationsContext({ callsToMake: 0, interviewsToConfirm: 0, rechargesToCollect: 0, referralsToAsk: 0, totalActionable: 0 } as unknown as any, { toCall: [], recharge: [], interviews: [] }, [])
    const recruiterCtx = buildRecruiterContext([], [])
    const workspaceCtx = buildWorkspaceContext(mockCandidates, mockContacts, workspaceGraph)

    const snapshot = buildRecruitOSContext({
      candidateCtx, marketingCtx, operationsCtx, recruiterCtx, workspaceCtx,
      workspaceId: 'test', masked: true, candidateRev: 1, marketingRev: 1, operationsRev: 1, workspaceRev: 1
    })

    // Roughly 4 chars = 1 token
    const estimateTokens = (str: string) => Math.ceil(str.length / 4)

    const candidateTokens = estimateTokens(ContextSerializer.serializeDomain(snapshot, 'candidate'))
    const operationsTokens = estimateTokens(ContextSerializer.serializeDomain(snapshot, 'operations'))
    const marketingTokens = estimateTokens(ContextSerializer.serializeDomain(snapshot, 'marketing'))
    const fullTokens = estimateTokens(ContextSerializer.compact(snapshot))

    // Assertions based on budget
    expect(candidateTokens).toBeLessThan(2500)
    expect(operationsTokens).toBeLessThan(1500)
    expect(marketingTokens).toBeLessThan(2500)
    expect(fullTokens).toBeLessThan(10000)
  })
})
