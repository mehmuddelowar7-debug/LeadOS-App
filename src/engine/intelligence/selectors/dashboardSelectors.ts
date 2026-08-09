import dayjs from 'dayjs'
import { getNextAction, isCandidateCold, isStale, type CandidateData } from '../rules/candidateRules'
import type { DailyMission, Recommendation } from '../types'

export function buildDailyMission(candidates: CandidateData[], today: dayjs.Dayjs): DailyMission {
  let callsToMake = 0
  let interviewsToConfirm = 0
  let rechargesToCollect = 0
  let referralsToAsk = 0

  for (const candidate of candidates) {
    const action = getNextAction(candidate, today)
    if (action === 'Call Candidate' || action === 'Schedule Interview') callsToMake++
    if (action === 'Confirm Interview') interviewsToConfirm++
    if (action === 'Collect Recharge') rechargesToCollect++
    if (action === 'Ask for Referral') referralsToAsk++
  }

  return {
    callsToMake,
    interviewsToConfirm,
    rechargesToCollect,
    referralsToAsk,
  }
}

export function getCandidatesToCall(candidates: CandidateData[], today: dayjs.Dayjs): CandidateData[] {
  return candidates.filter(c => {
    const action = getNextAction(c, today)
    return action === 'Call Candidate' || action === 'Schedule Interview'
  })
}

export function getRechargeQueue(candidates: CandidateData[]): CandidateData[] {
  return candidates.filter(c => c.stage === 'recharge_pending')
}

export function getInterviewQueue(candidates: CandidateData[], today: dayjs.Dayjs): CandidateData[] {
  return candidates.filter(c => c.interviewDate && (dayjs(c.interviewDate).isSame(today, 'day') || dayjs(c.interviewDate).isSame(today.add(1, 'day'), 'day')))
}

export function getLostCandidates(candidates: CandidateData[]): CandidateData[] {
  return candidates.filter(c => c.stage === 'lost')
}

export function getRecentlyJoined(candidates: CandidateData[], today: dayjs.Dayjs): CandidateData[] {
  return candidates.filter(c => (c.stage === 'activated' || c.stage === 'completed') && c.stageUpdatedAt && today.diff(dayjs(c.stageUpdatedAt), 'day') <= 7)
}

export function getNeedsReferral(candidates: CandidateData[], today: dayjs.Dayjs): CandidateData[] {
  return candidates.filter(c => getNextAction(c, today) === 'Ask for Referral')
}

export function getColdCandidates(candidates: CandidateData[], today: dayjs.Dayjs): CandidateData[] {
  return candidates.filter(c => isCandidateCold(c, today))
}

export function getStaleCandidates(candidates: CandidateData[], today: dayjs.Dayjs): CandidateData[] {
  return candidates.filter(c => isStale(c, today))
}

export function buildRecommendations(candidates: CandidateData[], today: dayjs.Dayjs): Recommendation[] {
  const recommendations: Recommendation[] = []

  const coldCount = getColdCandidates(candidates, today).length
  if (coldCount > 15) {
    recommendations.push({
      title: 'High Volume of Cold Candidates',
      description: `You have ${coldCount} candidates turning cold. Focus on follow-ups today.`,
      priority: 'high',
      category: 'sales',
      icon: '❄️'
    })
  }

  const rechargeCount = getRechargeQueue(candidates).length
  if (rechargeCount > 5) {
    recommendations.push({
      title: 'Pending Recharges Piling Up',
      description: `You have ${rechargeCount} pending recharges. Prioritize collection calls.`,
      priority: 'high',
      category: 'operations',
      icon: '💰'
    })
  }

  // A basic mock rule for interviews since attendance isn't fully measurable just from list without historical context
  const upcomingInterviews = getInterviewQueue(candidates, today).length
  if (upcomingInterviews > 0) {
    recommendations.push({
      title: 'Upcoming Interviews',
      description: `Ensure you confirm attendance for your ${upcomingInterviews} upcoming interviews.`,
      priority: 'medium',
      category: 'operations',
      icon: '📅'
    })
  }

  return recommendations
}
