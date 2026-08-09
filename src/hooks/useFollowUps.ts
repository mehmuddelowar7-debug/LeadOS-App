import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/features/auth/AuthStore'
import type { FollowUp } from '@/types'

export function useFollowUps() {
  const user = useAuthStore(state => state.user)

  return useQuery({
    queryKey: ['follow_ups', user?.id],
    queryFn: async (): Promise<FollowUp[]> => {
      if (!user) throw new Error('Not authenticated')
      
      const { data, error } = await supabase
        .from('follow_ups')
        .select(`
          *,
          contact:contacts(name, phone)
        `)
        .order('follow_up_date', { ascending: true })
        .order('follow_up_time', { ascending: true })

      if (error) {
        console.warn('FollowUps fetch error (table might not exist):', error.message)
        return [] as FollowUp[]
      }
      return (data || []) as any as FollowUp[]
    },
    enabled: !!user,
  })
}
