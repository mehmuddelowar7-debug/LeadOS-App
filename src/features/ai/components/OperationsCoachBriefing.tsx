import React, { useEffect, useState, useCallback } from 'react'
import { EdgeFunctionAdapter } from '@/sdk/ai/providers/adapters/EdgeFunctionAdapter'
import { PromptBuilder } from '@/sdk/ai/prompts/promptBuilder'
import type { ContextSnapshot } from '@/sdk/ai/schemas/context'
import type { DailyBriefResponse } from '@/sdk/ai/providers/types'
import { useCandidateIntelligence } from '@/hooks/useCandidateIntelligence'
import { useAppNavigate, ROUTES } from '../../../lib/routes'
import {
  Sparkles, Loader2, TrendingUp, AlertTriangle, Play,
  Phone, Calendar, RefreshCw, Banknote, Users
} from 'lucide-react'

interface OperationsCoachBriefingProps {
  snapshot: ContextSnapshot
}

// ─────────────────────────────────────────────────────────────
// Data-driven fallback brief — computed entirely from local CRM
// data, requires zero AI/network calls.
// ─────────────────────────────────────────────────────────────
function LocalFallbackBrief({ onRetry }: { onRetry: () => void }) {
  const { mission, queues, candidates } = useCandidateIntelligence()

  const missionItems = [
    mission.callsToMake > 0 && `${mission.callsToMake} call${mission.callsToMake !== 1 ? 's' : ''} to make`,
    mission.interviewsToConfirm > 0 && `${mission.interviewsToConfirm} interview${mission.interviewsToConfirm !== 1 ? 's' : ''} to confirm`,
    mission.rechargesToCollect > 0 && `${mission.rechargesToCollect} recharge${mission.rechargesToCollect !== 1 ? 's' : ''} to collect`,
    mission.referralsToAsk > 0 && `${mission.referralsToAsk} referral${mission.referralsToAsk !== 1 ? 's' : ''} to request`,
  ].filter(Boolean) as string[]

  const totalCandidates = candidates.length
  const stale = queues.stale.length
  const cold = queues.cold.length

  const stats = [
    { label: 'To Call', value: queues.toCall.length, icon: Phone, color: 'text-blue-400' },
    { label: 'Interviews', value: queues.interviews.length, icon: Calendar, color: 'text-emerald-400' },
    { label: 'Recharge', value: queues.recharge.length, icon: Banknote, color: 'text-orange-400' },
    { label: 'Total Active', value: totalCandidates, icon: Users, color: 'text-purple-400' },
  ]

  return (
    <div className="glass-card rounded-3xl border border-border/40 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/30 bg-[var(--surface-sunken)]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="w-4 h-4 opacity-50" />
          <span className="text-xs font-medium">Operations Brief</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/40">
            AI Unavailable
          </span>
        </div>
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry AI
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-[var(--surface-sunken)] border border-border/30 rounded-xl p-3 flex items-center gap-3">
              <Icon className={`w-4 h-4 shrink-0 ${color}`} />
              <div>
                <p className="text-lg font-bold leading-none">{value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Today's Mission */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Today's Mission
          </p>
          {missionItems.length > 0 ? (
            <ul className="space-y-1.5">
              {missionItems.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {totalCandidates === 0
                ? 'No candidates yet. Add your first lead to get started.'
                : 'All caught up! No urgent actions right now.'}
            </p>
          )}
        </div>

        {/* Warnings row */}
        {(stale > 0 || cold > 0) && (
          <div className="flex flex-wrap gap-2">
            {stale > 0 && (
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <AlertTriangle className="w-3 h-3" />
                {stale} stale lead{stale !== 1 ? 's' : ''}
              </div>
            )}
            {cold > 0 && (
              <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <AlertTriangle className="w-3 h-3" />
                {cold} cold lead{cold !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        <p className="text-[11px] text-muted-foreground">
          Your RecruitOS data is fully available. AI briefing will appear when Gemini is online.
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Full AI brief (when Gemini is available)
// ─────────────────────────────────────────────────────────────
function AiBrief({ brief, onStartDay }: { brief: DailyBriefResponse; onStartDay: () => void }) {
  return (
    <div className="glass-card rounded-3xl p-6 md:p-8 border border-emerald-500/30 relative overflow-hidden shadow-lg">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <Sparkles className="w-32 h-32 text-emerald-500" />
      </div>

      <div className="relative z-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
            <span className="text-emerald-500">{brief.greeting}</span>
          </h1>
          <p className="text-lg text-foreground font-medium max-w-2xl leading-relaxed">
            {brief.headline}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[var(--surface-sunken)] border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground leading-none">{brief.metrics.criticalCandidates}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">Critical</p>
            </div>
          </div>

          <div className="bg-[var(--surface-sunken)] border border-orange-500/20 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground leading-none">{brief.metrics.overdueFollowUps}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">Overdue</p>
            </div>
          </div>

          <div className="bg-[var(--surface-sunken)] border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground leading-none">{brief.metrics.interviewsToday}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">Interviews Today</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Suggested Execution Order</h3>
              <span className="text-xs font-medium bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-md">
                ~ {brief.estimatedCompletionTime}
              </span>
            </div>

            <div className="space-y-3">
              {brief.executionOrder.map((task, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-[var(--surface-sunken)] border border-[var(--border-subtle)] p-3 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{task.recommendedAction}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{task.reason}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onStartDay}
              disabled={brief.executionOrder.length === 0}
              className="w-full mt-2 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Play className="w-5 h-5 fill-current" />
              Start My Day
            </button>
            <p className="text-center text-[11px] text-emerald-500 font-medium">
              If completed, today's workload will reduce by {brief.estimatedTimeSavings}.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4">
              <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Risks
              </h3>
              <ul className="space-y-2">
                {brief.risks.map((risk, i) => (
                  <li key={i} className="text-xs text-foreground flex items-start gap-2 leading-relaxed">
                    <span className="text-red-400 mt-1 text-[10px]">●</span>
                    {risk}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4">
              <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" /> Marketing
              </h3>
              {brief.marketing.continue.length > 0 && (
                <div className="mb-3">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase">Continue:</span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {brief.marketing.continue.map((item, i) => (
                      <span key={i} className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded border border-emerald-500/20">{item}</span>
                    ))}
                  </div>
                </div>
              )}
              {brief.marketing.reduce.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-orange-500 uppercase">Reduce:</span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {brief.marketing.reduce.map((item, i) => (
                      <span key={i} className="text-xs bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded border border-orange-500/20">{item}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
export const OperationsCoachBriefing: React.FC<OperationsCoachBriefingProps> = ({ snapshot }) => {
  const [brief, setBrief] = useState<DailyBriefResponse | null>(null)
  const [isAiLoading, setIsAiLoading] = useState(true)
  const [aiUnavailable, setAiUnavailable] = useState(false)
  const navigate = useAppNavigate()

  const fetchBrief = useCallback(async () => {
    setIsAiLoading(true)
    setAiUnavailable(false)
    setBrief(null)

    try {
      const adapter = new EdgeFunctionAdapter()
      const document = PromptBuilder.buildDailyBriefPrompt(snapshot)
      const response = await adapter.send<DailyBriefResponse>(document)
      setBrief(response)
    } catch {
      // AI is unavailable — fallback to local data-driven brief
      setAiUnavailable(true)
    } finally {
      setIsAiLoading(false)
    }
  }, [snapshot])

  useEffect(() => {
    let cancelled = false

    async function run() {
      setIsAiLoading(true)
      setAiUnavailable(false)
      try {
        const adapter = new EdgeFunctionAdapter()
        const document = PromptBuilder.buildDailyBriefPrompt(snapshot)
        const response = await adapter.send<DailyBriefResponse>(document)
        if (!cancelled) setBrief(response)
      } catch {
        if (!cancelled) setAiUnavailable(true)
      } finally {
        if (!cancelled) setIsAiLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [snapshot])

  const handleStartDay = () => {
    if (!brief || brief.executionOrder.length === 0) return
    const firstTask = brief.executionOrder[0]
    if (firstTask.candidateId) {
      navigate(ROUTES.CONTACT_DETAILS.replace(':id', firstTask.candidateId))
    } else {
      navigate(ROUTES.CONTACTS)
    }
  }

  // Loading state — show a compact skeleton, not a full-page spinner
  if (isAiLoading) {
    return (
      <div className="glass-card rounded-3xl p-4 border border-border/40 flex items-center gap-3 text-muted-foreground animate-pulse">
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        <span className="text-sm">Generating briefing...</span>
      </div>
    )
  }

  // AI unavailable — show data-driven fallback
  if (aiUnavailable || !brief) {
    return <LocalFallbackBrief onRetry={fetchBrief} />
  }

  // Full AI brief
  return <AiBrief brief={brief} onStartDay={handleStartDay} />
}
