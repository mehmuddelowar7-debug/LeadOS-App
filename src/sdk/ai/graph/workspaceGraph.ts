/**
 * Workspace Graph Module
 * Resolves workspace-level aggregates.
 * Pure functions — no side effects.
 */
import dayjs from 'dayjs'

export interface WorkspaceGraphIndexes {
  joinedThisMonth: number
  joinedThisWeek:  number
  activeStageCounts: Map<string, number>
}

export function buildWorkspaceGraphIndexes(candidates: any[]): WorkspaceGraphIndexes {
  const today = dayjs()
  let joinedThisMonth = 0
  let joinedThisWeek = 0
  const activeStageCounts = new Map<string, number>()

  for (const c of candidates) {
    const stage = c.stage as string
    activeStageCounts.set(stage, (activeStageCounts.get(stage) ?? 0) + 1)

    if (stage === 'activated' || stage === 'completed') {
      const updatedAt = c.stageUpdatedAt
      if (updatedAt) {
        const d = dayjs(updatedAt)
        if (today.diff(d, 'day') <= 30) joinedThisMonth++
        if (today.diff(d, 'day') <= 7)  joinedThisWeek++
      }
    }
  }

  return { joinedThisMonth, joinedThisWeek, activeStageCounts }
}
