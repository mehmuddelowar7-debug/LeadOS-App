import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useCandidateIntelligence } from '@/hooks/useCandidateIntelligence'
import { generateCandidateAutomations } from './automationRules'
import type { AutomationTask } from './types'

export function useAutomationEngine() {
  const { candidates, isLoading } = useCandidateIntelligence()
  
  // Simulated completed automations cache so we don't suggest the same thing twice in a session
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set())

  const today = useMemo(() => dayjs(), []) // Evaluate on mount

  const automations = useMemo(() => {
    if (isLoading) return []
    const allAutomations = generateCandidateAutomations(candidates, today)
    return allAutomations.filter(task => !completedTaskIds.has(task.id))
  }, [candidates, today, isLoading, completedTaskIds])

  const executeAutomation = async (task: AutomationTask) => {
    // Simulated Execution. In a real scenario, this would call Supabase RPCs or API endpoints.
    // For now, we simulate execution by removing it from the queue.
    console.log('Executing automation:', task)
    setCompletedTaskIds(prev => {
      const next = new Set(prev)
      next.add(task.id)
      return next
    })
  }

  const dismissAutomation = (taskId: string) => {
    setCompletedTaskIds(prev => {
      const next = new Set(prev)
      next.add(taskId)
      return next
    })
  }

  return {
    automations,
    isLoading,
    executeAutomation,
    dismissAutomation
  }
}
