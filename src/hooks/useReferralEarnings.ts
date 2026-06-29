import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/features/auth/AuthStore'
import type { ReferralStatus } from '@/types'

export interface EarningsData {
  total: number
  pending: number
  approved: number
  paid: number
  rejected: number
}

export function useReferralEarnings() {
  const user = useAuthStore(state => state.user)

  return useQuery({
    queryKey: ['referralEarnings', user?.id],
    queryFn: async (): Promise<EarningsData> => {
      if (!user) throw new Error('Not authenticated')
      
      const workspaceId = user.user_metadata?.workspace_id || '00000000-0000-0000-0000-000000000000'

      const { data, error } = await supabase
        .from('referrals')
        .select('commission_amount, status')
        .eq('workspace_id', workspaceId)

      if (error) {
        console.error('Failed to fetch referral earnings:', error)
        throw error
      }

      const earnings = {
        total: 0,
        pending: 0,
        approved: 0,
        paid: 0,
        rejected: 0
      }

      data.forEach(ref => {
        const amount = Number(ref.commission_amount || 0)
        
        switch (ref.status as ReferralStatus) {
          case 'pending':
            earnings.pending += amount
            earnings.total += amount
            break
          case 'approved':
            earnings.approved += amount
            earnings.total += amount
            break
          case 'paid':
            earnings.paid += amount
            earnings.total += amount
            break
          case 'rejected':
            earnings.rejected += amount
            break
        }
      })

      return earnings
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  })
}
