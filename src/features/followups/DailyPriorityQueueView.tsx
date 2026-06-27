import { useAppNavigate } from '@/lib/routes'
import { useState } from 'react'
import { motion, useAnimation, type PanInfo } from 'framer-motion'
import { CheckCircle, AlertCircle, Phone, Calendar, Zap, TrendingUp, Sparkles, Check } from 'lucide-react'
import { useLocation } from 'react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

import { useQueue, type QueueItem } from '@/hooks/useQueue'

// ============================================================================
// Queue Item Card
// ============================================================================
function QueueCard({ item: queueItem, isActive }: { item: QueueItem, isActive: boolean }) {
  const navigate = useAppNavigate()
  const controls = useAnimation()
  const [completed, setCompleted] = useState(false)

  const getReasonConfig = (reason: QueueItem['reason']) => {
    switch (reason) {
      case 'High Probability': return { icon: Sparkles, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' }
      case 'High Incentive': return { icon: TrendingUp, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' }
      case 'Overdue': return { icon: AlertCircle, color: 'text-red-500 bg-red-500/10 border-red-500/20' }
      case 'Training Today': return { icon: Calendar, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' }
      case 'Recharge Pending': return { icon: Zap, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' }
    }
  }

  const { icon: ReasonIcon, color: reasonColor } = getReasonConfig(queueItem.reason)

  const handleDragEnd = async (_e: any, info: PanInfo) => {
    const threshold = 100
    if (info.offset.x > threshold) {
      setCompleted(true)
      toast.success('Task marked as completed!')
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } })
    }
  }

  if (completed) return null

  return (
    <div className="relative w-full overflow-hidden rounded-2xl touch-pan-y bg-emerald-500/20">
      {/* Swipe Background */}
      <div className="absolute inset-0 flex items-center px-6 pointer-events-none text-emerald-600 font-bold">
        <Check className="h-6 w-6 mr-2" /> Complete
      </div>
      
      {/* Foreground Card */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        onDragEnd={handleDragEnd}
        animate={controls}
        onClick={() => navigate(`/queue/${queueItem.id}`)}
        className={cn(
          "glass-card rounded-2xl p-4 cursor-pointer relative z-10 w-full active:scale-[0.99] touch-pan-y border-l-8",
          queueItem.probability === 'High' ? 'border-l-red-500' : queueItem.probability === 'Medium' ? 'border-l-amber-500' : 'border-l-blue-500',
          isActive ? "bg-primary/5 shadow-sm" : "bg-background hover:bg-muted/50"
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-lg font-bold text-foreground truncate">{queueItem.leadName}</h3>
              <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full border', reasonColor)}>
                <ReasonIcon className="inline h-3 w-3 mr-1" />
                {queueItem.reason}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground mt-1">
              <span className="text-foreground">{queueItem.opportunity_typeName}</span>
              <span>•</span>
              <span className="text-emerald-500">₹{queueItem.incentive} Reward</span>
            </div>

            {queueItem.time && (
              <p className="text-xs text-red-500 font-bold mt-1.5 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Due {dayjs(queueItem.time).fromNow()}
              </p>
            )}

            <div className="flex items-center gap-2 mt-4">
              <Button
                className={cn(
                  "min-h-[52px] rounded-[16px] text-sm flex-1 font-bold shadow-sm",
                  queueItem.action === 'Call' ? "bg-emerald-600 hover:bg-emerald-700 text-white" :
                  queueItem.action === 'WhatsApp' ? "bg-[#25D366] hover:bg-[#128C7E] text-white" :
                  "bg-blue-600 hover:bg-blue-700 text-white"
                )}
                onClick={(e) => { e.stopPropagation(); window.open(queueItem.action === 'WhatsApp' ? `https://wa.me/${queueItem.leadPhone}` : `tel:${queueItem.leadPhone}`) }}
              >
                {queueItem.action === 'Call' && <Phone className="h-5 w-5 mr-2" />}
                {queueItem.action === 'WhatsApp' && <span className="text-lg mr-2">💬</span>}
                {queueItem.action === 'Confirm' && <Calendar className="h-5 w-5 mr-2" />}
                {queueItem.action}
              </Button>
              
              <Button
                variant="outline"
                className="min-h-[52px] w-[52px] rounded-[16px] p-0 border-emerald-500 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 shadow-sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setCompleted(true)
                  toast.success('Task marked as completed!')
                }}
              >
                <Check className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ============================================================================
// Daily Priority Queue View
// ============================================================================
export function DailyPriorityQueueView() {
  const location = useLocation()
  const activeId = location.pathname.split('/').pop() || null

  const { data: queue = [], isLoading } = useQueue()
  
  const [filter, setFilter] = useState<'all' | 'high_prob' | 'urgent'>('all')

  const filteredQueue = queue.filter(q => {
    if (filter === 'all') return true;
    if (filter === 'high_prob') return q.probability === 'High' || q.reason === 'High Incentive';
    if (filter === 'urgent') return q.reason === 'Overdue' || q.reason === 'Training Today' || q.reason === 'Recharge Pending';
    return true;
  })

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
        <p className="text-sm text-muted-foreground">Loading queue...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full space-y-4 px-4 pt-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            Priority Queue <Sparkles className="h-6 w-6 text-amber-500" />
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 font-medium">Clear these tasks to hit your target.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x pt-2">
        {[
          { key: 'all', label: 'All Tasks' },
          { key: 'urgent', label: 'Urgent' },
          { key: 'high_prob', label: 'High Potential' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={cn(
              'px-5 min-h-[44px] rounded-full text-sm font-bold transition-all snap-start border-2 shrink-0 touch-target',
              filter === f.key
                ? 'bg-foreground text-background border-foreground shadow-md'
                : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-32 pt-2">
        <div
          key={filter}
          className="space-y-4"
        >
          {filteredQueue.length > 0 ? (
            filteredQueue.map((item) => <QueueCard key={item.id} item={item} isActive={activeId === item.id} />)
          ) : (
            <div
              className="text-center py-12"
            >
              <CheckCircle className="h-16 w-16 mx-auto text-emerald-500/50 mb-4" />
              <p className="text-lg font-bold text-foreground">No pending tasks.</p>
              <p className="text-sm text-muted-foreground mt-1">You've cleared all priorities for now.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
