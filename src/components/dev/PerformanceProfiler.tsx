import React, { Profiler } from 'react'
import type { ProfilerOnRenderCallback } from 'react'
import { usePerformanceStore } from '@/hooks/usePerformanceStore'

export const IS_PERF_MODE = import.meta.env.DEV || localStorage.getItem('DEBUG_PERFORMANCE') === 'true'

interface Props {
  id: string
  children: React.ReactNode
}

export function PerformanceProfiler({ id, children }: Props) {
  if (!IS_PERF_MODE) return <>{children}</>

  const onRender: ProfilerOnRenderCallback = (
    id,
    phase,
    actualDuration
  ) => {
    // We can't safely use hook inside callback, so we access store directly
    usePerformanceStore.getState().recordSlowComponent(id, actualDuration, phase)
  }

  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  )
}
