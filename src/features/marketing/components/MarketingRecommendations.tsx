import { TrendingUp } from 'lucide-react'
import { generateRecommendations, type MarketingData } from '../selectors/recommendationRules'
import { useMemo } from 'react'
import { useCandidateIntelligence } from '@/hooks/useCandidateIntelligence'

// Dummy wrapper until full data is wired up
const dummyData: MarketingData = {
  sources: [
    { name: 'Instagram', cpj: 694, joined: 12 },
    { name: 'Facebook', cpj: 1250, joined: 3 },
    { name: 'Field', cpj: 120, joined: 11 }
  ],
  campaigns: [
    { name: 'Commercial Street', joinRate: 14.8, spend: 3500 },
    { name: 'August Hiring', joinRate: 5.2, spend: 2000 }
  ]
}

export function MarketingRecommendations() {
  // In reality, we'd pass in data from useMarketingMetrics() or similar
  const marketingRecs = useMemo(() => generateRecommendations(dummyData), [])
  const { recommendations: candidateRecs } = useCandidateIntelligence()

  // Merge them, mapping marketing recs to the new format if needed
  const recommendations = useMemo(() => {
    const mappedMarketing = marketingRecs.map(r => ({
      title: r.title,
      description: r.description,
      priority: 'medium' as const,
      category: 'marketing' as const,
      icon: '📈',
      id: r.id
    }))
    
    // Assign a unique dummy ID for candidateRecs since they lack one
    const mappedCandidate = candidateRecs.map((r, idx) => ({
      ...r,
      id: `cand_rec_${idx}`
    }))

    return [...mappedMarketing, ...mappedCandidate]
  }, [marketingRecs, candidateRecs])

  if (recommendations.length === 0) return null

  return (
    <div className="lg:col-span-2 glass-card rounded-2xl border border-border/50 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-2 text-primary font-bold">
        <TrendingUp className="h-5 w-5" />
        <h2>Recommendations</h2>
      </div>
      
      <div className="space-y-4">
        {recommendations.map(rec => (
          <div key={rec.id} className="bg-primary/5 border border-primary/20 p-4 rounded-xl transition-colors hover:bg-primary/10">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <span className="text-xl">{rec.icon}</span> {rec.title}
            </h4>
            <p className="text-sm text-muted-foreground mt-1 ml-8">
              {rec.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
