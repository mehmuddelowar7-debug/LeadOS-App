import React, { useEffect, useState } from 'react'
import { EdgeFunctionAdapter } from '@/sdk/ai/providers/adapters/EdgeFunctionAdapter'
import { PromptBuilder } from '@/sdk/ai/prompts/promptBuilder'
import type { ContextSnapshot } from '@/sdk/ai/schemas/context'
import type { CandidateSummaryResponse } from '@/sdk/ai/providers/types'
import { useCandidateDiff } from '../../../sdk/ai/hooks/useCandidateDiff'
import { Sparkles, Loader2, TrendingUp, Clock, AlertTriangle, ShieldCheck, CheckCircle } from 'lucide-react'

interface CandidateSummaryPanelProps {
  snapshot: ContextSnapshot
  candidateId: string
}

export const CandidateSummaryPanel: React.FC<CandidateSummaryPanelProps> = ({ snapshot, candidateId }) => {
  const [summary, setSummary] = useState<CandidateSummaryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const candidateNode = snapshot.context.candidates.index.byId.get(candidateId)
  const diff = useCandidateDiff(candidateNode)

  useEffect(() => {
    let mounted = true
    
    async function fetchSummary() {
      if (!candidateNode) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)
      
      try {
        const adapter = new EdgeFunctionAdapter()
        const document = PromptBuilder.buildCandidateSummaryPrompt(snapshot, candidateId)
        // In Sprint 11C, send() will return CandidateSummaryResponse for this prompt type
        const response = await adapter.send<CandidateSummaryResponse>(document)
        
        if (mounted) {
          setSummary(response)
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to generate summary')
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    fetchSummary()

    return () => { mounted = false }
  }, [snapshot, candidateId, candidateNode])

  if (!candidateNode) return null
  if (error || (!isLoading && !summary)) return null

  return (
    <div className="glass-card rounded-2xl overflow-hidden mb-6 border border-emerald-500/20 relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-emerald-500/5 border-b border-emerald-500/10">
        <div className="flex items-center gap-2 font-semibold text-emerald-500">
          <Sparkles className="w-5 h-5" />
          AI Candidate Summary
        </div>
        {summary && (
          <div className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 uppercase">
            Confidence: {summary.confidence}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-8 text-emerald-500">
          <Loader2 className="w-6 h-6 animate-spin mb-2" />
          <span className="text-sm font-medium">Analyzing Candidate Profile...</span>
        </div>
      ) : error ? (
        <div className="p-4 text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      ) : summary ? (
        <div className="p-4 space-y-6">
          
          {/* Context Diff / Since Yesterday */}
          {diff.length > 0 && (
            <div className="flex flex-col gap-2 p-3 bg-[var(--surface-sunken)] rounded-xl border border-[var(--border-subtle)]">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Since Yesterday
              </div>
              <div className="flex flex-wrap gap-3">
                {diff.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-sm">
                    <span className="text-muted-foreground">{d.field}:</span>
                    <span className="line-through text-muted-foreground opacity-70 text-xs">{d.oldValue}</span>
                    <TrendingUp className="w-3 h-3 text-primary" />
                    <span className="font-semibold text-foreground">{d.newValue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overview */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Overall</h3>
            <p className="text-sm text-foreground leading-relaxed">{summary.overview}</p>
          </div>

          {/* Timeline & Risks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Timeline
              </h3>
              <ul className="space-y-1.5">
                {summary.timeline.map((item, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-primary mt-1 text-[10px]">●</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Risks
              </h3>
              <ul className="space-y-1.5">
                {summary.risks.length > 0 ? summary.risks.map((item, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-red-400 mt-1 text-[10px]">●</span>
                    <span>{item}</span>
                  </li>
                )) : <span className="text-sm text-muted-foreground">No apparent risks detected.</span>}
              </ul>
            </div>
          </div>

          {/* Strengths */}
          {summary.strengths.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Strengths
              </h3>
              <ul className="space-y-1.5">
                {summary.strengths.map((item, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-emerald-500 mt-1 text-[10px]">●</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Actions (Explainable) */}
          {summary.recommendedActions.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
              <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Recommendation</h3>
              
              {summary.recommendedActions.map((action, idx) => (
                <div key={idx} className="flex flex-col gap-2 p-3 rounded-xl border border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-2 font-bold text-sm text-primary">
                    <CheckCircle className="w-4 h-4" />
                    {action.recommendedAction}
                  </div>
                  
                  <div className="pl-6 space-y-2">
                    <div className="text-xs text-foreground">
                      <span className="font-semibold text-muted-foreground mr-2">Why:</span>
                      {action.reason}
                    </div>
                    
                    {/* Cross-reference citations with this specific action reason if possible, 
                        or just list all sources at the bottom. The user requested:
                        "Based on: Candidate Intelligence, Follow-up history" */}
                  </div>
                </div>
              ))}

              {/* Citations block for the entire summary */}
              {summary.citations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-semibold text-muted-foreground">Based on:</span>
                  {Array.from(new Set(summary.citations.flatMap(c => c.sources))).map(src => (
                    <span key={src} className="px-2 py-1 rounded-md bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[10px] text-muted-foreground flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      {src}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      ) : null}
    </div>
  )
}
