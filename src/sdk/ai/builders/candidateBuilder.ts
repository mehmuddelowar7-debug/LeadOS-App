/**
 * Candidate Context Builder
 * Builds CandidateContext from the Candidate Intelligence Engine output + graph indexes.
 * RULE: Never import from providers/adapters/.
 */
import dayjs from 'dayjs'
import type {
  CandidateContext, CandidateKnowledge, CandidateIndex,
  CandidateInterviewRecord, CandidateFollowUpRecord, Diagnostic
} from '../schemas/context'
import type { CandidateData } from '@/engine/intelligence/rules/candidateRules'
import {
  getHealth, getPriorityLevel, getNextAction, getRiskLevel
} from '@/engine/intelligence/rules/candidateRules'
import type { CandidateGraphIndexes } from '../graph/candidateGraph'
import type { AutomationTask } from '@/engine/automation/types'

function makeDiag(severity: Diagnostic['severity'], message: string, source: string): Diagnostic {
  return { severity, message, source, timestamp: new Date().toISOString() }
}

export function buildCandidateContext(
  candidates:    CandidateData[],
  contacts:      any[],
  graph:         CandidateGraphIndexes,
  automations:   AutomationTask[],
  masked:        boolean,
): CandidateContext {
  const t0 = performance.now()
  const diagnostics: Diagnostic[] = []

  // Index automations by targetId for O(1) lookup
  const automationsByContact = new Map<string, string[]>()
  for (const a of automations) {
    if (a.targetId) {
      if (!automationsByContact.has(a.targetId)) automationsByContact.set(a.targetId, [])
      automationsByContact.get(a.targetId)!.push(a.id)
    }
  }

  // Index raw contacts for phone lookup
  const contactById = new Map<string, any>(contacts.map(c => [c.id, c]))

  const today = dayjs()
  const all: CandidateKnowledge[] = []
  let processed = 0

  for (const c of candidates) {
    try {
      const rawContact = contactById.get(c.id)
      const rawInterviews = graph.interviewsByContact.get(c.id) ?? []
      const rawFollowUps  = graph.followUpsByContact.get(c.id) ?? []
      const touchpoints   = graph.touchpointsByContact.get(c.id) ?? []
      const attribution   = graph.attributionByContact.get(c.id)

      const interviews: CandidateInterviewRecord[] = rawInterviews.map(i => ({
        id:                 i.id,
        date:               i.interview_date,
        status:             i.status,
        daysSinceInterview: today.diff(dayjs(i.interview_date), 'day'),
      }))

      const followUps: CandidateFollowUpRecord[] = rawFollowUps.map(f => {
        const daysOverdue = today.diff(dayjs(f.follow_up_date), 'day')
        return {
          id:          f.id,
          date:        f.follow_up_date,
          status:      f.status,
          isOverdue:   daysOverdue > 0,
          daysOverdue: daysOverdue > 0 ? daysOverdue : null,
        }
      })

      const sources: CandidateKnowledge['_sources'] = ['contacts']
      if (interviews.length > 0)  sources.push('interviews')
      if (followUps.length > 0)   sources.push('followups')
      if (attribution)            sources.push('marketing')
      if (automationsByContact.has(c.id)) sources.push('automation')

      const daysSinceContact    = c.lastContactedAt ? today.diff(dayjs(c.lastContactedAt), 'day') : null
      const daysSinceStageChange = c.stageUpdatedAt ? today.diff(dayjs(c.stageUpdatedAt), 'day') : null

      // Detect SLA breach (recharge > 2 days, or overdue follow-up)
      const slaBreached = (
        (c.stage === 'recharge_pending' && (daysSinceStageChange ?? 0) >= 2) ||
        followUps.some(f => f.isOverdue && (f.daysOverdue ?? 0) >= 2)
      )

      all.push({
        id:                   c.id,
        name:                 masked ? `Candidate_${c.id.slice(0, 6)}` : c.name,
        phone:                masked ? undefined : rawContact?.phone,
        stage:                c.stage,
        health:               getHealth(c, today),
        priority:             getPriorityLevel(c, today),
        risk:                 getRiskLevel(c, today),
        nextAction:           getNextAction(c, today),
        daysSinceContact,
        daysSinceStageChange,
        daysInCurrentStage:   daysSinceStageChange,
        slaBreached,
        activeAutomations:    automationsByContact.get(c.id) ?? [],
        interviews,
        followUps,
        touchpoints,
        acquisitionSource:    attribution?.sourceName ?? null,
        acquisitionCampaign:  attribution?.campaignName ?? null,
        attributedAt:         attribution?.attributedAt ?? null,
        _sources:             sources as CandidateKnowledge['_sources'],
      })

      processed++
    } catch (err: any) {
      diagnostics.push(makeDiag('error', `Failed to build candidate ${c.id}: ${err?.message}`, 'candidateBuilder'))
    }
  }

  // Build CandidateIndex
  const byId       = new Map(all.map(c => [c.id, c]))
  const byPriority: CandidateIndex['byPriority'] = { P0: [], P1: [], P2: [], P3: [] }
  const byRisk: CandidateIndex['byRisk']         = { Low: [], Medium: [], High: [], Critical: [] }
  const byHealth: CandidateIndex['byHealth']      = { Healthy: [], Warning: [], Critical: [], Completed: [] }
  const byStage    = new Map<string, CandidateKnowledge[]>()

  for (const c of all) {
    byPriority[c.priority].push(c)
    byRisk[c.risk].push(c)
    byHealth[c.health].push(c)
    if (!byStage.has(c.stage)) byStage.set(c.stage, [])
    byStage.get(c.stage)!.push(c)
  }

  const durationMs = performance.now() - t0
  if (durationMs > 10) {
    diagnostics.push(makeDiag('warning', `Candidate build took ${durationMs.toFixed(1)}ms (target <10ms)`, 'candidateBuilder'))
  }

  return {
    index: { all, byId, byPriority, byRisk, byStage, byHealth },
    diagnostics: { domain: 'candidate', durationMs, processed, diagnostics },
  }
}
