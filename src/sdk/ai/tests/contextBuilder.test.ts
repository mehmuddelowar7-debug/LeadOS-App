import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { buildCandidateGraphIndexes } from '../graph/candidateGraph'
import { buildCandidateContext } from '../builders/candidateBuilder'
import {
  mockCandidates, mockContacts, mockInterviews, mockFollowUps, mockAutomations
} from './fixtures/mockContext'

describe('AI Context Engine', () => {
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-01T12:00:00.000Z'))
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('builds candidate context correctly', () => {
    const graph = buildCandidateGraphIndexes(mockInterviews, mockFollowUps, [], [], [], [])
    const ctx = buildCandidateContext(mockCandidates, mockContacts, graph, mockAutomations, true)

    expect(ctx.index.all.length).toBe(2)
    
    const c1 = ctx.index.byId.get('c1')
    expect(c1).toBeDefined()
    expect(c1?.name).toContain('Candidate_') // Masked
    expect(c1?.phone).toBeUndefined()
    expect(c1?.interviews.length).toBe(1)
    
    const c2 = ctx.index.byId.get('c2')
    expect(c2?.followUps.length).toBe(1)
    expect(c2?.followUps[0].isOverdue).toBe(true)
    expect(c2?.slaBreached).toBe(true) // Overdue followup triggers SLA breach
  })
})
