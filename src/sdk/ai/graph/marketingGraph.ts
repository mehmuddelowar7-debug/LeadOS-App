/**
 * Marketing Graph Module
 * Builds Map-indexed marketing relationships.
 * Pure functions — no side effects.
 */

export interface MarketingGraphIndexes {
  campaignsBySource: Map<string, any[]>
  sourceById:        Map<string, any>
  campaignById:      Map<string, any>
}

export function buildMarketingGraphIndexes(
  sources:   any[],
  campaigns: any[],
): MarketingGraphIndexes {
  const sourceById = new Map<string, any>(sources.map(s => [s.id, s]))
  const campaignById = new Map<string, any>(campaigns.map(c => [c.id, c]))

  const campaignsBySource = new Map<string, any[]>()
  for (const c of campaigns) {
    if (!campaignsBySource.has(c.source_id)) campaignsBySource.set(c.source_id, [])
    campaignsBySource.get(c.source_id)!.push(c)
  }

  return { campaignsBySource, sourceById, campaignById }
}
