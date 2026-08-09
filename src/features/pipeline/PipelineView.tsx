import { useState } from 'react'
import { usePipeline } from './hooks/usePipeline'
import { PIPELINE_STAGES, type PipelineStageId } from './config/pipelineConfig'
import { PipelineSummary } from './components/PipelineSummary'
import { PipelineColumn } from './components/PipelineColumn'
import { PipelineCard } from './components/PipelineCard'
import { useAppNavigate, ROUTES } from '@/lib/routes'
import type { Contact } from '@/types'
import { cn } from '@/lib/utils'
import { PIPELINE_THEME } from './config/pipelineTheme'
import { PipelineSkeleton } from './components/PipelineSkeleton'
import { DndContext, DragOverlay, closestCenter, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { logActivity } from '@/lib/activityLogger'

export function PipelineView({ activeContactId }: { activeContactId: string | null }) {
  const navigate = useAppNavigate()
  const queryClient = useQueryClient()
  const { contactsByStage, counts, isLoading } = usePipeline()

  // Drag and drop state
  const [activeDragContact, setActiveDragContact] = useState<Contact | null>(null)

  // Mobile specific: selected tab state
  const [activeTab, setActiveTab] = useState<PipelineStageId>('lead')

  const handleContactClick = (contact: Contact) => {
    navigate(ROUTES.CONTACT_DETAILS.replace(':id', contact.id))
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveDragContact(active.data.current?.contact || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDragContact(null)

    if (!over) return

    const contact = active.data.current?.contact as Contact
    const targetStageId = over.data.current?.stageId as PipelineStageId

    if (!contact || !targetStageId) return

    // Find the target status mapping
    const targetStageConfig = PIPELINE_STAGES.find(s => s.id === targetStageId)
    if (!targetStageConfig || !(targetStageConfig as any).nextStatus) return
    const newStatus = targetStageConfig.id === 'lead' ? 'interested' : (targetStageConfig as any).nextStatus

    const oldStatus = contact.opportunity?.status
    if (oldStatus === newStatus) return

    try {
      if (contact.opportunity) {
        // Optimistic update
        queryClient.setQueryData(['contacts'], (old: Contact[]) => {
          if (!old) return old
          return old.map(c => 
            c.id === contact.id 
              ? { ...c, opportunity: { ...c.opportunity, status: newStatus } }
              : c
          )
        })

        const { error } = await supabase
          .from('opportunities')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', contact.opportunity.id)
        
        if (error) throw error
        toast.success(`Moved to ${targetStageConfig.label}`)
        
        // Log the activity
        await logActivity(contact.id, 'stage_change', `Moved to ${targetStageConfig.label}`)
      } else {
        toast.error('Candidate has no active opportunity. Cannot change stage.')
      }
    } catch (err: any) {
      toast.error('Failed to move candidate: ' + err.message)
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    }
  }

  if (isLoading) {
    return <PipelineSkeleton />
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Top Summary Header */}
      <div className="shrink-0 border-b px-4 py-2 bg-background">
        <PipelineSummary counts={counts} />
      </div>

      {/* Mobile Tabs (Hidden on tablet/desktop) */}
      <div className="flex md:hidden overflow-x-auto scrollbar-hide border-b bg-muted/10 shrink-0">
        {PIPELINE_STAGES.map((stage) => {
          const isActive = activeTab === stage.id
          const theme = PIPELINE_THEME[stage.id] || PIPELINE_THEME.new
          
          return (
            <button
              key={stage.id}
              onClick={() => setActiveTab(stage.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors shrink-0",
                isActive ? cn(theme.text, "border-current bg-background") : "text-muted-foreground border-transparent hover:bg-muted/50"
              )}
            >
              <stage.icon className="h-4 w-4" />
              {stage.label}
              <span className={cn("ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold", isActive ? theme.bg : "bg-muted text-muted-foreground")}>
                {counts[stage.id]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Board Layout */}
      <div className="flex-1 overflow-x-auto scrollbar-hide md:p-4">
        <div className="flex h-full md:gap-4 lg:gap-6 min-w-max pb-4 px-4 md:px-0 mt-4 md:mt-0">
          {PIPELINE_STAGES.map((stage) => {
            const isVisibleOnMobile = activeTab === stage.id
            
            return (
              <div 
                key={stage.id} 
                className={cn(
                  "h-full w-full md:w-[320px] shrink-0",
                  isVisibleOnMobile ? "block" : "hidden md:block"
                )}
              >
                <PipelineColumn
                  id={stage.id}
                  label={stage.label}
                  icon={stage.icon}
                  contacts={contactsByStage[stage.id]}
                  onContactClick={handleContactClick}
                  activeContactId={activeContactId}
                />
              </div>
            )
          })}
        </div>
      </div>

      <DragOverlay>
        {activeDragContact ? (
          <div className="opacity-90 shadow-2xl rotate-2 scale-105 transition-transform w-[280px]">
            <PipelineCard
              contact={activeDragContact}
              onClick={() => {}}
              isActive={false}
            />
          </div>
        ) : null}
      </DragOverlay>
      </div>
    </DndContext>
  )
}
