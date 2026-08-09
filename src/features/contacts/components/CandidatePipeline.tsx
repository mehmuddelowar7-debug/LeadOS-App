import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { pushToMutationQueue } from '@/lib/offlineSync'
import { PIPELINE_STAGES } from '@/features/pipeline/config/pipelineConfig'

export function CandidatePipeline({ contactId, opportunity, onOpenInterview }: { contactId: string, opportunity: any, onOpenInterview: () => void }) {
  if (!opportunity) return null
  
  const currentStatus = opportunity.status

  const handleStageClick = async (stage: typeof PIPELINE_STAGES[0]) => {
    if ('action' in stage && stage.action === 'open_interview') {
      onOpenInterview()
      return
    }

    if ('nextStatus' in stage && stage.nextStatus) {
      const updatedStatus = stage.nextStatus
      
      // Optimistic update logic would normally go here, but we will rely on react-query invalidate
      toast.success(`Status updated to ${stage.label}`)
      
      await pushToMutationQueue({
        action: 'UPDATE',
        table: 'opportunities',
        payload: {
          id: opportunity.id,
          status: updatedStatus,
          updated_at: new Date().toISOString()
        }
      })
      
      // Also write an activity log
      await pushToMutationQueue({
        action: 'INSERT',
        table: 'contact_activities',
        payload: {
          id: crypto.randomUUID(),
          workspace_id: opportunity.workspace_id,
          contact_id: contactId,
          activity_type: 'status_changed',
          content: `Status updated to ${updatedStatus.replace('_', ' ')}`,
          created_at: new Date().toISOString()
        }
      })
    }
  }

  // Determine active index based on current status loosely
  let activeIndex = 0
  if (currentStatus === 'interested') activeIndex = 1
  else if (currentStatus === 'registration') activeIndex = 2
  else if (currentStatus === 'recharge_pending') activeIndex = 3
  else if (currentStatus === 'recharge_completed') activeIndex = 4
  else if (currentStatus === 'training' || currentStatus === 'completed') activeIndex = 5
  else if (currentStatus === 'activated') activeIndex = 6

  return (
    <div className="mt-4 pb-2 -mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto scrollbar-hide">
      <div className="flex items-center gap-2 min-w-max">
        {PIPELINE_STAGES.map((stage, i) => {
          const isCompleted = i < activeIndex
          const isCurrent = i === activeIndex
          return (
            <div key={stage.id} className="flex items-center">
              <button
                onClick={() => handleStageClick(stage as any)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border-2 active:scale-95 touch-target",
                  isCompleted ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                  isCurrent ? "bg-primary text-primary-foreground border-primary shadow-md" :
                  "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                )}
              >
                {stage.label}
              </button>
              {i < PIPELINE_STAGES.length - 1 && (
                <div className={cn("w-4 h-0.5 mx-1", isCompleted ? "bg-emerald-500/30" : "bg-border")} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
