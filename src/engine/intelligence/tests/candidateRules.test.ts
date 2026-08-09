// @ts-ignore
import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'
import {
  isCandidateCold,
  isStale,
  getHealth,
  getPriorityLevel,
  getNextAction,
  getRiskLevel,
  type CandidateData
} from '../rules/candidateRules'

describe('Candidate Intelligence Engine - Rules', () => {
  const today = dayjs('2026-08-10')

  const baseCandidate: CandidateData = {
    id: '1',
    name: 'Test Candidate',
    stage: 'lead',
    status: 'new',
    lastContactedAt: null,
    lastActivityAt: null,
    stageUpdatedAt: null,
    nextFollowUp: null,
    interviewDate: null,
    interviewStatus: null,
    rechargeAmount: 0,
    rechargeStatus: null,
  }

  describe('isCandidateCold', () => {
    it('returns true for a lead not contacted recently', () => {
      const c = { ...baseCandidate, lastContactedAt: today.subtract(6, 'day').toISOString() }
      expect(isCandidateCold(c, today)).toBe(true)
    })

    it('returns false for a lead contacted recently', () => {
      const c = { ...baseCandidate, lastContactedAt: today.subtract(2, 'day').toISOString() }
      expect(isCandidateCold(c, today)).toBe(false)
    })

    it('returns false for a joined candidate regardless of contact', () => {
      const c = { ...baseCandidate, stage: 'activated', lastContactedAt: today.subtract(30, 'day').toISOString() }
      expect(isCandidateCold(c, today)).toBe(false)
    })
  })

  describe('isStale', () => {
    it('returns true if no activity, no stage change, and no follow up', () => {
      const c = { ...baseCandidate, lastActivityAt: today.subtract(12, 'day').toISOString(), stageUpdatedAt: today.subtract(12, 'day').toISOString() }
      expect(isStale(c, today)).toBe(true)
    })

    it('returns false if there is an upcoming follow up', () => {
      const c = { ...baseCandidate, lastActivityAt: today.subtract(12, 'day').toISOString(), stageUpdatedAt: today.subtract(12, 'day').toISOString(), nextFollowUp: today.add(1, 'day').toISOString() }
      expect(isStale(c, today)).toBe(false)
    })
  })

  describe('getHealth', () => {
    it('returns Critical for recharge overdue', () => {
      const c = { ...baseCandidate, stage: 'recharge_pending', stageUpdatedAt: today.subtract(5, 'day').toISOString() }
      expect(getHealth(c, today)).toBe('Critical')
    })

    it('returns Warning if follow up is overdue', () => {
      const c = { ...baseCandidate, lastActivityAt: today.toISOString(), nextFollowUp: today.subtract(1, 'day').toISOString() }
      expect(getHealth(c, today)).toBe('Warning')
    })

    it('returns Completed for activated candidate', () => {
      const c = { ...baseCandidate, stage: 'activated' }
      expect(getHealth(c, today)).toBe('Completed')
    })
  })

  describe('getPriorityLevel', () => {
    it('returns P0 for pending recharge', () => {
      const c = { ...baseCandidate, stage: 'recharge_pending' }
      expect(getPriorityLevel(c, today)).toBe('P0')
    })

    it('returns P1 for uncontacted lead', () => {
      const c = { ...baseCandidate }
      expect(getPriorityLevel(c, today)).toBe('P1')
    })

    it('returns P2 as default', () => {
      const c = { ...baseCandidate, lastContactedAt: today.subtract(3, 'day').toISOString() }
      expect(getPriorityLevel(c, today)).toBe('P2')
    })
  })

  describe('getNextAction', () => {
    it('returns Call Candidate for uncontacted lead', () => {
      expect(getNextAction(baseCandidate, today)).toBe('Call Candidate')
    })

    it('returns Confirm Interview if interview is tomorrow', () => {
      const c = { ...baseCandidate, stage: 'interview', interviewDate: today.add(1, 'day').toISOString(), interviewStatus: 'scheduled' }
      expect(getNextAction(c, today)).toBe('Confirm Interview')
    })
  })

  describe('getRiskLevel', () => {
    it('returns Critical if interview missed (no_show)', () => {
      const c = { ...baseCandidate, interviewStatus: 'no_show' }
      expect(getRiskLevel(c, today)).toBe('Critical')
    })

    it('returns High if lead is cold', () => {
      const c = { ...baseCandidate, lastContactedAt: today.subtract(10, 'day').toISOString() }
      expect(getRiskLevel(c, today)).toBe('High')
    })
  })
})
