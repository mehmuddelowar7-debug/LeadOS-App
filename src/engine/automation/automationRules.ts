import type { CandidateData } from '../intelligence/rules/candidateRules'
import type { AutomationTask } from './types'
import dayjs from 'dayjs'

export function generateCandidateAutomations(candidates: CandidateData[], today: dayjs.Dayjs): AutomationTask[] {
  const tasks: AutomationTask[] = []

  candidates.forEach(c => {
    // 1. Missing SLA (Escalation)
    if (c.stage === 'recharge_pending') {
      const daysInRecharge = c.stageUpdatedAt ? today.diff(dayjs(c.stageUpdatedAt), 'day') : 0
      if (daysInRecharge >= 2) {
        tasks.push({
          id: `esc-recharge-${c.id}`,
          title: `SLA Breach: ${c.name}`,
          description: `Recharge pending for ${daysInRecharge} days. Immediate follow-up required.`,
          priority: 'P0',
          type: 'Escalation',
          targetId: c.id,
          recommendedActionText: 'Collect Recharge Now'
        })
      }
    }

    // 2. Interview Reminders (Suggested)
    if (c.interviewDate && dayjs(c.interviewDate).isSame(today.add(1, 'day'), 'day') && c.interviewStatus === 'scheduled') {
      tasks.push({
        id: `sug-int-${c.id}`,
        title: `Send Interview Reminder: ${c.name}`,
        description: 'Interview is scheduled for tomorrow. Send a WhatsApp reminder to reduce no-show risk.',
        priority: 'P1',
        type: 'Suggested',
        targetId: c.id,
        recommendedActionText: 'Send WhatsApp Reminder',
        payload: { message: `Hi ${c.name}, reminder for your interview tomorrow.` }
      })
    }

    // 3. Stale Lead Archiving (Silent / Suggested)
    // For now we'll surface it as a suggested bulk action so the recruiter doesn't lose control.
    const daysSinceActivity = c.lastActivityAt ? today.diff(dayjs(c.lastActivityAt), 'day') : 0
    if (c.stage === 'lead' && daysSinceActivity > 14) {
      tasks.push({
        id: `sug-stale-${c.id}`,
        title: `Archive Stale Lead: ${c.name}`,
        description: `No activity for ${daysSinceActivity} days.`,
        priority: 'P3',
        type: 'Suggested',
        targetId: c.id,
        recommendedActionText: 'Archive Lead'
      })
    }
  })

  return tasks.sort((a, b) => {
    const pScore = { 'P0': 4, 'P1': 3, 'P2': 2, 'P3': 1 }
    return pScore[b.priority] - pScore[a.priority]
  })
}
