import { MarketingInbox } from './components/MarketingInbox'

import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { MarketingAnalystBrief } from '@/features/ai'
import { useAIContextBuilder } from '@/sdk/ai'
import { useContacts } from '@/hooks/useContacts'
import { useMemo } from 'react'

export function MarketingHomeView() {
  const aiSnapshot = useAIContextBuilder('default', true)
  const { data: contacts = [] } = useContacts()

  const sourceStats = useMemo(() => {
    const stats: Record<string, { id: string, name: string, leads: number, joined: number, cpl: number, cpj: number, trend: string, bestCampaign: string }> = {}
    
    contacts.forEach(contact => {
      const source = contact.source || 'unknown'
      if (!stats[source]) {
        stats[source] = {
          id: source,
          name: source.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          leads: 0,
          joined: 0,
          cpl: 0,
          cpj: 0,
          trend: 'up',
          bestCampaign: 'Organic'
        }
      }
      stats[source].leads += 1
      if (contact.opportunity?.status === 'activated' || contact.opportunity?.status === 'completed') {
        stats[source].joined += 1
      }
    })

    return Object.values(stats).sort((a, b) => b.leads - a.leads)
  }, [contacts])

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Section: AI Marketing Brief */}
      <section>
        {aiSnapshot && <MarketingAnalystBrief snapshot={aiSnapshot} />}
      </section>

      {/* Middle Section: Marketing Inbox */}
      <section>
        <MarketingInbox />
      </section>

      {/* Source Performance */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">Source Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sourceStats.map((source) => (
            <div 
              key={source.id}
              className="glass-card rounded-xl border border-border/50 p-5 hover:border-primary/50 transition-colors block cursor-default"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-foreground text-lg">{source.name}</h3>
                {source.trend === 'up' ? (
                  <ArrowUpRight className="h-5 w-5 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-5 w-5 text-red-500" />
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Leads</span>
                  <span className="font-bold">{source.leads}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Joined</span>
                  <span className="font-bold">{source.joined}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-border/50 pt-2 mt-2">
                  <span className="text-muted-foreground">Cost / Joined</span>
                  <span className="font-bold">₹{source.cpj}</span>
                </div>
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-muted-foreground">Best Campaign</span>
                  <span className="font-medium text-primary truncate max-w-[120px]">{source.bestCampaign}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
