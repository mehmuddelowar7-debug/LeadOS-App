import { useState } from 'react'
import { Bot, ChevronRight } from 'lucide-react'
import { useAutomationEngine } from '@/engine/automation/useAutomationEngine'
import { AutomationReviewModal } from './AutomationReviewModal'

export function AutomationHubWidget() {
  const { automations, isLoading } = useAutomationEngine()
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (isLoading) return null

  const pendingCount = automations.length

  if (pendingCount === 0) return null

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="group relative flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-xl hover:bg-primary/15 transition-all text-left w-full overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-primary">Automation Assistant</h4>
          <p className="text-xs text-primary/80 mt-0.5">
            {pendingCount} suggested {pendingCount === 1 ? 'action' : 'actions'} available
          </p>
        </div>

        <ChevronRight className="h-5 w-5 text-primary/50 group-hover:text-primary transition-colors" />
      </button>

      <AutomationReviewModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  )
}
