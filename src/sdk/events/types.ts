// Event Types

export type EventType = 
  // Candidates
  | 'candidate.created'
  | 'candidate.updated'
  | 'candidate.stage_changed'
  | 'candidate.deleted'
  // Interviews
  | 'interview.created'
  | 'interview.completed'
  // Operations
  | 'followup.completed'
  // Marketing & Ingestion
  | 'marketing.lead_received'
  | 'marketing.import_finished'
  // Automation
  | 'automation.executed'

export interface EventPayload {
  'candidate.created': { candidateId: string; source: string }
  'candidate.updated': { candidateId: string; changes: Record<string, any> }
  'candidate.stage_changed': { candidateId: string; oldStage: string; newStage: string }
  'candidate.deleted': { candidateId: string }
  
  'interview.created': { interviewId: string; candidateId: string }
  'interview.completed': { interviewId: string; outcome: string }
  
  'followup.completed': { followupId: string }
  
  'marketing.lead_received': { source: string; rawData: any; normalizedCandidateId?: string }
  'marketing.import_finished': { source: string; count: number }
  
  'automation.executed': { ruleId: string; targetId: string; success: boolean }
}
