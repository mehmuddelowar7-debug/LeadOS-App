import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { type Contact, type Opportunity, type ContactActivity } from '@/types'

export interface ContactProfileData extends Contact {
  opportunity?: Opportunity
  activities: ContactActivity[]
}

export function useContactProfile(id?: string) {
  return useQuery({
    queryKey: ['contact-profile', id],
    queryFn: async () => {
      if (!id) throw new Error('No contact ID provided')

      // Fetch contact
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('id, workspace_id, name, phone, whatsapp, age, gender, photo_url, roles, labels, origin, native_language, current_area, location_lat, location_lng, address, english_level, interview_ready, doc_status, support_status, interest_level, current_salary, expected_salary, created_at, created_by')
        .eq('id', id)
        .single()

      if (contactError) throw contactError

      // Fetch opportunity
      const { data: opportunity } = await supabase
        .from('opportunities')
        .select('id, workspace_id, contact_id, type_id, status, expected_walkin_date, next_followup, score, notes, created_at, created_by')
        .eq('contact_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Fetch activities
      const { data: activities = [] } = await supabase
        .from('contact_activities')
        .select('id, workspace_id, contact_id, type, details, created_at, created_by')
        .eq('contact_id', id)
        .order('created_at', { ascending: false })

      return {
        ...contact,
        opportunity: opportunity || undefined,
        activities: activities || []
      } as unknown as ContactProfileData
    },
    enabled: !!id,
  })
}
