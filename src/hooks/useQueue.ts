import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/features/auth/AuthStore'
import dayjs from 'dayjs'

export interface QueueItem {
  id: string
  leadName: string
  leadPhone: string
  opportunity_typeName: string
  incentive: number
  probability: 'High' | 'Medium' | 'Low'
  reason: 'High Probability' | 'High Incentive' | 'Overdue' | 'Training Today' | 'Recharge Pending'
  action: 'Call' | 'WhatsApp' | 'Confirm'
  time?: string
  contact_id?: string
}

export function useQueue() {
  const user = useAuthStore(state => state.user)

  return useQuery({
    queryKey: ['priority-queue', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated')
      
      const workspaceId = user.user_metadata?.workspace_id || '00000000-0000-0000-0000-000000000000'

      // Fetch opportunities that require follow up today or are overdue
      // For V1 freeze we simulate the complex intelligent queue with a simpler robust query
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          id,
          score,
          status,
          next_followup,
          contact_id,
          opportunity_type_id,
          contacts (name, phone),
          opportunity_types (name, incentive_amount)
        `)
        .eq('workspace_id', workspaceId)
        .neq('status', 'lost')
        .neq('status', 'activated')
        .lte('next_followup', dayjs().endOf('day').toISOString())
        .order('score', { ascending: false })

      if (error) {
        console.error('Failed to fetch priority queue:', error)
        throw error
      }

      // Map DB schema to QueueItem
      const queue: QueueItem[] = data.map((opp: any) => {
        let reason: QueueItem['reason'] = 'High Probability'
        if (dayjs(opp.next_followup).isBefore(dayjs().startOf('day'))) {
          reason = 'Overdue'
        } else if (opp.status === 'recharge_pending') {
          reason = 'Recharge Pending'
        } else if (opp.status === 'registration') {
          reason = 'Training Today'
        } else if (opp.opportunity_types?.incentive_amount > 4000) {
          reason = 'High Incentive'
        }

        return {
          id: opp.id,
          contact_id: opp.contact_id,
          leadName: opp.contacts?.name || 'Unknown',
          leadPhone: opp.contacts?.phone || '',
          opportunity_typeName: opp.opportunity_types?.name || 'Opportunity',
          incentive: opp.opportunity_types?.incentive_amount || 0,
          probability: opp.score >= 75 ? 'High' : opp.score >= 40 ? 'Medium' : 'Low',
          reason,
          action: 'Call',
          time: opp.next_followup
        }
      })

      return queue
    },
    enabled: !!user,
  })
}
