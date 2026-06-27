import { useEffect, useRef } from 'react'
import { usePerformanceStore } from './usePerformanceStore'
import { IS_PERF_MODE } from '@/components/dev/PerformanceProfiler'

export function useRenderProfiler(componentName: string, props: Record<string, any>, stateDeps: Record<string, any> = {}) {
  const previousProps = useRef<Record<string, any>>({})
  const previousState = useRef<Record<string, any>>({})
  
  useEffect(() => {
    if (!IS_PERF_MODE) return

    const changedProps: string[] = []
    const changedState: string[] = []

    // Check props
    Object.keys({ ...previousProps.current, ...props }).forEach(key => {
      if (previousProps.current[key] !== props[key]) {
        changedProps.push(`${key}: ${typeof props[key] === 'function' ? 'fn' : String(props[key]).substring(0, 20)}`)
      }
    })

    // Check state/context
    Object.keys({ ...previousState.current, ...stateDeps }).forEach(key => {
      if (previousState.current[key] !== stateDeps[key]) {
        changedState.push(`${key}: ${typeof stateDeps[key] === 'function' ? 'fn' : String(stateDeps[key]).substring(0, 20)}`)
      }
    })

    if (changedProps.length > 0 || changedState.length > 0) {
      let reason = ''
      if (changedProps.length > 0) reason += `Props[${changedProps.join(', ')}] `
      if (changedState.length > 0) reason += `State[${changedState.join(', ')}]`
      usePerformanceStore.getState().recordRenderReason(componentName, reason.trim())
    }

    previousProps.current = { ...props }
    previousState.current = { ...stateDeps }
  })
}
