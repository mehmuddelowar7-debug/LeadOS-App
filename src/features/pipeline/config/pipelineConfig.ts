import { User, Calendar, CheckCircle, CreditCard, Flag } from 'lucide-react'

import type { OpportunityStatus } from '@/types'

export const PIPELINE_STAGES = [
  { id: 'lead', label: 'Lead', icon: User, nextStage: 'interview', nextStatus: 'interested' as OpportunityStatus },
  { id: 'interview', label: 'Interview', icon: Calendar, nextStage: 'selected', action: 'open_interview' },
  { id: 'selected', label: 'Selected', icon: CheckCircle, nextStage: 'recharge', nextStatus: 'registration' as OpportunityStatus },
  { id: 'recharge', label: 'Recharge', icon: CreditCard, nextStage: 'joined', nextStatus: 'recharge_completed' as OpportunityStatus },
  { id: 'joined', label: 'Joined', icon: Flag, completed: true, nextStatus: 'activated' as OpportunityStatus }
] as const

export type PipelineStageId = typeof PIPELINE_STAGES[number]['id']
