/**
 * OperationsSummary
 *
 * A deterministic, AI-free operations brief computed entirely from
 * local CRM data via useCandidateIntelligence.
 *
 * This is the primary view when VITE_ENABLE_AI=false.
 * It is also used as a model for what the AI briefing should enhance.
 *
 * Rules:
 *  - No AI imports
 *  - No network calls
 *  - No loading states (data is already in React Query cache)
 *  - No "AI Unavailable" messaging
 */

import { useCandidateIntelligence } from '@/hooks/useCandidateIntelligence'
import { Phone, Calendar, Banknote, Users, AlertTriangle, TrendingUp } from 'lucide-react'
import { useAppNavigate, ROUTES } from '@/lib/routes'

export function OperationsSummary() {
  const { mission, queues, candidates } = useCandidateIntelligence()
  const navigate = useAppNavigate()

  const totalCandidates = candidates.length
  const stale = queues.stale.length
  const cold = queues.cold.length
  const lost = queues.lost.length

  const stats = [
    { label: 'To Call', value: queues.toCall.length, icon: Phone, color: 'text-blue-400', route: ROUTES.CONTACTS },
    { label: 'Interviews', value: queues.interviews.length, icon: Calendar, color: 'text-emerald-400', route: ROUTES.PIPELINE },
    { label: 'Recharge', value: queues.recharge.length, icon: Banknote, color: 'text-orange-400', route: ROUTES.PIPELINE },
    { label: 'Total Active', value: totalCandidates, icon: Users, color: 'text-purple-400', route: ROUTES.CONTACTS },
  ]

  const missionItems = [
    mission.callsToMake > 0 && {
      text: `${mission.callsToMake} call${mission.callsToMake !== 1 ? 's' : ''} to make`,
      icon: Phone,
      route: ROUTES.CONTACTS,
    },
    mission.interviewsToConfirm > 0 && {
      text: `${mission.interviewsToConfirm} interview${mission.interviewsToConfirm !== 1 ? 's' : ''} to confirm`,
      icon: Calendar,
      route: ROUTES.PIPELINE,
    },
    mission.rechargesToCollect > 0 && {
      text: `${mission.rechargesToCollect} recharge${mission.rechargesToCollect !== 1 ? 's' : ''} to collect`,
      icon: Banknote,
      route: ROUTES.PIPELINE,
    },
    mission.referralsToAsk > 0 && {
      text: `${mission.referralsToAsk} referral${mission.referralsToAsk !== 1 ? 's' : ''} to request`,
      icon: TrendingUp,
      route: ROUTES.CONTACTS,
    },
  ].filter(Boolean) as { text: string; icon: React.ElementType; route: string }[]

  const hasActivity = missionItems.length > 0 || stale > 0 || cold > 0

  return (
    <div className="glass-card rounded-3xl border border-border/40 overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/30">
        <h2 className="text-sm font-semibold text-foreground">Today's Mission</h2>
        <span className="text-xs text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(({ label, value, icon: Icon, color, route }) => (
            <button
              key={label}
              onClick={() => navigate(route)}
              className="bg-[var(--surface-sunken)] border border-border/30 rounded-xl p-3 flex items-center gap-3 hover:border-border/60 transition-colors text-left group"
            >
              <Icon className={`w-4 h-4 shrink-0 ${color} group-hover:scale-110 transition-transform`} />
              <div>
                <p className="text-xl font-bold leading-none tabular-nums">{value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">{label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Mission items */}
        {hasActivity ? (
          <div className="space-y-3">
            {missionItems.length > 0 && (
              <ul className="space-y-2">
                {missionItems.map(({ text, icon: Icon, route }, i) => (
                  <li key={i}>
                    <button
                      onClick={() => navigate(route)}
                      className="w-full flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors text-left py-0.5"
                    >
                      <Icon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {text}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Warnings */}
            {(stale > 0 || cold > 0 || lost > 0) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {stale > 0 && (
                  <button
                    onClick={() => navigate(ROUTES.CONTACTS)}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-colors"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {stale} stale lead{stale !== 1 ? 's' : ''}
                  </button>
                )}
                {cold > 0 && (
                  <button
                    onClick={() => navigate(ROUTES.CONTACTS)}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {cold} cold lead{cold !== 1 ? 's' : ''}
                  </button>
                )}
                {lost > 0 && (
                  <button
                    onClick={() => navigate(ROUTES.PIPELINE)}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {lost} lost lead{lost !== 1 ? 's' : ''}
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-center">
            {totalCandidates === 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Start building your pipeline</p>
                <p className="text-xs text-muted-foreground">Add your first candidate to see today's mission.</p>
                <button
                  onClick={() => navigate(ROUTES.CONTACTS_NEW)}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Add first candidate
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">All caught up — no urgent actions right now.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
