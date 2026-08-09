import React from 'react'
import { Clock, Briefcase } from 'lucide-react'
import type { ContactProfileData } from '@/hooks/useContactProfile'
import dayjs from 'dayjs'
import { cn } from '@/lib/utils'

interface Props {
  contact: ContactProfileData
}

export const CRMSummaryPanel: React.FC<Props> = ({ contact }) => {
  const opp = contact.opportunity
  
  const daysInPipeline = opp ? dayjs().diff(dayjs(opp.created_at), 'day') : 0
  const lastContacted = dayjs(contact.updated_at).fromNow()
  const stage = opp?.status || 'Lead'
  
  return (
    <div className="glass-card rounded-2xl overflow-hidden mb-6 border border-primary/20 relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
      
      <div className="p-4 border-b border-white/5 bg-white/5">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary" />
          CRM Summary
        </h3>
      </div>
      
      <div className="p-4 grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Current Stage</p>
          <p className="text-sm font-semibold text-foreground capitalize">{stage.replace('_', ' ')}</p>
        </div>
        
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Days in Pipeline</p>
          <p className="text-sm font-semibold text-foreground">{daysInPipeline} days</p>
        </div>
        
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Last Contact</p>
          <p className="text-sm font-semibold text-foreground flex items-center gap-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            {lastContacted}
          </p>
        </div>
        
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Source</p>
          <p className="text-sm font-semibold text-foreground capitalize">{contact.source?.replace('_', ' ') || 'Unknown'}</p>
        </div>
        
        {opp?.priority && (
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Priority</p>
            <span className={cn(
              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
              opp.priority === 'high' ? 'bg-red-500/10 text-red-500' :
              opp.priority === 'medium' ? 'bg-amber-500/10 text-amber-500' :
              'bg-blue-500/10 text-blue-500'
            )}>
              {opp.priority}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
