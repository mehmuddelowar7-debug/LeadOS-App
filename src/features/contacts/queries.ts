import { supabase } from '@/lib/supabase'

export interface DuplicateContactInfo {
  id: string
  name: string
  phone: string
  stage: string | null
  lastActivity: string | null
  interviewCount: number
  followUpCount: number
}

export async function checkDuplicateContact(cleanPhone: string): Promise<DuplicateContactInfo | null> {
  if (cleanPhone.length < 10) return null

  const { data } = await supabase
    .from('contacts')
    .select(`
      id, name, phone, updated_at,
      opportunities (status, updated_at),
      interviews (id),
      follow_ups (id, status)
    `)
    .or(`phone.eq.${cleanPhone},whatsapp.eq.${cleanPhone}`)
    .limit(1)
    .maybeSingle()

  if (!data) return null

  const opp = Array.isArray((data as any).opportunities)
    ? (data as any).opportunities[0]
    : (data as any).opportunities

  return {
    id: data.id,
    name: data.name,
    phone: data.phone,
    stage: opp?.status ?? null,
    lastActivity: opp?.updated_at ?? (data as any).updated_at ?? null,
    interviewCount: Array.isArray((data as any).interviews) ? (data as any).interviews.length : 0,
    followUpCount: Array.isArray((data as any).follow_ups)
      ? (data as any).follow_ups.filter((f: any) => f.status !== 'completed').length
      : 0,
  }
}


export async function insertContact(payload: any) {
  const { error } = await supabase.from('contacts').insert(payload)
  if (error) throw error
}

export async function updateContact(id: string, payload: any) {
  const { error } = await supabase.from('contacts').update(payload).eq('id', id)
  if (error) throw error
}

export async function insertInterview(payload: any) {
  const { error } = await supabase.from('interviews').insert(payload)
  if (error) throw error
}

export async function updateInterview(id: string, payload: any) {
  const { error } = await supabase.from('interviews').update(payload).eq('id', id)
  if (error) throw error
}

export async function insertContactActivity(payload: any) {
  const { error } = await supabase.from('contact_activities').insert(payload)
  if (error) throw error
}

export async function insertFollowUp(payload: any) {
  const { error } = await supabase.from('follow_ups').insert(payload)
  if (error) throw error
}

export async function updateFollowUp(id: string, payload: any) {
  const { error } = await supabase.from('follow_ups').update(payload).eq('id', id)
  if (error) throw error
}
