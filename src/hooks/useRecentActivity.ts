import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/features/auth/AuthStore'
import type { ContactActivity } from '@/types'

export interface GlobalActivity extends ContactActivity {
  contact: {
    name: string
  }
}

export function useRecentActivity(limit = 10) {
  const user = useAuthStore(state => state.user)

  return useQuery({
    queryKey: ['recent_activity', user?.id, limit],
    queryFn: async (): Promise<GlobalActivity[]> => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('contact_activities')
        .select('*, contact:contact_id(name)')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.warn('Recent activity fetch failed:', error.message)
        return [] as GlobalActivity[]
      }

      return data as GlobalActivity[]
    },
    enabled: !!user,
  })
}
