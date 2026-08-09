import { ArrowRight } from 'lucide-react'
import { PIPELINE_STAGES } from '../config/pipelineConfig'
import type { PipelineData } from '../hooks/usePipeline'
import { PIPELINE_THEME } from '../config/pipelineTheme'
import { cn } from '@/lib/utils'

interface PipelineSummaryProps {
  counts: PipelineData['counts']
}

export function PipelineSummary({ counts }: PipelineSummaryProps) {
  return (
    <div className="flex items-center gap-1 md:gap-3 overflow-x-auto scrollbar-hide py-2 px-1">
      {PIPELINE_STAGES.map((stage, index) => {
        const count = counts[stage.id]
        const theme = PIPELINE_THEME[stage.id] || PIPELINE_THEME.new
        
        return (
          <div key={stage.id} className="flex items-center shrink-0">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors",
              theme.bg, theme.border, theme.text
            )}>
              <span>{stage.label}</span>
              <span className="font-bold bg-background/50 px-1.5 py-0.5 rounded text-xs">{count}</span>
            </div>
            {index < PIPELINE_STAGES.length - 1 && (
              <ArrowRight className="h-4 w-4 mx-2 md:mx-3 text-muted-foreground/30 shrink-0" />
            )}
          </div>
        )
      })}
    </div>
  )
}
