import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/features/auth/AuthStore'
import dayjs from 'dayjs'

export type DataQualityIssue = {
  id: string
  title: string
  description: string
  type: 'no_followup' | 'stuck' | 'unresolved_interview' | 'missing_commission' | 'duplicate'
  contactId: string
  actionUrl: string
}

export function useDataQuality() {
  const user = useAuthStore(state => state.user)

  return useQuery({
    queryKey: ['dataQuality', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated')
      const workspaceId = user.user_metadata?.workspace_id
      const issues: DataQualityIssue[] = []

      // 1. Unresolved Interviews (scheduled but in the past)
      const { data: unresolvedInterviews } = await supabase
        .from('interviews')
        .select('id, contact_id, interview_date, contacts(name)')
        .eq('workspace_id', workspaceId)
        .eq('status', 'scheduled')
        .lt('interview_date', dayjs().startOf('day').toISOString())

      if (unresolvedInterviews) {
        unresolvedInterviews.forEach((i: any) => {
          issues.push({
            id: `interview_${i.id}`,
            title: 'Unresolved Interview',
            description: `${i.contacts?.name || 'Contact'} missed their interview or it needs updating.`,
            type: 'unresolved_interview',
            contactId: i.contact_id,
            actionUrl: `/contacts/${i.contact_id}`
          })
        })
      }

      // 2. Stuck Candidates (updated_at > 7 days ago and not completed/lost)
      const sevenDaysAgo = dayjs().subtract(7, 'days').toISOString()
      const { data: stuckOpps } = await supabase
        .from('opportunities')
        .select('id, contact_id, status, contacts(name)')
        .eq('workspace_id', workspaceId)
        .lt('updated_at', sevenDaysAgo)
        .not('status', 'in', '("completed","lost","activated")')

      if (stuckOpps) {
        stuckOpps.forEach((o: any) => {
          issues.push({
            id: `stuck_${o.id}`,
            title: 'Stuck Candidate',
            description: `${o.contacts?.name || 'Contact'} has been in "${o.status.replace('_', ' ')}" for over 7 days.`,
            type: 'stuck',
            contactId: o.contact_id,
            actionUrl: `/contacts/${o.contact_id}`
          })
        })
      }

      // 3. Missing Commissions
      const { data: missingCommissions } = await supabase
        .from('referral_rewards')
        .select('id, candidate_id, contacts!referral_rewards_candidate_id_fkey(name)')
        .eq('workspace_id', workspaceId)
        .eq('status', 'pending')
        // if they have been pending for a long time or missing data
        .lt('created_at', dayjs().subtract(2, 'days').toISOString())

      if (missingCommissions) {
        missingCommissions.forEach((c: any) => {
          issues.push({
            id: `commission_${c.id}`,
            title: 'Pending Commission',
            description: `Referral commission for ${c.contacts?.name || 'Candidate'} needs approval.`,
            type: 'missing_commission',
            contactId: c.candidate_id,
            actionUrl: `/referrals`
          })
        })
      }

      // 4. No Follow-ups (active opportunities with no next_followup)
      const { data: noFollowUps } = await supabase
        .from('opportunities')
        .select('id, contact_id, contacts(name)')
        .eq('workspace_id', workspaceId)
        .is('next_followup', null)
        .not('status', 'in', '("completed","lost","activated")')
        .limit(10) // Limit to avoid swamping UI

      if (noFollowUps) {
        noFollowUps.forEach((o: any) => {
          issues.push({
            id: `nofollow_${o.id}`,
            title: 'No Follow-up Scheduled',
            description: `${o.contacts?.name || 'Contact'} has no future follow-up.`,
            type: 'no_followup',
            contactId: o.contact_id,
            actionUrl: `/contacts/${o.contact_id}`
          })
        })
      }

      // 5. Duplicates
      // A full DB group-by might be slow, so we can do a lightweight check on recent contacts
      const { data: recentContacts } = await supabase
        .from('contacts')
        .select('id, name, phone, whatsapp')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (recentContacts) {
        const phoneMap = new Map<string, any[]>()
        recentContacts.forEach(c => {
          if (c.phone) {
            const arr = phoneMap.get(c.phone) || []
            arr.push(c)
            phoneMap.set(c.phone, arr)
          }
        })
        
        phoneMap.forEach((duplicates, phone) => {
          if (duplicates.length > 1) {
            issues.push({
              id: `dup_${phone}`,
              title: 'Potential Duplicate',
              description: `Found ${duplicates.length} contacts using ${phone}.`,
              type: 'duplicate',
              contactId: duplicates[0].id,
              actionUrl: `/contacts/${duplicates[0].id}`
            })
          }
        })
      }

      return issues
    },
    staleTime: 1000 * 60 * 5, // 5 mins
    enabled: !!user
  })
}
