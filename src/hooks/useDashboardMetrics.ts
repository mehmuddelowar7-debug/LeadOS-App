import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/features/auth/AuthStore'

export interface DashboardMetrics {
  mission: {
    walkinsToday: number
    followupsPending: number
    targetRemaining: number
  }
  contacts: {
    total: number
    active: number
  }
  referrals: {
    pending: number
    paid: number
  }
}

export function useDashboardMetrics() {
  const user = useAuthStore(state => state.user)

  return useQuery({
    queryKey: ['dashboard_metrics', user?.id],
    queryFn: async (): Promise<DashboardMetrics> => {
      if (!user) throw new Error('Not authenticated')
      
      // We assume user_metadata contains the workspace_id, or we use a default
      const workspaceId = user.user_metadata?.workspace_id || '00000000-0000-0000-0000-000000000000'

      const { data, error } = await supabase.rpc('get_dashboard_metrics', {
        p_workspace_id: workspaceId,
        p_user_id: user.id
      })

      if (error) {
        console.error('Failed to fetch dashboard metrics:', error)
        throw error
      }

      return data as DashboardMetrics
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
