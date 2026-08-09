import { useMemo } from 'react'
import { useContacts } from '@/hooks/useContacts'
import { useInterviews } from '@/hooks/useInterviews'
import type { Contact } from '@/types'
import { type PipelineStageId } from '../config/pipelineConfig'

export interface PipelineData {
  contactsByStage: Record<PipelineStageId, Contact[]>
  counts: Record<PipelineStageId, number>
  totalActive: number
}

export function usePipeline(): PipelineData & { isLoading: boolean } {
  const { data: contacts = [], isLoading: isContactsLoading } = useContacts()
  const { data: interviews = [], isLoading: isInterviewsLoading } = useInterviews()

  const pipelineData = useMemo(() => {
    // Initialize groups
    const groups: Record<PipelineStageId, Contact[]> = {
      lead: [],
      interview: [],
      selected: [],
      recharge: [],
      joined: []
    }

    // Map active interviews by contact ID for O(1) lookup
    const activeInterviewContactIds = new Set(
      interviews
        .filter(i => ['scheduled', 'rescheduled'].includes(i.status))
        .map(i => i.contact_id)
    )

    contacts.forEach(contact => {
      // Exclude deleted or lost contacts from pipeline entirely
      if (contact.is_deleted || contact.opportunity?.status === 'lost') {
        return
      }

      const status = contact.opportunity?.status

      // 1. Interview Stage (Highest precedence if active interview exists)
      if (activeInterviewContactIds.has(contact.id)) {
        groups.interview.push(contact)
        return
      }

      // 2. Map based on explicit status
      switch (status) {
        case 'new':
        case 'interested':
          groups.lead.push(contact)
          break
        
        case 'registration':
          groups.selected.push(contact)
          break

        case 'recharge_pending':
        case 'recharge_completed':
          groups.recharge.push(contact)
          break

        case 'training':
        case 'activated':
        case 'completed':
        case 'consulting':
          groups.joined.push(contact)
          break
          
        default:
          // If status doesn't match known mappings, drop them into lead or skip
          // Assuming 'opportunity' role contacts without status go to lead
          if (contact.roles.includes('opportunity')) {
            groups.lead.push(contact)
          }
          break
      }
    })

    // Sort each group (e.g., prioritize hot leads, then by date)
    Object.keys(groups).forEach(key => {
      const stage = key as PipelineStageId
      groups[stage].sort((a, b) => {
        const scoreA = a.opportunity?.score || 0
        const scoreB = b.opportunity?.score || 0
        if (scoreA !== scoreB) return scoreB - scoreA
        
        // Fallback to latest interaction or creation
        const dateA = new Date(a.last_interaction_date || a.created_at).getTime()
        const dateB = new Date(b.last_interaction_date || b.created_at).getTime()
        return dateB - dateA
      })
    })

    const counts = {
      lead: groups.lead.length,
      interview: groups.interview.length,
      selected: groups.selected.length,
      recharge: groups.recharge.length,
      joined: groups.joined.length,
    }

    const totalActive = Object.values(counts).reduce((a, b) => a + b, 0)

    return { contactsByStage: groups, counts, totalActive }
  }, [contacts, interviews])

  return {
    ...pipelineData,
    isLoading: isContactsLoading || isInterviewsLoading
  }
}
