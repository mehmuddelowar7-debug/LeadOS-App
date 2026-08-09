
import { LayoutTemplate, PlayCircle } from 'lucide-react'
import { JourneyTimeline } from '@/features/shared/components/JourneyTimeline'
import type { CandidateJourney } from '@/features/shared/components/JourneyTimeline'

// Dummy data for scaffolding Phase 4 & 5
const dummyCreative = { 
  id: '201', 
  name: 'Kitchen Reel V3', 
  type: 'video', 
  spend: 1200, 
  reach: 24000,
  leads: 18, 
  joined: 5, 
  ctr: '2.4%', 
  cpj: 240, 
  trend: 'up' 
}

const dummyCandidates: CandidateJourney[] = [
  {
    contactId: 'c1',
    name: 'Priya Sharma',
    touchpoints: [
      { id: 't1', event_type: 'reel_viewed', timestamp: '2026-08-01T10:32:00Z' },
      { id: 't2', event_type: 'dm_sent', timestamp: '2026-08-01T11:05:00Z' },
      { id: 't3', event_type: 'phone_called', timestamp: '2026-08-01T14:20:00Z' },
      { id: 't4', event_type: 'interview', timestamp: '2026-08-02T10:00:00Z' },
      { id: 't5', event_type: 'joined', timestamp: '2026-08-03T16:00:00Z' },
    ]
  },
  {
    contactId: 'c2',
    name: 'Nisha Gupta',
    touchpoints: [
      { id: 't6', event_type: 'reel_viewed', timestamp: '2026-08-02T09:15:00Z' },
      { id: 't7', event_type: 'lost', timestamp: '2026-08-05T09:15:00Z' },
    ]
  }
]

export function MarketingCreativeView() {
  // In reality: 
  // const { id } = useParams()
  // const { data: touchpoints } = useCandidateJourney(id)
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      
      {/* Creative Header & Performance Summary */}
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Thumbnail Placeholder */}
        <div className="h-32 w-32 shrink-0 bg-muted/50 rounded-xl border border-border/50 flex flex-col items-center justify-center text-muted-foreground relative overflow-hidden group">
          {dummyCreative.type === 'video' ? <PlayCircle className="h-10 w-10 opacity-50 group-hover:opacity-100 transition-opacity" /> : <LayoutTemplate className="h-10 w-10 opacity-50" />}
        </div>
        
        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {dummyCreative.name}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {dummyCreative.type}
              </span>
              <p className="text-sm text-muted-foreground">Asset Performance</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mt-4 sm:mt-0">
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Spend</div>
              <div className="font-bold text-sm mt-1">₹{dummyCreative.spend}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Reach</div>
              <div className="font-bold text-sm mt-1">{(dummyCreative.reach / 1000).toFixed(1)}K</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">CTR</div>
              <div className="font-bold text-sm mt-1">{dummyCreative.ctr}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Leads</div>
              <div className="font-bold text-sm mt-1">{dummyCreative.leads}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Joined</div>
              <div className="font-bold text-sm mt-1 text-green-500">{dummyCreative.joined}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">CPJ</div>
              <div className="font-bold text-sm mt-1">₹{dummyCreative.cpj}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border/50 pt-8 mt-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-foreground">Candidate Journey</h3>
          <span className="text-sm font-medium text-muted-foreground bg-muted/30 px-3 py-1 rounded-md">
            {dummyCandidates.length} Candidates tracked
          </span>
        </div>
        
        {/* Signature Journey Timeline */}
        <JourneyTimeline candidates={dummyCandidates} />
      </div>
      
    </div>
  )
}
