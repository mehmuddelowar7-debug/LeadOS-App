import { supabase } from '@/lib/supabase'

export async function exportEndDayContacts(workspaceId: string, startOfDay: string) {
  const { data, error } = await supabase
    .from('contacts')
    .select('id, name, phone, roles, origin, current_area, created_at')
    .eq('workspace_id', workspaceId)
    .gte('created_at', startOfDay)
  
  if (error) throw error
  return data
}

export async function exportWeeklyContacts(workspaceId: string, lastWeek: string) {
  const { data, error } = await supabase
    .from('contacts')
    .select('id, name, phone, roles, origin, current_area, created_at')
    .eq('workspace_id', workspaceId)
    .gte('created_at', lastWeek)
  
  if (error) throw error
  return data
}

export async function exportMonthlyContacts(workspaceId: string, lastMonth: string) {
  const { data, error } = await supabase
    .from('contacts')
    .select('id, name, phone, roles, origin, current_area, created_at')
    .eq('workspace_id', workspaceId)
    .gte('created_at', lastMonth)
  
  if (error) throw error
  return data
}

export async function exportReferrals(workspaceId: string) {
  const { data, error } = await supabase
    .from('referrals')
    .select('id, status, reward_status, reward_amount, payment_method, created_at, contacts(name, phone)')
    .eq('workspace_id', workspaceId)
    
  if (error) throw error
  
  return data.map(r => {
    const contact = Array.isArray(r.contacts) ? r.contacts[0] : r.contacts
    return {
      ...r,
      referrer_name: contact?.name,
      referrer_phone: contact?.phone,
      contacts: undefined 
    }
  })
}
