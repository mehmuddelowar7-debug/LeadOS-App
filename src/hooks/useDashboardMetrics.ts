import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/features/auth/AuthStore'

export interface TargetMetric {
  actual: number
  target: number
}

export interface DashboardMetrics {
  mission: {
    leads: TargetMetric
    calls: TargetMetric
    interviews: TargetMetric
    walkins: TargetMetric
    recharges: TargetMetric
    trainings: TargetMetric
    activations: TargetMetric
    followupsPending: number
    followupsToday: number
    walkinsToday: number // legacy
    targetRemaining: number // legacy
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
        console.warn('Dashboard metrics RPC failed (function may not be deployed):', error.message)
        // Return zero-state metrics — dashboard renders without RPC
        return {
          mission: {
            leads: { actual: 0, target: 0 }, calls: { actual: 0, target: 0 },
            interviews: { actual: 0, target: 0 }, walkins: { actual: 0, target: 0 },
            recharges: { actual: 0, target: 0 }, trainings: { actual: 0, target: 0 },
            activations: { actual: 0, target: 0 },
            followupsPending: 0, followupsToday: 0, walkinsToday: 0, targetRemaining: 0
          },
          contacts: { total: 0, active: 0 },
          referrals: { pending: 0, paid: 0 }
        } as DashboardMetrics
      }

      return data as DashboardMetrics
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
