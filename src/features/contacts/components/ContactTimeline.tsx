import { motion } from 'framer-motion'
import dayjs from 'dayjs'
import { cn } from '@/lib/utils'
import type { ContactActivity } from '@/types'

const ACTIVITY_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  created: { icon: '✨', color: 'bg-blue-500/10 text-blue-500', label: 'Created' },
  called: { icon: '📞', color: 'bg-emerald-500/10 text-emerald-500', label: 'Call' },
  whatsapp_sent: { icon: '💬', color: 'bg-green-500/10 text-green-500', label: 'WhatsApp' },
  visited: { icon: '🏠', color: 'bg-purple-500/10 text-purple-500', label: 'Visited' },
  note_added: { icon: '📝', color: 'bg-amber-500/10 text-amber-500', label: 'Note' },
  status_changed: { icon: '🔄', color: 'bg-violet-500/10 text-violet-500', label: 'Status Changed' },
  registered: { icon: '📋', color: 'bg-indigo-500/10 text-indigo-500', label: 'Registered' },
  recharged: { icon: '💳', color: 'bg-teal-500/10 text-teal-500', label: 'Recharged' },
  training_started: { icon: '📚', color: 'bg-cyan-500/10 text-cyan-500', label: 'Training Started' },
  training_completed: { icon: '🎓', color: 'bg-emerald-500/10 text-emerald-500', label: 'Training Done' },
  activated: { icon: '🚀', color: 'bg-green-500/10 text-green-500', label: 'Activated' },
  document_updated: { icon: '📄', color: 'bg-orange-500/10 text-orange-500', label: 'Document' },
  follow_up_set: { icon: '📅', color: 'bg-violet-500/10 text-violet-500', label: 'Follow-up Set' },
  referral_received: { icon: '🤝', color: 'bg-indigo-500/10 text-indigo-500', label: 'Referral Received' },
  reward_paid: { icon: '💰', color: 'bg-amber-500/10 text-amber-500', label: 'Commission Paid' },
  
  // V1.2 Interview Events
  interview_scheduled: { icon: '📅', color: 'bg-blue-500/10 text-blue-500', label: 'Interview Scheduled' },
  interview_attended: { icon: '✅', color: 'bg-emerald-500/10 text-emerald-500', label: 'Interview Attended' },
  interview_no_show: { icon: '❌', color: 'bg-red-500/10 text-red-500', label: 'Interview No Show' },
  interview_rescheduled: { icon: '🔄', color: 'bg-amber-500/10 text-amber-500', label: 'Interview Rescheduled' },
  interview_cancelled: { icon: '🚫', color: 'bg-slate-500/10 text-slate-500', label: 'Interview Cancelled' },
}

export function ContactTimeline({ activities }: { activities: ContactActivity[] }) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
      <div className="space-y-0">
        {activities.map((activity, i) => {
          const config = ACTIVITY_CONFIG[activity.activity_type] || ACTIVITY_CONFIG.note_added
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative flex gap-3 pb-4"
            >
              <div className={cn('relative z-10 h-8 w-8 rounded-full flex items-center justify-center text-sm shrink-0', config.color)}>
                {config.icon}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground">{config.label}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {dayjs(activity.created_at).format('h:mm A')}
                  </span>
                </div>
                {activity.content && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{activity.content}</p>
                )}
                {(i === 0 || dayjs(activity.created_at).format('MMM D') !== dayjs(activities[i - 1]?.created_at).format('MMM D')) && (
                  <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1 block">
                    {dayjs(activity.created_at).format('ddd, MMM D')}
                  </span>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
