import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { type OpportunityType } from '@/types'

export function useOpportunityTypes() {
  return useQuery({
    queryKey: ['opportunity_types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunity_types')
        .select('id, workspace_id, name, program_type, description, is_active, incentive_amount, status, color, sort_order')
        .eq('status', 'active')
        .order('sort_order', { ascending: true })

      if (error) {
        console.error('Failed to fetch opportunity types:', error)
        throw error
      }

      return data as unknown as OpportunityType[]
    },
  })
}
