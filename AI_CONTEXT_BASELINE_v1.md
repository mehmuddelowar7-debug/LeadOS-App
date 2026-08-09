# AI_CONTEXT_BASELINE_v1

**Status:** FROZEN  
**Date:** August 2026  
**Authority:** This document is immutable. Any change requires ADR-007 and produces `RecruitOSContext v2`.

> This document defines the canonical, frozen schema for `RecruitOSContext v1`. No field may be added, renamed, removed, or retyped without a formal Architecture Decision Record. Silent changes are forbidden.

---

## Context Version

```
_version: 'v1'
```

---

## Top-Level Shape

```typescript
interface RecruitOSContext {
  readonly _version:   'v1'
  _metadata:           ContextMetadata

  candidates:          CandidateContext
  marketing:           MarketingContext
  operations:          OperationsContext
  recruiter:           RecruiterContext
  workspace:           WorkspaceContext
}
```

---

## Metadata

```typescript
interface ContextMetadata {
  contextVersion:    'v1'
  generatedAt:       string   // ISO 8601
  buildDurationMs:   number
  candidateCount:    number
  marketingCount:    number
  workspaceId:       string
  cacheRevision:     string   // Deterministic hash: hash(candidateRev + marketingRev + operationsRev + workspaceRev)
  masked:            boolean  // Whether PII was masked
}

// cacheRevision is NEVER a timestamp. It is a deterministic stable hash derived from
// the sum of per-domain revisions, computed from React Query dataUpdatedAt values.
// Same inputs always produce the same revision. This prevents false downstream recomputation.
```

---

## Candidate Domain

```typescript
interface CandidateContext {
  index: CandidateIndex
  diagnostics: BuilderDiagnostics
}

interface CandidateIndex {
  all:        CandidateKnowledge[]
  byId:       Map<string, CandidateKnowledge>
  byPriority: { P0: CandidateKnowledge[], P1: CandidateKnowledge[], P2: CandidateKnowledge[], P3: CandidateKnowledge[] }
  byRisk:     { Low: CandidateKnowledge[], Medium: CandidateKnowledge[], High: CandidateKnowledge[], Critical: CandidateKnowledge[] }
  byStage:    Map<string, CandidateKnowledge[]>
  byHealth:   { Healthy: CandidateKnowledge[], Warning: CandidateKnowledge[], Critical: CandidateKnowledge[], Completed: CandidateKnowledge[] }
}

interface CandidateKnowledge {
  id:                   string
  name:                 string       // Masked if metadata.masked = true
  phone?:               string       // Always masked if metadata.masked = true
  stage:                string
  health:               'Healthy' | 'Warning' | 'Critical' | 'Completed'
  priority:             'P0' | 'P1' | 'P2' | 'P3'
  risk:                 'Low' | 'Medium' | 'High' | 'Critical'
  nextAction:           string
  daysSinceContact:     number | null
  daysSinceStageChange: number | null
  daysInCurrentStage:   number | null
  slaBreached:          boolean
  activeAutomations:    string[]     // AutomationTask IDs targeting this candidate

  // Resolved relationship graph (via graph/ module)
  interviews:           CandidateInterviewRecord[]
  followUps:            CandidateFollowUpRecord[]
  touchpoints:          CandidateTouchpointRecord[]

  // Marketing attribution (resolved from graph)
  acquisitionSource:    string | null
  acquisitionCampaign:  string | null
  attributedAt:         string | null

  // Provenance (which cache domains contributed to this node)
  _sources: Array<'contacts' | 'interviews' | 'followups' | 'marketing' | 'automation'>
}

interface CandidateInterviewRecord {
  id:                string
  date:              string
  status:            'scheduled' | 'attended' | 'no_show' | 'cancelled'
  daysSinceInterview: number | null
}

interface CandidateFollowUpRecord {
  id:          string
  date:        string
  status:      string
  isOverdue:   boolean
  daysOverdue: number | null
}

interface CandidateTouchpointRecord {
  eventType:  string
  timestamp:  string
  source:     string
}
```

---

## Marketing Domain

```typescript
interface MarketingContext {
  knowledge:   MarketingKnowledge
  diagnostics: BuilderDiagnostics
}

interface MarketingKnowledge {
  totalSources:           number
  totalCampaigns:         number
  totalLeadsGenerated:    number
  totalJoined:            number
  overallConversionRate:  number
  topPerformingSource:    string | null
  worstPerformingSource:  string | null

  sources:         MarketingSourceSummary[]
  campaigns:       MarketingCampaignSummary[]
  recommendations: MarketingRecommendationSummary[]
  recentImports:   MarketingImportSummary[]
}

interface MarketingSourceSummary {
  id:               string
  name:             string
  type:             string
  totalLeads:       number
  totalJoined:      number
  conversionRate:   number
  costPerJoined:    number | null
  activeCampaigns:  number
  _sources: ['marketing_sources', 'marketing_campaigns', 'marketing_touchpoints']
}

interface MarketingCampaignSummary {
  id:              string
  name:            string
  sourceName:      string
  status:          string
  budget:          number | null
  leadsGenerated:  number
  joinRate:        number
  _sources: ['marketing_campaigns', 'marketing_touchpoints']
}

interface MarketingRecommendationSummary {
  id:          string
  type:        'pause' | 'increase' | 'warning' | 'info'
  title:       string
  description: string
}

interface MarketingImportSummary {
  provider:         string
  status:           string
  recordsProcessed: number
  completedAt:      string | null
}
```

---

## Operations Domain

```typescript
interface OperationsContext {
  knowledge:   OperationsKnowledge
  diagnostics: BuilderDiagnostics
}

interface OperationsKnowledge {
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
    escalations:  number   // P0 count
    suggestions:  number   // P1–P3 count
  }
  sla: {
    breached: number
    atRisk:   number
  }
}
```

---

## Recruiter Domain

```typescript
interface RecruiterContext {
  knowledge:   RecruiterKnowledge
  diagnostics: BuilderDiagnostics
}

interface RecruiterKnowledge {
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
```

---

## Workspace Domain

```typescript
interface WorkspaceContext {
  knowledge:   WorkspaceKnowledge
  diagnostics: BuilderDiagnostics
}

interface WorkspaceKnowledge {
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
```

---

## Shared Types

```typescript
// Severity-aware diagnostic entry. Replaces flat string arrays.
interface Diagnostic {
  severity:  'info' | 'warning' | 'error'
  message:   string
  source:    string    // Which builder/graph module emitted this (e.g. 'candidateBuilder')
  timestamp: string    // ISO 8601
}

interface BuilderDiagnostics {
  domain:      string
  durationMs:  number
  processed:   number
  diagnostics: Diagnostic[]   // Replaces flat warnings/skipped/errors arrays
}

interface ContextSnapshot {
  id:          string                   // UUID
  context:     RecruitOSContext
  diagnostics: BuilderDiagnostics[]     // All 5 domain diagnostics
  serial:      number                   // Monotonically increasing
  createdAt:   string
}

interface PromptDocument {
  system:       string
  context:      string                  // Serialized context (compact or verbose)
  instructions: string
  metadata: {
    version:     'v1'
    masked:      boolean
    generatedAt: string
    promptType:  PromptType
  }
}

type PromptType =
  | 'daily_brief'
  | 'candidate_summary'
  | 'campaign_analysis'
  | 'operations_coach'
  | 'search_answer'
  | 'natural_language_qa'
```

---

## Serialization Modes

```typescript
type SerializableDomain = 'candidate' | 'marketing' | 'operations' | 'recruiter' | 'workspace'

interface ContextSerializer {
  // Full-context serialization modes
  compact(snapshot: ContextSnapshot):    string  // Token-optimized for AI API calls
  verbose(snapshot: ContextSnapshot):    string  // Full detail for debugging
  debug(snapshot: ContextSnapshot):      string  // Context + all BuilderDiagnostics
  toJSON(snapshot: ContextSnapshot):     string  // Raw JSON
  toMarkdown(snapshot: ContextSnapshot): string  // Human-readable report

  // Partial serialization — serialize ONE domain only.
  // Used by: AI Candidate Summary (11C), AI Marketing Analyst (11D), AI Operations Coach (11E)
  // Avoids sending the full workspace context when only one domain is needed.
  serializeDomain(snapshot: ContextSnapshot, domain: SerializableDomain): string
}
```

---

## Frozen Rule: Provider Isolation

> **This rule is absolute and non-negotiable.**

Builders, graph modules, serializers, and the prompt builder may **never** import provider code.

```
✅ ALLOWED
builders/ → serializer/ → PromptDocument
builders/ → graph/
prompts/  → PromptDocument

❌ FORBIDDEN
builders/     → providers/adapters/OpenAIAdapter
graph/        → providers/adapters/GeminiAdapter
serializer/   → providers/adapters/ClaudeAdapter
promptBuilder → providers/adapters/AnyAdapter
```

Any PR that introduces a provider import into `builders/`, `graph/`, `serializer/`, or `prompts/` must be rejected immediately.

---

## Change Log

| Date | Version | Change | ADR |
|---|---|---|---|
| August 2026 | v1 | Initial freeze | ADR-006 |
| August 2026 | v1 | Added stable cacheRevision hash, Diagnostic interface, serializeDomain, provider isolation rule | ADR-006 Rev 2 |

*This table must be updated on every schema revision.*

---

## Schema Evolution Rules

1. **This schema is frozen.** No field may be added, renamed, removed, or retyped silently.
2. **To evolve:** Create ADR-007, define `RecruitOSContext v2`, implement a migration adapter.
3. **Both versions may coexist** during a transition window via a discriminated union:
   ```typescript
   type AnyRecruitOSContext = RecruitOSContext_v1 | RecruitOSContext_v2
   ```
4. **The `_version` field** is the discriminant. All adapters must handle version detection.
5. **ADR-006 remains the authority** for v1. ADR-007 governs v2.

---

## Change Log

| Date | Version | Change | ADR |
|---|---|---|---|
| August 2026 | v1 | Initial freeze | ADR-006 |

*This table must be updated on every schema revision.*
