import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react'

export function MarketingHealth() {
  return (
    <div className="glass-card rounded-2xl border border-border/50 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground">Marketing Health</h3>
        <span className="text-2xl font-black text-green-500">97%</span>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span>96% candidates attributed</span>
        </div>
        <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
          <Clock className="h-4 w-4 text-blue-500" />
          <span>Last sync 1 hour ago</span>
        </div>
        <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <span>3 candidates missing source</span>
        </div>
        <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <span>1 campaign inactive</span>
        </div>
      </div>
    </div>
  )
}
