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
      
      const workspaceId = user.user_metadata?.workspace_id || '00000000-0000-0000-0000-000000000000'

      const { data, error } = await supabase
        .from('contacts')
        .select('id, name, phone, roles, labels, created_at, photo_url, whatsapp')
        .eq('workspace_id', workspaceId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch contacts:', error)
        throw error
      }

      return data as unknown as Contact[]
    },
    enabled: !!user,
  })
}
