import { supabase } from './supabase'
import { useAuthStore } from '@/features/auth/AuthStore'

export type ActivityType = 'call' | 'whatsapp' | 'email' | 'stage_change' | 'note' | 'sms'

export async function logActivity(contactId: string, type: ActivityType, note?: string) {
  const user = useAuthStore.getState().user
  if (!user) return

  const workspaceId = user.user_metadata?.workspace_id || '00000000-0000-0000-0000-000000000000'

  await supabase.from('contact_activities').insert({
    contact_id: contactId,
    workspace_id: workspaceId,
    created_by: user.id,
    type: type,
    note: note || `Logged a ${type}`,
  })
}
