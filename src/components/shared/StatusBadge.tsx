import { cn } from '@/lib/utils'
import type { OpportunityStatus } from '@/types'
import { OPPORTUNITY_STATUS_LABELS } from '@/types'

interface StatusBadgeProps {
  status: OpportunityStatus
  className?: string
}

const statusStyles: Record<OpportunityStatus, string> = {
  new: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  interested: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  registration: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  recharge_pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  recharge_completed: 'bg-green-500/10 text-green-600 dark:text-green-400',
  training: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  completed: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  activated: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  consulting: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  lost: 'bg-red-500/10 text-red-600 dark:text-red-400',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide',
        statusStyles[status],
        className
      )}
    >
      {OPPORTUNITY_STATUS_LABELS[status]}
    </span>
  )
}

interface ScoreBadgeProps {
  score: number
  className?: string
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  const label = score >= 70 ? '🔥 Hot' : score >= 40 ? '🟡 Warm' : '🔴 Cold'
  const style = score >= 70 ? 'score-hot' : score >= 40 ? 'score-warm' : 'score-cold'

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold',
        style,
        className
      )}
    >
      {label} {score}
    </span>
  )
}
