import { AlertCircle, TrendingUp, Info } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useAppNavigate } from '@/lib/routes'

interface MarketingInboxProps {
  recommendations: any[]
}

export function MarketingInbox({ recommendations }: MarketingInboxProps) {
  const navigate = useAppNavigate()

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return 'text-red-500 bg-red-500/10'
    if (priority === 'medium') return 'text-yellow-500 bg-yellow-500/10'
    return 'text-blue-500 bg-blue-500/10'
  }

  const getPriorityIcon = (priority: string) => {
    if (priority === 'high') return AlertCircle
    if (priority === 'medium') return TrendingUp
    return Info
  }

  return (
    <Card className="h-full">
      <CardHeader className="p-4 border-b">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          Marketing Inbox
          {recommendations.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
              {recommendations.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 max-h-[300px] overflow-y-auto">
        {recommendations.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No marketing alerts at this time.
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {recommendations.map(rec => {
              const Icon = getPriorityIcon(rec.priority)
              return (
                <div key={rec.id} className="p-4 flex gap-4 hover:bg-muted/50 transition-colors">
                  <div className={`mt-0.5 shrink-0 p-2 rounded-full h-8 w-8 flex items-center justify-center ${getPriorityColor(rec.priority)}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground">{rec.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                    {rec.actionText && (
                      <button 
                        onClick={() => navigate('/marketing')}
                        className="text-xs font-semibold text-primary mt-2 hover:underline"
                      >
                        {rec.actionText} &rarr;
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
