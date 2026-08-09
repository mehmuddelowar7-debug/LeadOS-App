import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { type Contact, type Opportunity, type ContactActivity, type Referral } from '@/types'

export interface ContactProfileData extends Contact {
  opportunity?: Opportunity
  activities: ContactActivity[]
  referredBy?: Referral
  referredCandidates: Referral[]
}

export function useContactProfile(id?: string) {
  return useQuery({
    queryKey: ['contact-profile', id],
    queryFn: async () => {
      if (!id) throw new Error('No contact ID provided')

      // ── REQUIRED: Fetch the contact itself ────────────────────────────────
      // This is the only query allowed to fail the entire hook.
      // If the contact doesn't exist or RLS rejects, show "Contact not found."
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('id, workspace_id, name, phone, whatsapp, age, gender, photo_url, roles, labels, origin, native_language, current_area, location_lat, location_lng, source, notes, is_deleted, created_at, updated_at, created_by')
        .eq('id', id)
        .single()

      if (contactError || !contact) {
        console.error('Contact profile load failed:', { id, contactError, contact })
        throw contactError ?? new Error('Contact not found')
      }

      // ── OPTIONAL: run in parallel, individually fault-tolerant ───────────
      // Promise.allSettled guarantees all four resolve even if one fails.
      // A failed optional query returns null / [] — never crashes the profile.
      const [
        opportunityResult,
        activitiesResult,
        referredByResult,
        referredCandidatesResult,
      ] = await Promise.allSettled([
        // Optional: new contacts have no opportunity yet
        supabase
          .from('opportunities')
          .select('id, workspace_id, contact_id, type_id, status, priority, score, score_label, education, english_level, interview_ready, experience, interest_level, parents_support, family_support, spouse_support, expected_walkin_date, next_followup, notes, current_salary, expected_salary, expected_benefits, created_at, updated_at, created_by')
          .eq('contact_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),

        // Optional — new contacts have no activities yet
        supabase
          .from('contact_activities')
          .select('id, workspace_id, contact_id, type, details, created_at, created_by, activity_date')
          .eq('contact_id', id)
          .order('created_at', { ascending: false }),

        // Optional — most contacts were not referred by someone
        supabase
          .from('referrals')
          .select('*, referrer:referrer_id(name)')
          .eq('candidate_contact_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),

        // Optional — most contacts have not referred anyone yet
        supabase
          .from('referrals')
          .select('*, candidate:candidate_contact_id(name)')
          .eq('referrer_id', id)
          .order('created_at', { ascending: false }),
      ])

      const opportunity = opportunityResult.status === 'fulfilled'
        ? (opportunityResult.value.data ?? undefined)
        : undefined

      const activities = activitiesResult.status === 'fulfilled'
        ? (activitiesResult.value.data ?? [])
        : []

      const referredBy = referredByResult.status === 'fulfilled'
        ? (referredByResult.value.data ?? undefined)
        : undefined

      const referredCandidates = referredCandidatesResult.status === 'fulfilled'
        ? (referredCandidatesResult.value.data ?? [])
        : []

      return {
        ...contact,
        opportunity,
        activities,
        referredBy,
        referredCandidates,
      } as unknown as ContactProfileData
    },
    enabled: !!id,
  })
}
