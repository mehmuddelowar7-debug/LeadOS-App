import { useMemo } from 'react'
import dayjs from 'dayjs'
import { useContacts } from '@/hooks/useContacts'
import { useInterviews } from '@/hooks/useInterviews'
import { useFollowUps } from '@/hooks/useFollowUps'
import type { CandidateData } from '../engine/intelligence/rules/candidateRules'
import {
  buildDailyMission,
  getCandidatesToCall,
  getRechargeQueue,
  getInterviewQueue,
  getLostCandidates,
  getRecentlyJoined,
  getNeedsReferral,
  getColdCandidates,
  getStaleCandidates,
  buildRecommendations
} from '../engine/intelligence/selectors/dashboardSelectors'

export function useCandidateIntelligence() {
  const { data: contacts = [], isPending: contactsPending } = useContacts()
  const { data: interviews = [], isPending: interviewsPending } = useInterviews()
  const { data: followUps = [], isPending: followUpsPending } = useFollowUps()

  const candidates: CandidateData[] = useMemo(() => {
    return contacts.map(c => {
      const opp = (c as any).opportunity
      const cInterviews = interviews.filter(i => i.contact_id === c.id)
      const latestInterview = cInterviews.sort((a, b) => dayjs(b.interview_date).valueOf() - dayjs(a.interview_date).valueOf())[0]
      const cFollowUps = followUps.filter(f => f.contact_id === c.id && f.status !== 'completed')
      const nextFollowUp = cFollowUps.sort((a, b) => dayjs(a.follow_up_date).valueOf() - dayjs(b.follow_up_date).valueOf())[0]

      return {
        id: c.id,
        name: c.name,
        stage: opp?.status || 'lead',
        status: opp?.status || 'lead',
        lastContactedAt: c.created_at, // Mocking since lastContactedAt isn't explicitly in DB, we'll use created_at for now
        lastActivityAt: c.updated_at,
        stageUpdatedAt: opp?.updated_at || c.updated_at,
        nextFollowUp: nextFollowUp ? nextFollowUp.follow_up_date : null,
        interviewDate: latestInterview ? latestInterview.interview_date : null,
        interviewStatus: latestInterview ? latestInterview.status : null,
        rechargeAmount: opp?.recharge_amount || 0,
        rechargeStatus: opp?.recharge_status || null,
      }
    })
  }, [contacts, interviews, followUps])

  const today = dayjs()

  const mission = useMemo(() => buildDailyMission(candidates, today), [candidates, today])
  const recommendations = useMemo(() => buildRecommendations(candidates, today), [candidates, today])
  
  const queues = useMemo(() => ({
    toCall: getCandidatesToCall(candidates, today),
    recharge: getRechargeQueue(candidates),
    interviews: getInterviewQueue(candidates, today),
    lost: getLostCandidates(candidates),
    joined: getRecentlyJoined(candidates, today),
    referrals: getNeedsReferral(candidates, today),
    cold: getColdCandidates(candidates, today),
    stale: getStaleCandidates(candidates, today)
  }), [candidates, today])

  const isLoading = contactsPending || interviewsPending || followUpsPending

  return {
    candidates,
    mission,
    recommendations,
    queues,
    isLoading
  }
}
