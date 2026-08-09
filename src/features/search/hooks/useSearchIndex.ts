import { useMemo } from 'react'
import type { SearchResult } from '@/engine/search/types'
import { useContacts } from '@/hooks/useContacts'
import { useInterviews } from '@/hooks/useInterviews'
import { useFollowUps } from '@/hooks/useFollowUps'

const STATIC_COMMANDS: SearchResult[] = [
  { id: 'cmd_add_candidate', type: 'action', title: 'Add Candidate', icon: 'UserPlus', route: '/contacts/new', priority: 10 },
  { id: 'cmd_pipeline', type: 'action', title: 'Open Pipeline', icon: 'Columns3', route: '/pipeline', priority: 9 },
  { id: 'cmd_marketing', type: 'action', title: 'Marketing Dashboard', icon: 'Megaphone', route: '/marketing', priority: 8 },
  { id: 'cmd_end_day', type: 'action', title: 'End Day', icon: 'Moon', route: '/dashboard?endDay=true', priority: 7 },
]

export function useSearchIndex() {
  // 1. Fetch cached data
  const { data: contacts = [] } = useContacts()
  const { data: interviews = [] } = useInterviews()
  const { data: followUps = [] } = useFollowUps()

  // 2. Build index
  const index = useMemo(() => {
    const results: SearchResult[] = [...STATIC_COMMANDS]

    // Add Contacts
    contacts.forEach(c => {
      const stage = (c as any).opportunity?.status || 'Lead'
      const keywords = c.labels || []
      if (c.roles) keywords.push(...c.roles)

      results.push({
        id: `contact_${c.id}`,
        type: 'candidate',
        title: c.name,
        subtitle: c.phone || undefined,
        icon: 'User',
        route: `/contacts/${c.id}`,
        keywords: [stage, ...keywords],
        priority: 5
      })
    })

    // Add Interviews
    interviews.forEach(i => {
      const contact = contacts.find(c => c.id === i.contact_id)
      if (contact && i.status === 'scheduled') {
        results.push({
          id: `interview_${i.id}`,
          type: 'interview',
          title: `Interview: ${contact.name}`,
          subtitle: `Scheduled for ${new Date(i.interview_date).toLocaleString()}`,
          icon: 'Calendar',
          route: `/contacts/${contact.id}`,
          priority: 6
        })
      }
    })

    // Add FollowUps
    followUps.forEach(f => {
      const contact = contacts.find(c => c.id === f.contact_id)
      if (contact && f.status !== 'completed') {
        results.push({
          id: `followup_${f.id}`,
          type: 'followup',
          title: `Follow-up: ${contact.name}`,
          subtitle: f.reminder || 'No notes',
          icon: 'Clock',
          route: `/contacts/${contact.id}`,
          priority: 4
        })
      }
    })

    // Dummy Marketing Data (Since backend is not fully integrated yet)
    results.push({ id: 'mktg_src_ig', type: 'source', title: 'Instagram', route: '/marketing/sources/instagram', priority: 3, icon: 'Instagram' })
    results.push({ id: 'mktg_src_fb', type: 'source', title: 'Facebook', route: '/marketing/sources/facebook', priority: 3, icon: 'Facebook' })
    results.push({ id: 'mktg_cmp_aug', type: 'campaign', title: 'August Hiring', subtitle: 'Campaign', route: '/marketing/campaigns/august', priority: 2, icon: 'Megaphone' })

    // Dummy Reports
    results.push({ id: 'rep_morning', type: 'report', title: 'Morning Report', route: '/analytics', priority: 1, icon: 'FileText' })

    return results
  }, [contacts, interviews, followUps])

  return index
}
