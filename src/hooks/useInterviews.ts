import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/features/auth/AuthStore'
import type { Interview } from '@/types'

export function useInterviews() {
  const user = useAuthStore(state => state.user)

  return useQuery({
    queryKey: ['interviews', user?.id],
    queryFn: async (): Promise<Interview[]> => {
      if (!user) throw new Error('Not authenticated')
      
      const { data, error } = await supabase
        .from('interviews')
        .select(`
          *,
          contact:contacts(name, phone)
        `)
        .order('interview_date', { ascending: true })
        .order('interview_time', { ascending: true })

      if (error) {
        console.warn('Interviews fetch error (table might not exist):', error.message)
        return [] as Interview[]
      }
      return (data || []) as any as Interview[]
    },
    enabled: !!user,
  })
}
