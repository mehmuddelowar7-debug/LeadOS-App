import { Phone, Clock, AlertTriangle, Calendar } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useAppNavigate } from '@/lib/routes'

interface QueueProps {
  queues: any
}

export function PriorityQueueList({ queues }: QueueProps) {
  const navigate = useAppNavigate()

  const queueItems = [
    {
      id: 'interviews',
      title: 'Interviews Today',
      count: queues.interviews.length,
      icon: Calendar,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
      route: '/pipeline?tab=interviews'
    },
    {
      id: 'recharge',
      title: 'Pending Recharge',
      count: queues.recharge.length,
      icon: AlertTriangle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      route: '/pipeline?tab=recharge'
    },
    {
      id: 'toCall',
      title: 'Follow-ups',
      count: queues.toCall.length,
      icon: Phone,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      route: '/queue'
    },
    {
      id: 'stale',
      title: 'Stale Leads',
      count: queues.stale.length,
      icon: Clock,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      route: '/pipeline?tab=lead'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {queueItems.map(item => (
        <button
          key={item.id}
          onClick={() => navigate(item.route as any)}
          className="text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
          aria-label={`${item.title} queue with ${item.count} items`}
        >
          <Card className="h-full border border-border/50 hover:border-primary/50 hover:shadow-md transition-all">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                <item.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-3xl font-bold text-foreground">
                {item.count}
              </div>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  )
}
