/**
 * Recruiter Context Builder
 * RULE: Never import from providers/adapters/.
 */
import dayjs from 'dayjs'
import type { RecruiterContext, RecruiterKnowledge, Diagnostic } from '../schemas/context'

export function buildRecruiterContext(
  interviews: any[],
  followUps:  any[],
): RecruiterContext {
  const t0 = performance.now()
  const diagnostics: Diagnostic[] = []
  const today = dayjs()

  // In v1, workload is a simple heuristic based on today's tasks
  const todayFollowUps = followUps.filter(f => dayjs(f.follow_up_date).isSame(today, 'day') || (dayjs(f.follow_up_date).isBefore(today, 'day') && f.status !== 'completed'))
  const todayInterviews = interviews.filter(i => dayjs(i.interview_date).isSame(today, 'day'))

  // Workload heuristics: 5min per follow-up, 15min per interview
  const callsMinutes = todayFollowUps.length * 5
  const interviewsMinutes = todayInterviews.length * 15
  const estimatedHoursToday = Number(((callsMinutes + interviewsMinutes) / 60).toFixed(1))

  const tasksPending = todayFollowUps.length + todayInterviews.length
  
  // TODO: Add actual completed tasks from an activity log when available in cache
  const tasksCompleted = 0 

  const knowledge: RecruiterKnowledge = {
    workload: {
      estimatedHoursToday,
      tasksCompleted,
      tasksPending,
    },
    todayHighlights: {
      interviewsScheduled: todayInterviews.length,
      followUpsDue:        todayFollowUps.length,
      rechargesDue:        0, // Aggregated from operations mission
    },
    recentActivity: [],
  }

  const durationMs = performance.now() - t0
  return {
    knowledge,
    diagnostics: { domain: 'recruiter', durationMs, processed: tasksPending, diagnostics },
  }
}
