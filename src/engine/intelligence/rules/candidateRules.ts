import dayjs from 'dayjs'
import { RULES } from '../constants/intelligenceRules'
import type { CandidateHealth, PriorityLevel, NextAction, RiskLevel } from '../types'

/**
 * A generic candidate type to decouple from the DB types.
 * This represents the merged data of Contact + Opportunity + Latest Activity.
 */
export interface CandidateData {
  id: string
  name: string
  stage: string // 'lead', 'interview', 'selected', 'recharge_pending', 'registration', 'training', 'completed', 'activated', 'lost'
  status: string // more specific status if any, e.g. 'interview_scheduled'
  lastContactedAt: string | null
  lastActivityAt: string | null
  stageUpdatedAt: string | null
  nextFollowUp: string | null
  interviewDate: string | null
  interviewStatus: string | null // 'scheduled', 'attended', 'no_show', 'cancelled'
  rechargeAmount: number
  rechargeStatus: string | null // 'pending', 'paid'
}

export function isCandidateCold(candidate: CandidateData, today: dayjs.Dayjs): boolean {
  if (!candidate.lastContactedAt) return true // Never contacted -> cold by definition? The prompt says "Lead 5 days -> Cold". Let's assume if no contact, it's measured from creation, but here we can just say if days > rule.

  const daysSinceContact = today.diff(dayjs(candidate.lastContactedAt), 'day')

  switch (candidate.stage) {
    case 'lead':
      return daysSinceContact >= RULES.leadColdDays
    case 'interview':
    case 'registration':
      return daysSinceContact >= RULES.interviewColdDays
    case 'selected':
      return daysSinceContact >= RULES.selectedColdDays
    case 'recharge_pending':
      return daysSinceContact >= RULES.rechargeColdDays
    case 'training':
    case 'completed':
    case 'activated':
      return false // Joined / activated never cold
    case 'lost':
      return false // Ignore lost
    default:
      return daysSinceContact >= RULES.leadColdDays
  }
}

export function isStale(candidate: CandidateData, today: dayjs.Dayjs): boolean {
  // Logic: No activity AND No follow-up AND Stage unchanged for configured threshold
  const daysSinceActivity = candidate.lastActivityAt ? today.diff(dayjs(candidate.lastActivityAt), 'day') : RULES.staleDays + 1
  const daysSinceStageChange = candidate.stageUpdatedAt ? today.diff(dayjs(candidate.stageUpdatedAt), 'day') : RULES.staleDays + 1
  
  const hasPendingFollowUp = candidate.nextFollowUp && dayjs(candidate.nextFollowUp).isAfter(today)

  return daysSinceActivity >= RULES.staleDays && 
         daysSinceStageChange >= RULES.staleStageDays && 
         !hasPendingFollowUp
}

export function getHealth(candidate: CandidateData, today: dayjs.Dayjs): CandidateHealth {
  if (candidate.stage === 'lost' || candidate.stage === 'activated' || candidate.stage === 'completed' || candidate.stage === 'training') {
    return 'Completed'
  }

  // Critical checks
  if (candidate.stage === 'recharge_pending') {
    const daysInRecharge = candidate.stageUpdatedAt ? today.diff(dayjs(candidate.stageUpdatedAt), 'day') : 0
    if (daysInRecharge >= RULES.rechargeOverdueDays) {
      return 'Critical'
    }
  }

  if (candidate.interviewStatus === 'no_show' || (candidate.interviewDate && dayjs(candidate.interviewDate).isBefore(today, 'day') && candidate.interviewStatus === 'scheduled')) {
    return 'Critical'
  }

  const daysSinceActivity = candidate.lastActivityAt ? today.diff(dayjs(candidate.lastActivityAt), 'day') : RULES.staleDays + 1
  if (daysSinceActivity >= RULES.staleDays) {
    return 'Critical'
  }

  // Warning checks
  if (candidate.nextFollowUp && dayjs(candidate.nextFollowUp).isBefore(today, 'day')) {
    return 'Warning'
  }

  const daysSinceStageChange = candidate.stageUpdatedAt ? today.diff(dayjs(candidate.stageUpdatedAt), 'day') : 0
  if (daysSinceStageChange >= RULES.staleStageDays) {
    return 'Warning'
  }

  // Otherwise
  return 'Healthy'
}

export function getPriorityLevel(candidate: CandidateData, today: dayjs.Dayjs): PriorityLevel {
  // P0
  if (candidate.stage === 'recharge_pending') return 'P0'
  if (candidate.interviewDate && dayjs(candidate.interviewDate).isSame(today, 'day')) return 'P0'
  if (candidate.nextFollowUp && dayjs(candidate.nextFollowUp).isBefore(today, 'day')) return 'P0'

  // P1
  if (candidate.stage === 'lead' && !candidate.lastContactedAt) return 'P1'
  if (candidate.interviewDate && dayjs(candidate.interviewDate).isSame(today.add(1, 'day'), 'day')) return 'P1'
  if (candidate.stage === 'selected' || candidate.stage === 'registration') return 'P1'

  // P3
  if (candidate.stage === 'lost' || candidate.stage === 'activated' || candidate.stage === 'completed' || candidate.stage === 'training') return 'P3'
  if (candidate.lastContactedAt && today.diff(dayjs(candidate.lastContactedAt), 'day') < 2) return 'P3'

  // P2
  return 'P2'
}

export function getNextAction(candidate: CandidateData, today: dayjs.Dayjs): NextAction {
  if (candidate.stage === 'lost') return 'Archive'
  if (candidate.stage === 'activated' || candidate.stage === 'completed') return 'Ask for Referral'
  if (candidate.stage === 'training') return 'Nothing'
  
  if (candidate.stage === 'recharge_pending') return 'Collect Recharge'
  
  if (candidate.interviewDate) {
    if (dayjs(candidate.interviewDate).isSame(today, 'day') || dayjs(candidate.interviewDate).isSame(today.add(1, 'day'), 'day')) {
      if (candidate.interviewStatus === 'scheduled') return 'Confirm Interview'
    }
  }

  if (candidate.stage === 'selected' || candidate.stage === 'registration') return 'Mark Joined' // or Collect Recharge depending on specific state, handled above

  if (candidate.stage === 'lead') {
    if (!candidate.lastContactedAt) return 'Call Candidate'
    return 'Schedule Interview'
  }

  if (candidate.nextFollowUp && (dayjs(candidate.nextFollowUp).isBefore(today, 'day') || dayjs(candidate.nextFollowUp).isSame(today, 'day'))) return 'Call Candidate'

  return 'Call Candidate'
}

export function getRiskLevel(candidate: CandidateData, today: dayjs.Dayjs): RiskLevel {
  if (candidate.stage === 'lost') return 'Critical'
  
  if (candidate.stage === 'recharge_pending') {
    const daysInRecharge = candidate.stageUpdatedAt ? today.diff(dayjs(candidate.stageUpdatedAt), 'day') : 0
    if (daysInRecharge >= RULES.rechargeOverdueDays) return 'Critical'
    if (daysInRecharge >= 1) return 'High'
  }

  if (candidate.interviewStatus === 'no_show') return 'Critical'
  
  if (candidate.lastContactedAt && today.diff(dayjs(candidate.lastContactedAt), 'day') >= RULES.leadColdDays) {
    return 'High'
  }

  const daysSinceStageChange = candidate.stageUpdatedAt ? today.diff(dayjs(candidate.stageUpdatedAt), 'day') : 0
  if (daysSinceStageChange >= RULES.staleStageDays) return 'Medium'

  return 'Low'
}
