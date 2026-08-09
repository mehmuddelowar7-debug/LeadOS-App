import { supabase } from './supabase'
import dayjs from 'dayjs'

export interface DailyReportData {
  date: string
  leadsCollected: number
  walkIn: number
  expectedWalkIn: number
  expectedWalkInDateStr?: string
  expectedWalkInNames: string[]
  rejected: number
  rejectionReasons: Record<string, number>
  screeningDone: number
  rechargeDone: number
  trainingStarted: number
  activation: number
  calls: number
  interviewsScheduled: number
  interviewsAttended: number
  referralCommission: number
}

export async function generateDailyFieldReportData(userId: string, workspaceId: string): Promise<DailyReportData> {
  const startOfDay = dayjs().startOf('day').toISOString()
  const endOfDay = dayjs().endOf('day').toISOString()
  const tomorrowStart = dayjs().add(1, 'day').startOf('day').toISOString()

  let data: DailyReportData = {
    date: dayjs().format('DD/MM/YYYY'),
    leadsCollected: 0,
    walkIn: 0,
    expectedWalkIn: 0,
    expectedWalkInNames: [],
    rejected: 0,
    rejectionReasons: {},
    screeningDone: 0,
    rechargeDone: 0,
    trainingStarted: 0,
    activation: 0,
    calls: 0,
    interviewsScheduled: 0,
    interviewsAttended: 0,
    referralCommission: 0
  }

  if (!navigator.onLine) {
    // Return empty state when offline, user can manually adjust counts if needed
    return data
  }

  try {
    // 1. Leads Collected
    const { count: leadsCount } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('created_by', userId)
      .gte('entry_date', startOfDay)
      .lte('entry_date', endOfDay)

    data.leadsCollected = leadsCount || 0

    // 2. Activities (Walk-in, Screening, Recharge, Training, Activation)
    const { data: activities } = await supabase
      .from('contact_activities')
      .select('activity_type')
      .eq('workspace_id', workspaceId)
      .gte('activity_date', startOfDay)
      .lte('activity_date', endOfDay)

    if (activities) {
      data.walkIn = activities.filter(a => a.activity_type === 'visited').length
      data.screeningDone = activities.filter(a => a.activity_type === 'registered').length
      data.rechargeDone = activities.filter(a => a.activity_type === 'recharged').length
      data.trainingStarted = activities.filter(a => a.activity_type === 'training_started').length
      data.activation = activities.filter(a => a.activity_type === 'activated').length
      data.calls = activities.filter(a => a.activity_type === 'called').length
    }

    // 2.5 Interviews
    const { data: interviews } = await supabase
      .from('interviews')
      .select('status, created_at, interview_date')
      .eq('workspace_id', workspaceId)
      
    if (interviews) {
      data.interviewsScheduled = interviews.filter(i => new Date(i.created_at) >= new Date(startOfDay) && new Date(i.created_at) <= new Date(endOfDay)).length
      data.interviewsAttended = interviews.filter(i => i.status === 'attended' && i.interview_date === dayjs().format('YYYY-MM-DD')).length
    }

    // 2.6 Referral Commission
    const { data: referrals } = await supabase
      .from('referrals')
      .select('commission_amount')
      .eq('workspace_id', workspaceId)
      .eq('status', 'paid')
      .gte('paid_date', startOfDay)
      .lte('paid_date', endOfDay)
      
    if (referrals) {
      data.referralCommission = referrals.reduce((sum, r) => sum + (r.commission_amount || 0), 0)
    }

    // 3. Expected Walk-ins (Follow-ups in the future)
    const { data: futureFollowUps } = await supabase
      .from('follow_ups')
      .select('follow_up_date, contact_id, contacts(name)')
      .eq('workspace_id', workspaceId)
      .eq('status', 'pending')
      .gte('follow_up_date', dayjs(tomorrowStart).format('YYYY-MM-DD'))

    if (futureFollowUps && futureFollowUps.length > 0) {
      data.expectedWalkIn = futureFollowUps.length
      
      const names: string[] = []
      futureFollowUps.forEach((f: any) => {
        if (f.contacts?.name) {
          names.push(f.contacts.name.split(' ')[0])
        }
      })
      data.expectedWalkInNames = names

      // Find the closest future date for the string
      const sorted = [...futureFollowUps].sort((a, b) => new Date(a.follow_up_date!).getTime() - new Date(b.follow_up_date!).getTime())
      if (sorted[0]?.follow_up_date) {
        data.expectedWalkInDateStr = dayjs(sorted[0].follow_up_date).format('DD MMM')
      }
    }

    // 4. Rejected & Reasons
    const { data: rejectedOpps } = await supabase
      .from('opportunities')
      .select('objections')
      .eq('workspace_id', workspaceId)
      .eq('status', 'lost')
      .gte('updated_at', startOfDay)
      .lte('updated_at', endOfDay)

    if (rejectedOpps) {
      data.rejected = rejectedOpps.length
      
      const reasons: Record<string, number> = {}
      rejectedOpps.forEach(opp => {
        if (opp.objections && Array.isArray(opp.objections) && opp.objections.length > 0) {
          opp.objections.forEach(obj => {
            reasons[obj] = (reasons[obj] || 0) + 1
          })
        } else {
          reasons['Not Interested'] = (reasons['Not Interested'] || 0) + 1
        }
      })
      data.rejectionReasons = reasons
    }

  } catch (err) {
    console.error('Failed to generate daily report data:', err)
  }

  return data
}
