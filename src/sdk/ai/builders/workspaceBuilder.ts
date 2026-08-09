/**
 * Workspace Context Builder
 * RULE: Never import from providers/adapters/.
 */
import type { WorkspaceContext, WorkspaceKnowledge, Diagnostic } from '../schemas/context'
import type { WorkspaceGraphIndexes } from '../graph/workspaceGraph'

export function buildWorkspaceContext(
  candidates: any[],
  contacts:   any[],
  graph:      WorkspaceGraphIndexes,
): WorkspaceContext {
  const t0 = performance.now()
  const diagnostics: Diagnostic[] = []

  const totalCandidates  = contacts.length
  const activeCandidates = candidates.length
  
  const joinedThisMonth  = graph.joinedThisMonth
  const joinedThisWeek   = graph.joinedThisWeek
  
  // Simple overall conversion rate (joined / total)
  let joinedCount = 0
  for (const [stage, count] of graph.activeStageCounts.entries()) {
    if (stage === 'activated' || stage === 'completed') joinedCount += count
  }
  const conversionRate = totalCandidates > 0 ? Math.round((joinedCount / totalCandidates) * 100) : 0

  let pipelineHealth: 'Healthy' | 'Warning' | 'Critical' = 'Healthy'
  if (activeCandidates > 0 && conversionRate < 5) pipelineHealth = 'Warning'
  if (activeCandidates > 0 && joinedThisMonth === 0) pipelineHealth = 'Critical'

  const knowledge: WorkspaceKnowledge = {
    totalCandidates,
    activeCandidates,
    joinedThisMonth,
    joinedThisWeek,
    conversionRate,
    pipelineHealth,
    kpis: [
      { name: 'Monthly Joins', value: joinedThisMonth, target: 10, status: joinedThisMonth >= 10 ? 'on_track' : 'missed' },
      { name: 'Conversion Rate', value: conversionRate, target: 10, status: conversionRate >= 10 ? 'on_track' : 'at_risk' },
    ],
  }

  const durationMs = performance.now() - t0
  return {
    knowledge,
    diagnostics: { domain: 'workspace', durationMs, processed: totalCandidates, diagnostics },
  }
}
