import React, { useEffect, useState } from 'react'
import { EdgeFunctionAdapter } from '@/sdk/ai/providers/adapters/EdgeFunctionAdapter'
import { PromptBuilder } from '@/sdk/ai/prompts/promptBuilder'
import type { ContextSnapshot } from '@/sdk/ai/schemas/context'
import type { MarketingAnalysisResponse } from '@/sdk/ai/providers/types'
import { 
  Sparkles, Loader2, AlertTriangle, TrendingUp,
  CheckCircle, ChevronRight, Activity, Banknote
} from 'lucide-react'

interface MarketingAnalystBriefProps {
  snapshot: ContextSnapshot
}

export const MarketingAnalystBrief: React.FC<MarketingAnalystBriefProps> = ({ snapshot }) => {
  const [brief, setBrief] = useState<MarketingAnalysisResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    
    async function fetchBrief() {
      setIsLoading(true)
      setError(null)
      
      try {
        const adapter = new EdgeFunctionAdapter()
        const document = PromptBuilder.buildCampaignAnalysisPrompt(snapshot)
        const response = await adapter.send<MarketingAnalysisResponse>(document)
        
        if (mounted) {
          setBrief(response)
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to generate marketing briefing')
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    fetchBrief()

    return () => { mounted = false }
  }, [snapshot])

  if (isLoading) {
    return (
      <div className="glass-card rounded-3xl p-8 flex flex-col items-center justify-center min-h-[400px] border border-blue-500/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-lg font-medium text-blue-500">Analyzing Marketing Context...</p>
        <p className="text-sm text-muted-foreground mt-2">Computing touchpoints and budget optimizer...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card rounded-3xl p-6 border border-red-500/20 text-red-400 flex items-center gap-3">
        <AlertTriangle className="w-6 h-6" />
        <div>
          <p className="font-semibold">Failed to load marketing brief</p>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      </div>
    )
  }

  if (!brief) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-6 h-6 text-blue-500" />
        <h1 className="text-2xl font-bold text-foreground">Marketing Brief</h1>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Overall Health</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
            brief.health === 'Healthy' ? 'bg-emerald-500/10 text-emerald-500' :
            brief.health === 'Warning' ? 'bg-amber-500/10 text-amber-500' :
            'bg-red-500/10 text-red-500'
          }`}>
            {brief.health}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Executive Summary (Left Col, spans 1) */}
        <div className="space-y-6">
          
          <div className="glass-card rounded-2xl p-5 border border-[var(--border-subtle)]">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Yesterday</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Spend</p>
                <p className="text-lg font-bold text-foreground">{brief.yesterdayMetrics.spend}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Leads</p>
                <p className="text-lg font-bold text-foreground">{brief.yesterdayMetrics.leads}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Joined</p>
                <p className="text-lg font-bold text-emerald-500">{brief.yesterdayMetrics.joined}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Cost / Joined</p>
                <p className="text-lg font-bold text-foreground">{brief.yesterdayMetrics.cpj}</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-emerald-500/20 bg-emerald-500/5">
            <h3 className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> Biggest Opportunity
            </h3>
            <p className="text-sm text-foreground leading-relaxed">
              {brief.overview}
            </p>
          </div>
          
          {brief.risks.length > 0 && (
            <div className="glass-card rounded-2xl p-5 border border-red-500/20 bg-red-500/5">
              <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Biggest Risk
              </h3>
              <p className="text-sm text-foreground leading-relaxed">
                {brief.risks[0]}
              </p>
            </div>
          )}
          
        </div>

        {/* Recommendations & Evidence (Middle & Right Col, spans 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Recommendations</h3>
          
          {brief.recommendations.map((rec, idx) => (
            <div key={idx} className="glass-card rounded-2xl p-5 border border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-primary flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  {rec.recommendedAction}
                </h4>
                <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold uppercase rounded-lg transition-colors">
                  Queue Recommendation
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Reason</p>
                  <p className="text-sm text-foreground">{rec.reason}</p>
                </div>
                
                {rec.evidenceChain && rec.evidenceChain.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Evidence Chain</p>
                    <div className="flex flex-wrap items-center gap-1">
                      {rec.evidenceChain.map((step, stepIdx) => (
                        <React.Fragment key={stepIdx}>
                          <span className="px-2 py-1 bg-[var(--surface-sunken)] border border-[var(--border-subtle)] rounded text-[10px] font-medium text-foreground">
                            {step}
                          </span>
                          {stepIdx < rec.evidenceChain!.length - 1 && (
                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Budget Optimizer & Comparisons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            
            {/* Budget Optimizer */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Banknote className="w-4 h-4" /> Budget Optimizer
              </h3>
              
              <div className="glass-card rounded-2xl overflow-hidden border border-[var(--border-subtle)]">
                <div className="grid grid-cols-3 gap-2 bg-[var(--surface-sunken)] p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-[var(--border-subtle)]">
                  <div>Source</div>
                  <div>Current</div>
                  <div>Suggested</div>
                </div>
                
                {brief.budgetSuggestions.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-2 p-3 text-sm border-b border-[var(--border-subtle)] last:border-0 items-center">
                    <div className="font-semibold">{item.campaignOrSource}</div>
                    <div className="text-muted-foreground">{item.currentSpend}</div>
                    <div className="font-bold text-primary flex items-center gap-2">
                      <TrendingUp className="w-3 h-3" /> {item.suggestedSpend}
                    </div>
                  </div>
                ))}
                
                <div className="bg-emerald-500/10 p-3 flex justify-between items-center text-sm">
                  <span className="font-semibold text-emerald-600">Total Savings</span>
                  <span className="font-bold text-emerald-500 text-lg">{brief.savings}</span>
                </div>
              </div>
            </div>

            {/* Campaign Comparison Cards */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4" /> Campaign Comparison
              </h3>
              
              <div className="space-y-3">
                {brief.campaignComparisons.map((comp, idx) => (
                  <div key={idx} className="glass-card rounded-xl p-4 border border-[var(--border-subtle)] flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-foreground mb-1">{comp.name}</h4>
                      <div className="flex gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground mr-1">Join Rate:</span>
                          <span className="font-semibold text-foreground">{comp.joinRate}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground mr-1">CPL:</span>
                          <span className="font-semibold text-foreground">{comp.cpl}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full border ${
                        comp.recommendation === 'Increase' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        comp.recommendation === 'Pause' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        'bg-[var(--surface-sunken)] text-muted-foreground border-[var(--border-subtle)]'
                      }`}>
                        {comp.recommendation}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
          
        </div>
      </div>
    </div>
  )
}
