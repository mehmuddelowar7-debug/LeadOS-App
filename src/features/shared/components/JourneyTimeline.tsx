import { Play, MessageCircle, Phone, Calendar, CheckCircle, XCircle } from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export interface JourneyTouchpoint {
  id: string
  event_type: 'lead_created' | 'reel_viewed' | 'story_viewed' | 'ad_clicked' | 'dm_sent' | 'phone_called' | 'followup' | 'interview' | 'selected' | 'recharge' | 'joined' | 'lost'
  timestamp: string
}

export interface CandidateJourney {
  contactId: string
  name: string
  touchpoints: JourneyTouchpoint[]
}

const getEventConfig = (type: string) => {
  switch (type) {
    case 'reel_viewed':
    case 'story_viewed':
    case 'ad_clicked':
      return { icon: Play, color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10', label: type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }
    case 'dm_sent':
    case 'followup':
      return { icon: MessageCircle, color: 'text-blue-500', bg: 'bg-blue-500/10', label: type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }
    case 'phone_called':
    case 'lead_created':
      return { icon: Phone, color: 'text-indigo-500', bg: 'bg-indigo-500/10', label: type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }
    case 'interview':
    case 'selected':
    case 'recharge':
      return { icon: Calendar, color: 'text-violet-500', bg: 'bg-violet-500/10', label: type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }
    case 'joined':
      return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Joined' }
    case 'lost':
      return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Lost' }
    default:
      return { icon: CheckCircle, color: 'text-muted-foreground', bg: 'bg-muted', label: type }
  }
}

export function JourneyTimeline({ candidates }: { candidates: CandidateJourney[] }) {
  if (candidates.length === 0) {
    return (
      <div className="py-12 text-center border border-dashed border-border/50 rounded-2xl">
        <h3 className="text-base font-semibold text-foreground">No candidate journeys found.</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Candidates will appear here once they interact with this asset.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {candidates.map((candidate) => (
        <div key={candidate.contactId} className="glass-card rounded-xl border border-border/50 p-6">
          <h3 className="font-bold text-lg text-foreground mb-6">{candidate.name}</h3>
          
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border/50 before:to-transparent">
            {candidate.touchpoints.map((tp) => {
              const config = getEventConfig(tp.event_type)
              const Icon = config.icon
              
              return (
                <div key={tp.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  
                  {/* Icon */}
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${config.bg}`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  
                  {/* Content Card */}
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm transition-colors hover:border-primary/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold text-sm ${config.color}`}>{config.label}</span>
                      <time className="text-xs font-medium text-muted-foreground">{dayjs(tp.timestamp).format('h:mm A')}</time>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {dayjs(tp.timestamp).format('MMM D, YYYY')}
                    </div>
                  </div>
                  
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
