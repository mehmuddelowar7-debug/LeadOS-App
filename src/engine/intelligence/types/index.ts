export type CandidateHealth = 'Healthy' | 'Warning' | 'Critical' | 'Completed'

export type PriorityLevel = 'P0' | 'P1' | 'P2' | 'P3'

export type NextAction = 
  | 'Call Candidate'
  | 'Schedule Interview'
  | 'Confirm Interview'
  | 'Collect Recharge'
  | 'Mark Joined'
  | 'Ask for Referral'
  | 'Archive'
  | 'Nothing'

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'

export interface DailyMission {
  callsToMake: number
  interviewsToConfirm: number
  rechargesToCollect: number
  referralsToAsk: number
}

export interface Recommendation {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  category: 'marketing' | 'operations' | 'sales'
  icon: string
}
