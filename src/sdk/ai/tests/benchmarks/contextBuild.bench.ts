import { bench, describe } from 'vitest'
import { buildCandidateGraphIndexes } from '../../graph/candidateGraph'
import { buildCandidateContext } from '../../builders/candidateBuilder'
import type { CandidateData } from '@/engine/intelligence/rules/candidateRules'

describe('Candidate Context Builder Benchmark', () => {
  // Generate 500 fake candidates
  const candidates: CandidateData[] = Array.from({ length: 500 }, (_, i) => ({
    id: `c${i}`,
    name: `Candidate ${i}`,
    stage: 'lead',
    lastContactedAt: new Date().toISOString(),
    stageUpdatedAt: new Date().toISOString(),
  } as unknown as CandidateData))
  
  const contacts = Array.from({ length: 500 }, (_, i) => ({
    id: `c${i}`, phone: '555-0100'
  }))

  const interviews = Array.from({ length: 100 }, (_, i) => ({
    id: `i${i}`, contact_id: `c${i}`, interview_date: new Date().toISOString(), status: 'scheduled'
  }))

  bench('build 500 candidates', () => {
    const graph = buildCandidateGraphIndexes(interviews, [], [], [], [], [])
    buildCandidateContext(candidates, contacts, graph, [], false)
  }, { time: 1000 })
})
