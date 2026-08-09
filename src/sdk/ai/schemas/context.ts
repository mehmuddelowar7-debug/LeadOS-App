// ============================================================
// RecruitOSContext v1 — Canonical Schema
// FROZEN — See AI_CONTEXT_BASELINE_v1.md
// Any schema change requires ADR-007.
// ============================================================

// ── Metadata ─────────────────────────────────────────────────

export interface ContextMetadata {
  contextVersion:    'v1'
  generatedAt:       string
  buildDurationMs:   number
  candidateCount:    number
  marketingCount:    number
  workspaceId:       string
  /** Deterministic hash derived from per-domain revision sums. Never a timestamp. */
  cacheRevision:     string
  masked:            boolean
}

// ── Diagnostics ───────────────────────────────────────────────

export interface Diagnostic {
  severity:  'info' | 'warning' | 'error'
  message:   string
  source:    string
  timestamp: string
}

export interface BuilderDiagnostics {
  domain:      string
  durationMs:  number
  processed:   number
  diagnostics: Diagnostic[]
}

// ── Candidate Domain ──────────────────────────────────────────

export interface CandidateInterviewRecord {
  id:                 string
  date:               string
  status:             'scheduled' | 'attended' | 'no_show' | 'cancelled'
  daysSinceInterview: number | null
}

export interface CandidateFollowUpRecord {
  id:          string
  date:        string
  status:      string
  isOverdue:   boolean
  daysOverdue: number | null
}

export interface CandidateTouchpointRecord {
  eventType:  string
  timestamp:  string
  source:     string
}

export type CandidateSourceDomain = 'contacts' | 'interviews' | 'followups' | 'marketing' | 'automation'

export interface CandidateKnowledge {
  id:                   string
  name:                 string
  phone?:               string
  stage:                string
  health:               'Healthy' | 'Warning' | 'Critical' | 'Completed'
  priority:             'P0' | 'P1' | 'P2' | 'P3'
  risk:                 'Low' | 'Medium' | 'High' | 'Critical'
  nextAction:           string
  daysSinceContact:     number | null
  daysSinceStageChange: number | null
  daysInCurrentStage:   number | null
  slaBreached:          boolean
  activeAutomations:    string[]

  // Resolved relationship graph
  interviews:           CandidateInterviewRecord[]
  followUps:            CandidateFollowUpRecord[]
  touchpoints:          CandidateTouchpointRecord[]

  // Marketing attribution
  acquisitionSource:    string | null
  acquisitionCampaign:  string | null
  attributedAt:         string | null

  // Provenance
  _sources: CandidateSourceDomain[]
}

export interface CandidateIndex {
  all:        CandidateKnowledge[]
  byId:       Map<string, CandidateKnowledge>
  byPriority: Record<'P0' | 'P1' | 'P2' | 'P3', CandidateKnowledge[]>
  byRisk:     Record<'Low' | 'Medium' | 'High' | 'Critical', CandidateKnowledge[]>
  byStage:    Map<string, CandidateKnowledge[]>
  byHealth:   Record<'Healthy' | 'Warning' | 'Critical' | 'Completed', CandidateKnowledge[]>
}

export interface CandidateContext {
  index:       CandidateIndex
  diagnostics: BuilderDiagnostics
}

// ── Marketing Domain ──────────────────────────────────────────

export interface MarketingSourceSummary {
  id:              string
  name:            string
  type:            string
  totalLeads:      number
  totalJoined:     number
  conversionRate:  number
  costPerJoined:   number | null
  activeCampaigns: number
  _sources:        readonly ['marketing_sources', 'marketing_campaigns', 'marketing_touchpoints']
}

export interface MarketingCampaignSummary {
  id:             string
  name:           string
  sourceName:     string
  status:         string
  budget:         number | null
  leadsGenerated: number
  joinRate:       number
  _sources:       readonly ['marketing_campaigns', 'marketing_touchpoints']
}

export interface MarketingRecommendationSummary {
  id:          string
  type:        'pause' | 'increase' | 'warning' | 'info'
  title:       string
  description: string
}

export interface MarketingImportSummary {
  provider:         string
  status:           string
  recordsProcessed: number
  completedAt:      string | null
}

export interface MarketingKnowledge {
  totalSources:          number
  totalCampaigns:        number
  totalLeadsGenerated:   number
  totalJoined:           number
  overallConversionRate: number
  topPerformingSource:   string | null
  worstPerformingSource: string | null
  sources:               MarketingSourceSummary[]
  campaigns:             MarketingCampaignSummary[]
  recommendations:       MarketingRecommendationSummary[]
  recentImports:         MarketingImportSummary[]
}

export interface MarketingContext {
  knowledge:   MarketingKnowledge
  diagnostics: BuilderDiagnostics
}

// ── Operations Domain ─────────────────────────────────────────

export interface OperationsKnowledge {
  mission: {
    callsToMake:         number
    interviewsToConfirm: number
    rechargesToCollect:  number
    referralsToAsk:      number
    totalActionable:     number
  }
  queues: {
    toCall:     number
    recharge:   number
    interviews: number
    cold:       number
    stale:      number
  }
  automations: {
    totalPending: number
    escalations:  number
    suggestions:  number
  }
  sla: {
    breached: number
    atRisk:   number
  }
}

export interface OperationsContext {
  knowledge:   OperationsKnowledge
  diagnostics: BuilderDiagnostics
}

// ── Recruiter Domain ──────────────────────────────────────────

export interface RecruiterKnowledge {
  workload: {
    estimatedHoursToday: number
    tasksCompleted:      number
    tasksPending:        number
  }
  todayHighlights: {
    interviewsScheduled: number
    followUpsDue:        number
    rechargesDue:        number
  }
  recentActivity: {
    description: string
    happenedAt:  string
  }[]
}

export interface RecruiterContext {
  knowledge:   RecruiterKnowledge
  diagnostics: BuilderDiagnostics
}

// ── Workspace Domain ──────────────────────────────────────────

export interface WorkspaceKnowledge {
  totalCandidates:  number
  activeCandidates: number
  joinedThisMonth:  number
  joinedThisWeek:   number
  conversionRate:   number
  pipelineHealth:   'Healthy' | 'Warning' | 'Critical'
  kpis: {
    name:   string
    value:  number
    target: number
    status: 'on_track' | 'at_risk' | 'missed'
  }[]
}

export interface WorkspaceContext {
  knowledge:   WorkspaceKnowledge
  diagnostics: BuilderDiagnostics
}

// ── Top-Level Context ─────────────────────────────────────────

export interface RecruitOSContext {
  readonly _version: 'v1'
  _metadata:         ContextMetadata
  candidates:        CandidateContext
  marketing:         MarketingContext
  operations:        OperationsContext
  recruiter:         RecruiterContext
  workspace:         WorkspaceContext
}

export interface ContextSnapshot {
  id:          string
  context:     RecruitOSContext
  diagnostics: BuilderDiagnostics[]
  serial:      number
  createdAt:   string
}

// ── Prompt Builder Types ──────────────────────────────────────

export type PromptType =
  | 'daily_brief'
  | 'candidate_summary'
  | 'campaign_analysis'
  | 'operations_coach'
  | 'search_answer'
  | 'natural_language_qa'

export interface PromptDocument {
  system:       string
  context:      string
  instructions: string
  metadata: {
    version:     'v1'
    masked:      boolean
    generatedAt: string
    promptType:  PromptType
  }
}

// ── Serializer Types ──────────────────────────────────────────

export type SerializableDomain = 'candidate' | 'marketing' | 'operations' | 'recruiter' | 'workspace'
