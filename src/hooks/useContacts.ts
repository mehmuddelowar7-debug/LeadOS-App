import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/features/auth/AuthStore'
import { type Contact } from '@/types'

export function useContacts() {
  const user = useAuthStore(state => state.user)

  return useQuery({
    queryKey: ['contacts', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated')

      // RLS (contacts_select policy) already filters by workspace.
      // We do NOT filter by workspace_id here to avoid stale JWT mismatches.
      const { data, error } = await supabase
        .from('contacts')
        .select('id, name, phone, roles, labels, created_at, photo_url, whatsapp, source, opportunity:opportunities(status)')
        .eq('is_deleted', false)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })

      if (error) throw error  // propagate — don't silently return stale []

      return data as unknown as Contact[]
    },
    enabled: !!user,
    staleTime: 30_000, // 30s — stays fresh after Quick Capture inserts
  })
}
