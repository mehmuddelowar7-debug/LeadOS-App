import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useAutomationEngine } from '@/engine/automation/useAutomationEngine'
import { Bot, Check, X, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface AutomationReviewModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AutomationReviewModal({ isOpen, onClose }: AutomationReviewModalProps) {
  const { automations, executeAutomation, dismissAutomation } = useAutomationEngine()

  const handleExecute = async (task: any) => {
    await executeAutomation(task)
    toast.success(`Executed: ${task.recommendedActionText}`)
    if (automations.length === 1) onClose()
  }

  const handleDismiss = (taskId: string) => {
    dismissAutomation(taskId)
    if (automations.length === 1) onClose()
  }

  const handleExecuteAll = async () => {
    for (const task of automations) {
      await executeAutomation(task)
    }
    toast.success(`Executed ${automations.length} actions`)
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md bg-background/95 backdrop-blur-md border-l shadow-2xl p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              Automation Assistant
            </SheetTitle>
            {automations.length > 1 && (
              <Button onClick={handleExecuteAll} variant="default" size="sm">
                Execute All ({automations.length})
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Review and approve suggested actions based on your current pipeline state.
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {automations.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Check className="h-12 w-12 mx-auto mb-4 text-primary/50" />
              <p>You're all caught up!</p>
              <p className="text-sm">No pending automations at this time.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {automations.map(task => (
                <div key={task.id} className="p-6 flex flex-col sm:flex-row sm:items-start gap-4 hover:bg-muted/30 transition-colors">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        task.priority === 'P0' ? 'bg-red-500/10 text-red-500' :
                        task.priority === 'P1' ? 'bg-orange-500/10 text-orange-500' :
                        task.priority === 'P2' ? 'bg-yellow-500/10 text-yellow-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {task.type}
                      </span>
                      <h4 className="font-semibold text-foreground">{task.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {task.description}
                    </p>
                    {task.payload?.message && (
                      <div className="mt-2 text-xs bg-muted/50 p-2 rounded-md font-mono text-muted-foreground border">
                        "{task.payload.message}"
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:self-center shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDismiss(task.id)}
                      className="text-muted-foreground hover:text-destructive"
                      title="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="default" 
                      onClick={() => handleExecute(task)}
                      className="gap-2"
                    >
                      {task.recommendedActionText}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
