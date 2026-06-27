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
    activation: 0
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
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)

    data.leadsCollected = leadsCount || 0

    // 2. Activities (Walk-in, Screening, Recharge, Training, Activation)
    const { data: activities } = await supabase
      .from('contact_activities')
      .select('activity_type')
      .eq('workspace_id', workspaceId)
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)

    if (activities) {
      data.walkIn = activities.filter(a => a.activity_type === 'visited').length
      data.screeningDone = activities.filter(a => a.activity_type === 'registered').length
      data.rechargeDone = activities.filter(a => a.activity_type === 'recharged').length
      data.trainingStarted = activities.filter(a => a.activity_type === 'training_started').length
      data.activation = activities.filter(a => a.activity_type === 'activated').length
    }

    // 3. Expected Walk-ins (Follow-ups in the future)
    const { data: futureOpps } = await supabase
      .from('opportunities')
      .select('next_followup, contact_id, contacts(name)')
      .eq('workspace_id', workspaceId)
      .gte('next_followup', tomorrowStart)

    if (futureOpps && futureOpps.length > 0) {
      data.expectedWalkIn = futureOpps.length
      
      const names: string[] = []
      futureOpps.forEach((opp: any) => {
        if (opp.contacts?.name) {
          names.push(opp.contacts.name.split(' ')[0])
        }
      })
      data.expectedWalkInNames = names

      // Find the closest future date for the string
      const sorted = [...futureOpps].sort((a, b) => new Date(a.next_followup!).getTime() - new Date(b.next_followup!).getTime())
      if (sorted[0]?.next_followup) {
        data.expectedWalkInDateStr = dayjs(sorted[0].next_followup).format('DD MMM')
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
