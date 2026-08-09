import { useParams, Link } from 'react-router'
import { ArrowUpRight, ArrowDownRight, Megaphone } from 'lucide-react'

// Dummy data for scaffolding Phase 2
const dummySource = { id: '1', name: 'Instagram', leads: 152, joined: 12, cpl: 83, cpj: 694 }

const dummyCampaigns = [
  { id: '101', name: 'August Hiring', status: 'active', leads: 24, joined: 5, spend: 2000, cpj: 400, trend: 'up' },
  { id: '102', name: 'Beauty Careers', status: 'completed', leads: 18, joined: 4, spend: 1200, cpj: 300, trend: 'up' },
  { id: '103', name: 'Retargeting Mix', status: 'active', leads: 110, joined: 3, spend: 4500, cpj: 1500, trend: 'down' },
]

export function MarketingSourceView() {
  const {} = useParams()
  
  // In reality: 
  // const { data: campaigns } = useMarketingCampaigns(id)
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      
      {/* Source KPIs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            {dummySource.name} Performance
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Analyzing all campaigns and organic traffic for this source.
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-background border border-border/50 rounded-xl px-4 py-2 text-center">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Leads</div>
            <div className="text-lg font-black text-foreground">{dummySource.leads}</div>
          </div>
          <div className="bg-background border border-border/50 rounded-xl px-4 py-2 text-center">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Cost / Joined</div>
            <div className="text-lg font-black text-foreground">₹{dummySource.cpj}</div>
          </div>
        </div>
      </div>

      {/* Campaign List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-foreground">Top Campaigns</h3>
          {/* Placeholder for future filtering/sorting/search */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input 
              type="text" 
              placeholder="Search campaigns..." 
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dummyCampaigns.length === 0 ? (
            <div className="col-span-full py-12 text-center border border-dashed border-border/50 rounded-2xl">
              <Megaphone className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-foreground">No campaigns yet.</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first campaign to start measuring ROI for this source.
              </p>
            </div>
          ) : (
            dummyCampaigns.map(campaign => (
              <Link 
                key={campaign.id} 
                to={`/marketing/campaigns/${campaign.id}`}
                className="glass-card rounded-xl border border-border/50 p-5 hover:border-primary/50 transition-colors block cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors">
                      {campaign.name}
                    </h3>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                      campaign.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'
                    }`}>
                      {campaign.status}
                    </span>
                  </div>
                  {campaign.trend === 'up' ? (
                    <ArrowUpRight className="h-5 w-5 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 text-red-500" />
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/50">
                  <div>
                    <div className="text-xs text-muted-foreground">Spend</div>
                    <div className="font-bold">₹{campaign.spend}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Joined</div>
                    <div className="font-bold text-primary">{campaign.joined}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Leads</div>
                    <div className="font-bold">{campaign.leads}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">CPJ</div>
                    <div className="font-bold">₹{campaign.cpj}</div>
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
