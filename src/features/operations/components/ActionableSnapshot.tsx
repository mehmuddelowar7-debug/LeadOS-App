import { Zap, AlertCircle, Phone, CheckCircle2, DollarSign } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppNavigate } from '@/lib/routes'

interface ActionableSnapshotProps {
  mission: any
}

export function ActionableSnapshot({ mission }: ActionableSnapshotProps) {
  const navigate = useAppNavigate()
  
  if (!mission) return null

  // Map mission action types to colors and icons
  const configs: Record<string, { color: string; icon: any; gradient: string }> = {
    EMERGENCY_RECHARGE: { 
      color: 'text-red-500', 
      icon: DollarSign,
      gradient: 'from-red-500/20 to-red-500/5 border-red-500/20'
    },
    CRITICAL_FOLLOWUP: { 
      color: 'text-orange-500', 
      icon: AlertCircle,
      gradient: 'from-orange-500/20 to-orange-500/5 border-orange-500/20'
    },
    FOLLOWUPS: { 
      color: 'text-yellow-500', 
      icon: Phone,
      gradient: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/20'
    },
    CLEAR: { 
      color: 'text-green-500', 
      icon: CheckCircle2,
      gradient: 'from-green-500/20 to-green-500/5 border-green-500/20'
    }
  }

  const config = configs[mission.action] || configs.CLEAR
  const Icon = config.icon

  return (
    <Card className={`border-2 overflow-hidden bg-gradient-to-br ${config.gradient}`}>
      <CardContent className="p-8 md:p-12 flex flex-col items-center text-center space-y-6">
        <div className={`h-20 w-20 rounded-full bg-background/50 flex items-center justify-center shadow-sm ${config.color}`}>
          <Icon className="h-10 w-10" />
        </div>
        
        <div className="space-y-2 max-w-lg mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            {mission.title}
          </h2>
          <p className="text-lg text-muted-foreground">
            {mission.description}
          </p>
        </div>

        {mission.action !== 'CLEAR' && (
          <Button 
            size="lg" 
            className="rounded-full h-14 px-8 text-lg font-semibold shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
            onClick={() => {
              if (mission.action === 'EMERGENCY_RECHARGE') {
                navigate('/pipeline?tab=recharge')
              } else {
                navigate('/queue') // Assuming a queue view exists or fallback
              }
            }}
          >
            Execute Mission
            <Zap className="ml-2 h-5 w-5" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
