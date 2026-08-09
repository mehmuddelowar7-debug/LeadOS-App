/**
 * Operations Context Builder
 * RULE: Never import from providers/adapters/.
 */
import type { OperationsContext, OperationsKnowledge, Diagnostic } from '../schemas/context'
import type { DailyMission } from '@/engine/intelligence/types'
import type { AutomationTask } from '@/engine/automation/types'

export function buildOperationsContext(
  mission:    DailyMission,
  queues:     { toCall: any[], recharge: any[], interviews: any[], cold?: any[], stale?: any[] },
  automations: AutomationTask[],
): OperationsContext {
  const t0 = performance.now()
  const diagnostics: Diagnostic[] = []

  const escalations = automations.filter(a => a.priority === 'P0').length
  const suggestions = automations.filter(a => a.priority !== 'P0').length

  // SLA: recharge pending > 2 days counts as breached (already evaluated in automations)
  const slaBreached = automations.filter(a => a.type === 'Escalation').length
  const slaAtRisk   = automations.filter(a => a.type === 'Suggested' && a.priority === 'P1').length

  const knowledge: OperationsKnowledge = {
    mission: {
      callsToMake:         mission.callsToMake,
      interviewsToConfirm: mission.interviewsToConfirm,
      rechargesToCollect:  mission.rechargesToCollect,
      referralsToAsk:      mission.referralsToAsk,
      totalActionable:     mission.callsToMake + mission.interviewsToConfirm + mission.rechargesToCollect,
    },
    queues: {
      toCall:     queues.toCall.length,
      recharge:   queues.recharge.length,
      interviews: queues.interviews.length,
      cold:       queues.cold?.length ?? 0,
      stale:      queues.stale?.length ?? 0,
    },
    automations: { totalPending: automations.length, escalations, suggestions },
    sla:         { breached: slaBreached, atRisk: slaAtRisk },
  }

  const durationMs = performance.now() - t0
  return {
    knowledge,
    diagnostics: { domain: 'operations', durationMs, processed: automations.length, diagnostics },
  }
}
