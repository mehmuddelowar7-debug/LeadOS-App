export type AutomationPriority = 'P0' | 'P1' | 'P2' | 'P3'
export type AutomationType = 'Silent' | 'Suggested' | 'Escalation'

export interface AutomationTask {
  id: string
  title: string
  description: string
  priority: AutomationPriority
  type: AutomationType
  targetId?: string // Contact ID, Campaign ID, etc.
  recommendedActionText: string
  payload?: any
  icon?: string
}
