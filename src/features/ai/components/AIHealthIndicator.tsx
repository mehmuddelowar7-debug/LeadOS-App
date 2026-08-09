import React from 'react'
import type { ContextSnapshot } from '../../../sdk/ai/schemas/context'
import { Activity, Database, CheckCircle2 } from 'lucide-react'

interface AIHealthIndicatorProps {
  snapshot: ContextSnapshot
  providerName?: string
}

export const AIHealthIndicator: React.FC<AIHealthIndicatorProps> = ({ 
  snapshot, 
  providerName = import.meta.env.VITE_MOCK_AI === 'true' || import.meta.env.DEV ? 'Mock' : 'Supabase Edge' 
}) => {
  const { _metadata } = snapshot.context

  return (
    <div className="flex flex-col gap-2 p-3 bg-[var(--surface-sunken)] border-b border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-emerald-500 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>AI Ready</span>
        </div>
        <div className="flex items-center gap-1.5 text-[var(--text-tertiary)]">
          <Database className="w-3.5 h-3.5" />
          <span>Rev: {_metadata.cacheRevision.slice(0, 8)}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-[var(--text-tertiary)]">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          <span>Snapshot: {_metadata.buildDurationMs.toFixed(1)}ms</span>
        </div>
        <div>Provider: {providerName}</div>
      </div>
    </div>
  )
}
