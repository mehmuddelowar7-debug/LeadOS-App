import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/features/auth/AuthStore'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'

dayjs.extend(isBetween)

export function useProductivityInsights() {
  const user = useAuthStore(state => state.user)

  return useQuery({
    queryKey: ['productivityInsights', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated')
      const workspaceId = user.user_metadata?.workspace_id

      const now = dayjs()
      const startOfThisWeek = now.startOf('week')
      const endOfThisWeek = now.endOf('week')
      const startOfLastWeek = now.subtract(1, 'week').startOf('week')
      const endOfLastWeek = now.subtract(1, 'week').endOf('week')

      // Fetch all contacts created in the last 2 weeks
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('id, created_at, source')
        .eq('workspace_id', workspaceId)
        .gte('created_at', startOfLastWeek.toISOString())

      // Fetch all interviews in the last 2 weeks
      const { data: interviewsData } = await supabase
        .from('interviews')
        .select('id, status, created_at, interview_date')
        .eq('workspace_id', workspaceId)
        .gte('created_at', startOfLastWeek.toISOString())

      // Fetch opportunities to check stages (recharge, training, activated)
      const { data: opportunitiesData } = await supabase
        .from('opportunities')
        .select('id, status, updated_at')
        .eq('workspace_id', workspaceId)
        .gte('updated_at', startOfLastWeek.toISOString())

      // Fetch activities (calls)
      const { data: callsData } = await supabase
        .from('contact_activities')
        .select('id, activity_type, created_at')
        .eq('workspace_id', workspaceId)
        .eq('activity_type', 'called')
        .gte('created_at', startOfLastWeek.toISOString())

      // Fetch referrals
      const { data: referralsData } = await supabase
        .from('referral_rewards')
        .select('id, reward_amount, status, created_at')
        .eq('workspace_id', workspaceId)
        .gte('created_at', startOfLastWeek.toISOString())

      const contacts = contactsData || []
      const interviews = interviewsData || []
      const opportunities = opportunitiesData || []
      const calls = callsData || []
      const referrals = referralsData || []

      // Helper to partition data by week
      const partitionByWeek = (data: any[], dateField: string = 'created_at') => {
        let thisWeek = 0
        let lastWeek = 0
        data.forEach(item => {
          const d = dayjs(item[dateField])
          if (d.isBetween(startOfThisWeek, endOfThisWeek, null, '[]')) thisWeek++
          else if (d.isBetween(startOfLastWeek, endOfLastWeek, null, '[]')) lastWeek++
        })
        return { thisWeek, lastWeek }
      }

      const leads = partitionByWeek(contacts)
      const callsStats = partitionByWeek(calls)
      const walkins = partitionByWeek(contacts.filter(c => c.source === 'walk_in'))
      
      const interviewsScheduled = partitionByWeek(interviews)
      const interviewsAttended = partitionByWeek(interviews.filter(i => i.status === 'attended'))
      
      const recharges = partitionByWeek(opportunities.filter(o => o.status === 'recharge_completed' || o.status === 'training' || o.status === 'activated'), 'updated_at')
      const trainings = partitionByWeek(opportunities.filter(o => o.status === 'training' || o.status === 'activated'), 'updated_at')
      const activations = partitionByWeek(opportunities.filter(o => o.status === 'activated'), 'updated_at')

      // Referral earnings
      let earningsThisWeek = 0
      let earningsLastWeek = 0
      referrals.forEach(r => {
        if (r.status === 'paid') {
          const d = dayjs(r.created_at)
          if (d.isBetween(startOfThisWeek, endOfThisWeek, null, '[]')) earningsThisWeek += r.reward_amount
          else if (d.isBetween(startOfLastWeek, endOfLastWeek, null, '[]')) earningsLastWeek += r.reward_amount
        }
      })

      return {
        metrics: {
          leads,
          calls: callsStats,
          walkins,
          interviewsScheduled,
          interviewsAttended,
          recharges,
          trainings,
          activations,
          earnings: { thisWeek: earningsThisWeek, lastWeek: earningsLastWeek }
        },
        conversions: {
          leadToInterview: leads.thisWeek ? Math.round((interviewsScheduled.thisWeek / leads.thisWeek) * 100) : 0,
          interviewToTraining: interviewsAttended.thisWeek ? Math.round((trainings.thisWeek / interviewsAttended.thisWeek) * 100) : 0,
          trainingToActivation: trainings.thisWeek ? Math.round((activations.thisWeek / trainings.thisWeek) * 100) : 0,
        }
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!user
  })
}
