import { AlertTriangle, Star, Activity, AlertCircle } from 'lucide-react'

// Dummy data until we wire up the real rules
const alerts = [
  { id: 1, type: 'warning', message: 'Facebook CPL increased 42%', icon: AlertTriangle, color: 'text-orange-500' },
  { id: 2, type: 'success', message: 'Commercial Street campaign is outperforming all others', icon: Star, color: 'text-amber-500' },
  { id: 3, type: 'error', message: '11 candidates have no attribution', icon: AlertCircle, color: 'text-red-500' },
  { id: 4, type: 'success', message: 'Instagram Reel #28 generated 4 joins', icon: Star, color: 'text-amber-500' },
  { id: 5, type: 'error', message: 'Meta import failed yesterday', icon: Activity, color: 'text-red-500' },
]

export function MarketingInbox() {
  return (
    <div className="glass-card rounded-2xl border border-border/50 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground">Marketing Inbox</h3>
        <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-md">
          {alerts.length} New
        </span>
      </div>
      
      <div className="space-y-3">
        {alerts.map(alert => (
          <div key={alert.id} className="flex items-start gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
            <alert.icon className={`h-4 w-4 mt-0.5 ${alert.color}`} />
            <p className="text-sm font-medium text-foreground">{alert.message}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
