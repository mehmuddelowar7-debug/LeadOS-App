import { memo } from 'react'
import { Clock, Phone, MapPin, User, Flame } from 'lucide-react'
import type { Contact } from '@/types'
import { cn } from '@/lib/utils'
import dayjs from 'dayjs'
import { getPriorityLevel, getRiskLevel, type CandidateData } from '@/engine/intelligence'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

interface PipelineCardProps {
  contact: Contact
  onClick: (contact: Contact) => void
  isActive: boolean
}

function PipelineCardComponent({ contact, onClick, isActive }: PipelineCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: contact.id,
    data: { contact }
  })
  // Compute days in stage using opportunity.updated_at or contact.updated_at
  const stageDate = contact.opportunity?.updated_at || contact.updated_at
  const daysInStage = dayjs().diff(dayjs(stageDate), 'day')

  const candidateData: CandidateData = {
    id: contact.id,
    name: contact.name,
    stage: contact.opportunity?.status || 'lead',
    status: contact.opportunity?.status || 'lead',
    lastContactedAt: contact.created_at,
    lastActivityAt: contact.updated_at,
    stageUpdatedAt: contact.opportunity?.updated_at || contact.updated_at,
    nextFollowUp: null, // Note: To make this fully accurate, we'd need followups injected into PipelineCard props. For now, it will compute based on stale/recharge rules.
    interviewDate: null,
    interviewStatus: null,
    rechargeAmount: (contact.opportunity as any)?.recharge_amount || 0,
    rechargeStatus: (contact.opportunity as any)?.recharge_status || null,
  }

  const today = dayjs()
  const priority = getPriorityLevel(candidateData, today)
  const risk = getRiskLevel(candidateData, today)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick(contact)
    }
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      onClick={() => onClick(contact)}
      onKeyDown={handleKeyDown}
      className={cn(
        "bg-background/80 hover:bg-muted/50 border rounded-xl p-3 cursor-pointer transition-all active:scale-[0.98] select-none touch-none",
        isActive ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border",
        // Subtly highlight risk cards
        risk === 'Critical' ? "border-red-500/30 bg-red-500/10" : 
        risk === 'High' ? "border-orange-500/30 bg-orange-500/10" :
        risk === 'Medium' ? "border-yellow-500/30 bg-yellow-500/10" : ""
      )}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-foreground truncate">{contact.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {contact.phone}
            </p>
          </div>
        </div>
        
        {/* Priority Badge */}
        {priority === 'P0' && (
          <div className="shrink-0 bg-red-500/10 text-red-500 p-1 rounded-md" title="Priority: P0">
            <Flame className="h-3 w-3" />
          </div>
        )}
        {priority === 'P1' && (
          <div className="shrink-0 bg-orange-500/10 text-orange-500 p-1 rounded-md" title="Priority: P1">
            <Flame className="h-3 w-3" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 capitalize">
            {contact.source === 'walk_in' ? <MapPin className="h-3 w-3" /> : <User className="h-3 w-3" />}
            {contact.source.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-center gap-1 font-medium">
          <Clock className="h-3 w-3" />
          {daysInStage === 0 ? 'Today' : `${daysInStage}d`}
        </div>
      </div>
    </div>
  )
}

// Strictly memoize to prevent unnecessary renders in large lists
export const PipelineCard = memo(PipelineCardComponent, (prev, next) => {
  return prev.contact.id === next.contact.id && 
         prev.isActive === next.isActive &&
         prev.contact.opportunity?.status === next.contact.opportunity?.status &&
         prev.contact.opportunity?.updated_at === next.contact.opportunity?.updated_at && prev.contact.updated_at === next.contact.updated_at
})
