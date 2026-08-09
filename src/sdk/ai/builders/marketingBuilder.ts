/**
 * Marketing Context Builder
 * RULE: Never import from providers/adapters/.
 */
import type { MarketingContext, MarketingKnowledge, Diagnostic } from '../schemas/context'
import type { MarketingGraphIndexes } from '../graph/marketingGraph'
import { generateRecommendations } from '@/features/marketing/selectors/recommendationRules'

function makeDiag(severity: Diagnostic['severity'], message: string): Diagnostic {
  return { severity, message, source: 'marketingBuilder', timestamp: new Date().toISOString() }
}

export function buildMarketingContext(
  sources:    any[],
  campaigns:  any[],
  touchpoints: any[],
  imports:    any[],
  graph:      MarketingGraphIndexes,
): MarketingContext {
  const t0 = performance.now()
  const diagnostics: Diagnostic[] = []

  // Aggregate leads and joins per source from touchpoints
  const leadsPerSource  = new Map<string, number>()
  const joinsPerSource  = new Map<string, number>()

  for (const t of touchpoints) {
    const sid = t.source_id ?? ''
    if (!sid) continue
    if (t.event_type === 'lead_created') leadsPerSource.set(sid, (leadsPerSource.get(sid) ?? 0) + 1)
    if (t.event_type === 'joined')       joinsPerSource.set(sid,  (joinsPerSource.get(sid) ?? 0) + 1)
  }

  const sourceSummaries = sources.map(s => {
    const total  = leadsPerSource.get(s.id) ?? 0
    const joined = joinsPerSource.get(s.id) ?? 0
    const active = (graph.campaignsBySource.get(s.id) ?? []).filter((c: any) => c.status === 'active').length
    return {
      id: s.id, name: s.name, type: s.type,
      totalLeads: total, totalJoined: joined,
      conversionRate: total > 0 ? Math.round((joined / total) * 100) : 0,
      costPerJoined: null, // Requires spend data (future sprint)
      activeCampaigns: active,
      _sources: ['marketing_sources', 'marketing_campaigns', 'marketing_touchpoints'] as const,
    }
  })

  const sortedByCR = [...sourceSummaries].sort((a, b) => b.conversionRate - a.conversionRate)
  const totalLeads  = sourceSummaries.reduce((s, x) => s + x.totalLeads,  0)
  const totalJoined = sourceSummaries.reduce((s, x) => s + x.totalJoined, 0)

  const campaignSummaries = campaigns.map(c => {
    const source = graph.sourceById.get(c.source_id)
    return {
      id: c.id, name: c.name,
      sourceName: source?.name ?? 'Unknown',
      status: c.status, budget: c.budget,
      leadsGenerated: 0, // Aggregate from touchpoints (simplified)
      joinRate: 0,
      _sources: ['marketing_campaigns', 'marketing_touchpoints'] as const,
    }
  })

  // Reuse existing recommendation rules — no duplication
  const recommendations = generateRecommendations({
    sources: sourceSummaries.map(s => ({ name: s.name, cpj: s.costPerJoined ?? 0, joined: s.totalJoined })),
    campaigns: campaignSummaries.map(c => ({ name: c.name, joinRate: c.joinRate, spend: c.budget ?? 0 })),
  }).map(r => ({ id: r.id, type: r.type, title: r.title, description: r.description }))

  if (sources.length === 0) {
    diagnostics.push(makeDiag('warning', 'No marketing sources in cache — marketing context will be empty'))
  }

  const durationMs = performance.now() - t0
  const knowledge: MarketingKnowledge = {
    totalSources: sources.length,
    totalCampaigns: campaigns.length,
    totalLeadsGenerated: totalLeads,
    totalJoined,
    overallConversionRate: totalLeads > 0 ? Math.round((totalJoined / totalLeads) * 100) : 0,
    topPerformingSource: sortedByCR[0]?.name ?? null,
    worstPerformingSource: sortedByCR[sortedByCR.length - 1]?.name ?? null,
    sources: sourceSummaries,
    campaigns: campaignSummaries,
    recommendations,
    recentImports: imports.slice(0, 5).map(i => ({
      provider: i.provider, status: i.status,
      recordsProcessed: i.records_processed ?? 0,
      completedAt: i.completed_at ?? null,
    })),
  }

  return { knowledge, diagnostics: { domain: 'marketing', durationMs, processed: sources.length, diagnostics } }
}
