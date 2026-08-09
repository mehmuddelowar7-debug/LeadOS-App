import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
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
import {
  mockCandidates, mockContacts, mockInterviews, mockFollowUps, mockAutomations, mockMission
} from './fixtures/mockContext'

describe('Gate 1: Snapshot Compatibility Tests', () => {
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-01T12:00:00.000Z'))
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('locks the RecruitOSContext v1 schema to prevent silent regressions', async () => {
    // 1. Build Graphs
    const candidateGraph = buildCandidateGraphIndexes(mockInterviews, mockFollowUps, [], [], [], [])
    const marketingGraph = buildMarketingGraphIndexes([], [])
    const workspaceGraph = buildWorkspaceGraphIndexes(mockCandidates)

    // 2. Build Domains
    const candidateCtx = buildCandidateContext(mockCandidates, mockContacts, candidateGraph, mockAutomations, true)
    const marketingCtx = buildMarketingContext([], [], [], [], marketingGraph)
    const operationsCtx = buildOperationsContext(mockMission, { toCall: [], recharge: [], interviews: [] }, mockAutomations)
    const recruiterCtx = buildRecruiterContext(mockInterviews, mockFollowUps)
    const workspaceCtx = buildWorkspaceContext(mockCandidates, mockContacts, workspaceGraph)

    // 3. Compose (Mocking dates and IDs for deterministic snapshot)
    const snapshot = buildRecruitOSContext({
      candidateCtx, marketingCtx, operationsCtx, recruiterCtx, workspaceCtx,
      workspaceId: 'test-workspace',
      masked: true,
      candidateRev: 1, marketingRev: 1, operationsRev: 1, workspaceRev: 1
    })

    // Zero out dynamic fields for stable snapshot
    snapshot.id = 'deterministic-id'
    snapshot.createdAt = '2026-08-01T00:00:00.000Z'
    snapshot.context._metadata.generatedAt = '2026-08-01T00:00:00.000Z'
    snapshot.context._metadata.buildDurationMs = 0
    snapshot.diagnostics.forEach(diagGroup => {
      diagGroup.durationMs = 0
      diagGroup.diagnostics.forEach(d => { d.timestamp = '2026-08-01T00:00:00.000Z' })
    })

    const jsonOutput = ContextSerializer.toJSON(snapshot)
    
    // Check against frozen snapshot file
    // To update snapshot if ADR-007 is approved, run with vitest -u
    await expect(jsonOutput).toMatchFileSnapshot('./fixtures/context_v1.snapshot.json')
  })
})
