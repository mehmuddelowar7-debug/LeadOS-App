import { supabase } from '@/lib/supabase'

export async function insertReferral(payload: any) {
  const { data, error } = await supabase.from('referrals').insert(payload).select()
  if (error) throw error
  return data
}

export async function updateReferral(id: string, payload: any) {
  const { data, error } = await supabase.from('referrals').update(payload).eq('id', id).select()
  if (error) throw error
  return data
}
