import type { CandidateData } from '@/engine/intelligence/rules/candidateRules'
import type { AutomationTask } from '@/engine/automation/types'
import type { DailyMission } from '@/engine/intelligence/types'

export const mockCandidates: CandidateData[] = [
  {
    id: 'c1',
    name: 'Alice Smith',
    stage: 'lead',
    lastContactedAt: '2026-08-01T10:00:00.000Z',
    completedAt: '2026-08-07T14:30:00Z',
  } as unknown as CandidateData,
  {
    id: 'c2',
    name: 'Bob Jones',
    stage: 'activated',
    lastContactedAt: '2026-07-27T10:00:00.000Z',
    stageUpdatedAt: '2026-07-22T10:00:00.000Z',
  } as unknown as CandidateData
]

export const mockContacts = [
  { id: 'c1', phone: '1234567890' },
  { id: 'c2', phone: '0987654321' }
]

export const mockInterviews = [
  { id: 'i1', contact_id: 'c1', interview_date: '2026-08-01T12:00:00.000Z', status: 'scheduled' }
]

export const mockFollowUps = [
  { id: 'f1', contact_id: 'c2', follow_up_date: '2026-07-29T10:00:00.000Z', status: 'pending' }
]

export const mockAutomations: AutomationTask[] = [
  { id: 'a1', type: 'Escalation', title: 'Overdue', targetId: 'c2', priority: 'P0', status: 'pending', createdAt: '2026-08-01T08:00:00.000Z' } as unknown as AutomationTask
]

export const mockMission: DailyMission = {
  callsToMake: 5,
  interviewsToConfirm: 2,
  rechargesToCollect: 4,
  referralsToAsk: 2,
  totalActionable: 8
} as unknown as DailyMission
