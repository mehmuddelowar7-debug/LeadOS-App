import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/features/auth/AuthStore'

export function useReferrals() {
  const user = useAuthStore(state => state.user)

  return useQuery({
    queryKey: ['referrals', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated')
      
      const workspaceId = user.user_metadata?.workspace_id || '00000000-0000-0000-0000-000000000000'

      const { data, error } = await supabase
        .from('referrals')
        .select(`
          id,
          reward_amount,
          reward_status,
          payment_reference,
          notes,
          created_at,
          referrer:referrer_id(name),
          opportunity:opportunity_id(contact:contact_id(name))
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Failed to fetch referrals:', error)
        throw error
      }

      return data
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes — match global default explicitly
  })
}
