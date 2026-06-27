import { ROUTES } from '@/lib/routes'
import { useState, useMemo } from 'react'
import { PerformanceProfiler } from '@/components/dev/PerformanceProfiler'
import { useRenderProfiler } from '@/hooks/useRenderProfiler'
import { motion } from 'framer-motion'
import { useAppNavigate } from '@/lib/routes'
import { ProgressRing } from '@/components/shared/ProgressRing'
import {
  PhoneCall, Calendar, Plus, Zap, Users, 
  ArrowRight, MoonStar, Star, CheckCircle2, Award, TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EndDaySheet } from './EndDaySheet'
import { useAuthStore } from '@/features/auth/AuthStore'
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics'
import { useQueue } from '@/hooks/useQueue'
import dayjs from 'dayjs'

// Inline skeleton for metric numbers while cache or network resolves
const MetricSkeleton = () => <div className="inline-block w-10 h-6 bg-primary/10 animate-pulse rounded" />

// Removed animation container variants to reduce UX latency

export function InsightsView() {
  const navigate = useAppNavigate()
  const user = useAuthStore(state => state.user)
  const [endDayOpen, setEndDayOpen] = useState(false)

  const { data: metrics, isLoading: isMetricsLoading } = useDashboardMetrics()
  const { data: queue = [] } = useQueue()

  useRenderProfiler('InsightsView', {}, { user, metrics, queue, endDayOpen })

  const stats = useMemo(() => ({
    totalContacts: metrics?.contacts.total || 0,
    activePartners: 0, // Fallback to 0 if metrics don't have it
    opportunities: metrics?.contacts.active || 0,
    conversionRate: metrics?.contacts.total ? Math.round((metrics.contacts.active / metrics.contacts.total) * 100) : 0,
    lifetimeRewards: metrics?.referrals.paid || 0,
    priorityTasks: metrics?.mission.followupsPending || 0
  }), [metrics])

  const priorityQueue = useMemo(() => {
    return queue.slice(0, 3).map(q => ({
      id: q.id,
      name: q.leadName,
      type: q.opportunity_typeName,
      action: q.action,
      isHot: q.probability === 'High'
    }))
  }, [queue])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])



  return (
    <PerformanceProfiler id="InsightsView">
      <div className="space-y-6 pb-32 md:pb-8 h-full flex flex-col px-4 pt-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold text-foreground">{greeting}, {user?.user_metadata?.first_name || 'Partner'} 👋</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {dayjs().format('dddd, D MMM')}
          </p>
        </div>
        <button
          onClick={() => setEndDayOpen(true)}
          className="h-10 px-4 rounded-xl flex items-center justify-center bg-muted text-foreground font-semibold text-sm shadow-sm hover:bg-accent transition-colors"
        >
          <MoonStar className="h-4 w-4 mr-2 text-violet-500" /> End Day
        </button>
      </div>

      {/* Network Health Progress */}
      <div className="glass-card rounded-2xl p-5 flex items-center gap-6 border-primary/20 bg-primary/5">
        <ProgressRing
          value={stats.conversionRate}
          max={100}
          size={90}
          strokeWidth={8}
          label="Conversion"
          sublabel="Rate"
        />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Users className="h-5 w-5" /> Network Size
          </div>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-black tracking-tight">{isMetricsLoading ? <MetricSkeleton /> : stats.totalContacts}</span>
            <span className="text-sm text-muted-foreground font-medium mb-1">people</span>
          </div>
          <p className="text-xs font-semibold text-primary/80">
            {stats.activePartners} Active Partners driving {stats.conversionRate}% conversion
          </p>
        </div>
      </div>

      {/* Priority Nurture Queue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Priority Nurture Queue</h2>
          <button 
            onClick={() => navigate('/queue')}
            className="text-[11px] font-bold text-primary flex items-center"
          >
            See All <ArrowRight className="h-3 w-3 ml-1" />
          </button>
        </div>
        <div className="space-y-2">
          {priorityQueue.length === 0 ? (
            <div className="glass-card rounded-xl p-6 text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500/50 mb-2" />
              <p className="text-sm font-bold text-foreground">No priority tasks.</p>
              <p className="text-[11px] text-muted-foreground mt-1">You're all caught up!</p>
            </div>
          ) : (
            priorityQueue.map(contact => (
              <div key={contact.id} className="glass-card rounded-xl p-3 flex items-center justify-between touch-target" onClick={() => navigate(`/queue/${contact.id}`)}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                    contact.action === 'Call' ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600"
                  )}>
                    {contact.action === 'Call' ? <PhoneCall className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      {contact.name} {contact.isHot && <Star className="h-3 w-3 fill-amber-500 text-amber-500" />}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">{contact.type} · {contact.action}</p>
                  </div>
                </div>
                <button className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors">
                  <CheckCircle2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Network Metrics Grid */}
      <div className="space-y-3 pb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Network Health</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-xl p-4 space-y-2 group cursor-pointer" onClick={() => navigate(ROUTES.REFERRALS)}>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Award className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-foreground tracking-tight">₹{isMetricsLoading ? <MetricSkeleton /> : `${(stats.lifetimeRewards / 1000).toFixed(0)}k`}</div>
            <div className="text-[11px] text-muted-foreground font-medium">Rewards Paid</div>
          </div>
          <div className="glass-card rounded-xl p-4 space-y-2 group cursor-pointer" onClick={() => navigate(ROUTES.CONTACTS)}>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-foreground tracking-tight">{isMetricsLoading ? <MetricSkeleton /> : stats.opportunities}</div>
            <div className="text-[11px] text-muted-foreground font-medium">Active Opportunities</div>
          </div>
          <div className="glass-card rounded-xl p-4 space-y-2 group cursor-pointer" onClick={() => navigate(ROUTES.REFERRALS)}>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-foreground tracking-tight">{isMetricsLoading ? <MetricSkeleton /> : stats.activePartners}</div>
            <div className="text-[11px] text-muted-foreground font-medium">Top Referrers</div>
          </div>
          <div className="glass-card rounded-xl p-4 space-y-2 group cursor-pointer" onClick={() => navigate('/queue?filter=urgent')}>
            <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-foreground tracking-tight">{isMetricsLoading ? <MetricSkeleton /> : stats.priorityTasks}</div>
            <div className="text-[11px] text-muted-foreground font-medium">Urgent Actions</div>
          </div>
        </div>
      </div>

      {/* Massive Quick Capture FAB for Mobile/Tablet */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/contacts/new?mode=quick')}
        className="fixed bottom-[calc(80px+env(safe-area-inset-bottom,0px))] md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 flex items-center justify-center font-bold text-lg z-40 lg:hidden"
      >
        <Plus className="h-6 w-6 md:mr-0 mr-2" /> <span className="md:hidden">Add Contact</span>
      </motion.button>

      <EndDaySheet open={endDayOpen} onClose={() => setEndDayOpen(false)} />
      </div>
    </PerformanceProfiler>
  )
}
