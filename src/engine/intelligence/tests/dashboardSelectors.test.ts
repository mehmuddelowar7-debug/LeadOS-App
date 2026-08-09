// @ts-ignore
import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'
import {
  buildDailyMission,
  getCandidatesToCall,
  getRechargeQueue,
  getInterviewQueue,
  getRecentlyJoined,
  getNeedsReferral,
  buildRecommendations
} from '../selectors/dashboardSelectors'
import type { CandidateData } from '../rules/candidateRules'

describe('Candidate Intelligence Engine - Dashboard Selectors', () => {
  const today = dayjs('2026-08-10')

  const mockCandidates: CandidateData[] = [
    {
      id: '1',
      name: 'Uncontacted Lead',
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
    },
    {
      id: '2',
      name: 'Pending Recharge',
      stage: 'recharge_pending',
      status: 'pending',
      lastContactedAt: today.subtract(1, 'day').toISOString(),
      lastActivityAt: today.subtract(1, 'day').toISOString(),
      stageUpdatedAt: today.subtract(1, 'day').toISOString(),
      nextFollowUp: null,
      interviewDate: null,
      interviewStatus: null,
      rechargeAmount: 1000,
      rechargeStatus: 'pending',
    },
    {
      id: '3',
      name: 'Tomorrow Interview',
      stage: 'interview',
      status: 'scheduled',
      lastContactedAt: today.subtract(1, 'day').toISOString(),
      lastActivityAt: today.subtract(1, 'day').toISOString(),
      stageUpdatedAt: today.subtract(1, 'day').toISOString(),
      nextFollowUp: null,
      interviewDate: today.add(1, 'day').toISOString(),
      interviewStatus: 'scheduled',
      rechargeAmount: 0,
      rechargeStatus: null,
    },
    {
      id: '4',
      name: 'Recently Joined',
      stage: 'activated',
      status: 'active',
      lastContactedAt: today.subtract(2, 'day').toISOString(),
      lastActivityAt: today.subtract(2, 'day').toISOString(),
      stageUpdatedAt: today.subtract(2, 'day').toISOString(),
      nextFollowUp: null,
      interviewDate: null,
      interviewStatus: null,
      rechargeAmount: 0,
      rechargeStatus: null,
    }
  ]

  describe('buildDailyMission', () => {
    it('calculates the correct mission numbers', () => {
      const mission = buildDailyMission(mockCandidates, today)
      expect(mission.callsToMake).toBe(1) // Uncontacted Lead
      expect(mission.interviewsToConfirm).toBe(1) // Tomorrow Interview
      expect(mission.rechargesToCollect).toBe(1) // Pending Recharge
      expect(mission.referralsToAsk).toBe(1) // Recently Joined
    })
  })

  describe('Queue Selectors', () => {
    it('returns candidates to call', () => {
      const queue = getCandidatesToCall(mockCandidates, today)
      expect(queue.length).toBe(1)
      expect(queue[0].id).toBe('1')
    })

    it('returns recharge queue', () => {
      const queue = getRechargeQueue(mockCandidates)
      expect(queue.length).toBe(1)
      expect(queue[0].id).toBe('2')
    })

    it('returns interview queue', () => {
      const queue = getInterviewQueue(mockCandidates, today)
      expect(queue.length).toBe(1)
      expect(queue[0].id).toBe('3')
    })

    it('returns recently joined', () => {
      const queue = getRecentlyJoined(mockCandidates, today)
      expect(queue.length).toBe(1)
      expect(queue[0].id).toBe('4')
    })

    it('returns needs referral', () => {
      const queue = getNeedsReferral(mockCandidates, today)
      expect(queue.length).toBe(1)
      expect(queue[0].id).toBe('4')
    })
  })

  describe('buildRecommendations', () => {
    it('returns recommendations based on thresholds', () => {
      const recommendations = buildRecommendations(mockCandidates, today)
      // Since cold candidates < 15 and recharges < 5, it should only return upcoming interviews
      expect(recommendations.length).toBe(1)
      expect(recommendations[0].title).toBe('Upcoming Interviews')
    })

    it('triggers high volume cold recommendation', () => {
      const manyCold = Array.from({ length: 16 }).map((_, i) => ({
        ...mockCandidates[0],
        id: `cold_${i}`
      }))
      const recommendations = buildRecommendations(manyCold, today)
      const hasColdRec = recommendations.some(r => r.title === 'High Volume of Cold Candidates')
      expect(hasColdRec).toBe(true)
    })
  })
})
