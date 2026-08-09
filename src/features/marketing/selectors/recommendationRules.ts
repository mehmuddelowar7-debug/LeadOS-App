export interface MarketingData {
  sources: Array<{ name: string, cpj: number, joined: number }>
  campaigns: Array<{ name: string, joinRate: number, spend: number }>
}

export interface Recommendation {
  id: string
  type: 'pause' | 'increase' | 'warning' | 'info'
  priority: number // 1 is highest
  title: string
  description: string
}

export const generateRecommendations = (data: MarketingData): Recommendation[] => {
  const rules: Recommendation[] = []
  
  // Rule 1: High Cost Per Joined (CPJ)
  const averageCpj = data.sources.reduce((acc, curr) => acc + curr.cpj, 0) / (data.sources.length || 1)
  data.sources.forEach(source => {
    if (source.cpj > (averageCpj * 1.5) && source.joined > 0) {
      rules.push({
        id: `high-cpj-${source.name}`,
        type: 'pause',
        priority: 1,
        title: `Consider Pausing ${source.name}`,
        description: `Cost per Joined (₹${source.cpj}) is significantly higher than your average (₹${Math.round(averageCpj)}).`
      })
    }
  })

  // Rule 2: High Join Rate
  data.campaigns.forEach(campaign => {
    if (campaign.joinRate > 10 && campaign.spend > 1000) {
      rules.push({
        id: `high-join-rate-${campaign.name}`,
        type: 'increase',
        priority: 2,
        title: `Increase budget on ${campaign.name}`,
        description: `Excellent Join Rate (${campaign.joinRate}%) with significant spend. Scaling this could yield more candidates.`
      })
    }
  })

  // Sort by priority
  return rules.sort((a, b) => a.priority - b.priority)
}
