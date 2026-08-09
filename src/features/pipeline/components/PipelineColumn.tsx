import { memo } from 'react'
import type { Contact } from '@/types'
import { PipelineCard } from './PipelineCard'
import { PIPELINE_THEME, type PipelineStageId } from '../config/pipelineTheme'
import { cn } from '@/lib/utils'
import { Inbox } from 'lucide-react'

import { useDroppable } from '@dnd-kit/core'

interface PipelineColumnProps {
  id: PipelineStageId
  label: string
  icon: React.ElementType
  contacts: Contact[]
  onContactClick: (contact: Contact) => void
  activeContactId: string | null
}

function PipelineColumnComponent({ id, label, icon: Icon, contacts, onContactClick, activeContactId }: PipelineColumnProps) {
  const theme = PIPELINE_THEME[id] || PIPELINE_THEME.new
  
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: { stageId: id }
  })

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "flex flex-col h-full bg-muted/20 rounded-2xl overflow-hidden min-w-[320px] w-full snap-center shrink-0 transition-colors",
        isOver && "bg-muted/50 ring-2 ring-primary/50"
      )}
    >
      {/* Column Header */}
      <div className={cn("px-4 py-3 border-b flex items-center justify-between", theme.bg, theme.border)}>
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", theme.text)} />
          <h3 className="font-bold text-sm text-foreground">{label}</h3>
        </div>
        <div className="bg-background rounded-full px-2 py-0.5 text-xs font-semibold text-muted-foreground border shadow-sm">
          {contacts.length}
        </div>
      </div>

      {/* Column Body / Cards */}
      <div className="flex-1 overflow-y-auto p-3 scrollbar-hide space-y-3">
        {contacts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground/50">
            <Inbox className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-sm font-medium">No candidates</p>
            <p className="text-xs">in {label} today</p>
          </div>
        ) : (
          contacts.map(contact => (
            <PipelineCard
              key={contact.id}
              contact={contact}
              onClick={onContactClick}
              isActive={activeContactId === contact.id}
            />
          ))
        )}
      </div>
    </div>
  )
}

export const PipelineColumn = memo(PipelineColumnComponent, (prev, next) => {
  return prev.contacts === next.contacts && 
         prev.activeContactId === next.activeContactId &&
         prev.id === next.id
})
