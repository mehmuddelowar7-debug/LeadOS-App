import { useParams, Link } from 'react-router'
import { Megaphone, ArrowUpRight, ArrowDownRight, LayoutTemplate } from 'lucide-react'

// Dummy data for scaffolding Phase 3
const dummyCampaign = { id: '101', name: 'August Hiring', status: 'active', spend: 2000, cpj: 400, leads: 24, joined: 5 }

const dummyCreatives = [
  { id: '201', name: 'Kitchen Reel V3', type: 'video', spend: 1200, leads: 18, joined: 5, ctr: '2.4%', cpj: 240, trend: 'up' },
  { id: '202', name: 'Before/After Poster', type: 'image', spend: 800, leads: 6, joined: 0, ctr: '0.8%', cpj: 0, trend: 'down' },
]

export function MarketingCampaignView() {
  const {} = useParams()
  
  // In reality: 
  // const { data: creatives } = useMarketingCreatives(id)
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      
      {/* Campaign KPIs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            {dummyCampaign.name}
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
              dummyCampaign.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'
            }`}>
              {dummyCampaign.status}
            </span>
            <p className="text-sm text-muted-foreground">Campaign Breakdown</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-background border border-border/50 rounded-xl px-4 py-2 text-center">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Spend</div>
            <div className="text-lg font-black text-foreground">₹{dummyCampaign.spend}</div>
          </div>
          <div className="bg-background border border-border/50 rounded-xl px-4 py-2 text-center">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Cost / Joined</div>
            <div className="text-lg font-black text-primary">₹{dummyCampaign.cpj}</div>
          </div>
        </div>
      </div>

      {/* Creatives List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-foreground">Creatives & Ad Sets</h3>
          {/* Placeholder for future filtering/sorting/search */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input 
              type="text" 
              placeholder="Search creatives..." 
              className="bg-muted/30 border border-border/50 text-sm px-3 py-1.5 rounded-md flex-1 sm:w-48 text-foreground"
              disabled
            />
            <div className="text-sm font-medium text-muted-foreground px-3 py-1.5 bg-muted/30 rounded-md whitespace-nowrap cursor-not-allowed">
              Filter
            </div>
            <div className="text-sm font-medium text-muted-foreground px-3 py-1.5 bg-muted/30 rounded-md whitespace-nowrap cursor-not-allowed">
              Sort: Conversions
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {dummyCreatives.length === 0 ? (
            <div className="col-span-full py-12 text-center border border-dashed border-border/50 rounded-2xl">
              <LayoutTemplate className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-foreground">No creatives found.</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This campaign doesn't have specific assets tracked.
              </p>
            </div>
          ) : (
            dummyCreatives.map(creative => (
              <Link 
                key={creative.id} 
                to={`/marketing/creatives/${creative.id}`}
                className="glass-card rounded-xl border border-border/50 p-5 hover:border-primary/50 transition-colors block cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <LayoutTemplate className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors">
                        {creative.name}
                      </h3>
                      <span className="text-xs text-muted-foreground capitalize">
                        {creative.type} Format
                      </span>
                    </div>
                  </div>
                  {creative.trend === 'up' ? (
                    <ArrowUpRight className="h-5 w-5 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 text-red-500" />
                  )}
                </div>
                
                <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-border/50 text-center">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Spend</div>
                    <div className="font-bold text-sm mt-1">₹{creative.spend}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">CTR</div>
                    <div className="font-bold text-sm mt-1">{creative.ctr}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Leads</div>
                    <div className="font-bold text-sm mt-1">{creative.leads}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Joined</div>
                    <div className="font-bold text-sm mt-1 text-primary">{creative.joined}</div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
      
    </div>
  )
}
