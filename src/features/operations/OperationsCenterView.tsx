import { useCandidateIntelligence } from '@/hooks/useCandidateIntelligence'
import { OperationsCoachBriefing } from '@/features/ai'
import { useAIContextBuilder } from '@/sdk/ai'
import { PriorityQueueList } from './components/PriorityQueueList'
import { MarketingInbox } from './components/MarketingInbox'
import { AutomationHubWidget } from '@/features/automation/components/AutomationHubWidget'
import { JourneyTimeline } from '@/features/shared/components/JourneyTimeline'
import type { CandidateJourney } from '@/features/shared/components/JourneyTimeline'
import { useMemo } from 'react'
import dayjs from 'dayjs'
import { useInterviews } from '@/hooks/useInterviews'
import { useFollowUps } from '@/hooks/useFollowUps'
import { useContacts } from '@/hooks/useContacts'
import { ComponentErrorBoundary } from '@/components/providers/ComponentErrorBoundary'
import { FEATURES } from '@/config/featureFlags'
import { OperationsSummary } from './components/OperationsSummary'

// AI coach — only mounted when VITE_ENABLE_AI=true
// When AI is disabled: useAIContextBuilder is never called, zero AI network requests
function OperationsCoachContainer() {
  const aiSnapshot = useAIContextBuilder('default', true)
  if (!aiSnapshot) return <OperationsSummary />
  return (
    <div className="space-y-4">
      <OperationsSummary />
      <OperationsCoachBriefing snapshot={aiSnapshot} />
    </div>
  )
}

export function OperationsCenterView() {
  const { queues, recommendations, isLoading } = useCandidateIntelligence()
  
  // Re-use timeline logic directly from cache for recent activity
  const { data: interviews = [] } = useInterviews()
  const { data: followUps = [] } = useFollowUps()
  const { data: contacts = [] } = useContacts()

  const candidateJourneys: CandidateJourney[] = useMemo(() => {
    const today = dayjs().startOf('day')
    const journeys = new Map<string, CandidateJourney>()
    
    interviews.forEach(i => {
      if (dayjs(i.interview_date).isSame(today, 'day') && i.status === 'scheduled') {
        const contact = contacts.find(c => c.id === i.contact_id)
        if (contact) {
          if (!journeys.has(contact.id)) {
            journeys.set(contact.id, { contactId: contact.id, name: contact.name, touchpoints: [] })
          }
          journeys.get(contact.id)!.touchpoints.push({
            id: `int-${i.id}`,
            event_type: 'interview',
            timestamp: i.interview_date
          })
        }
      }
    })
    
    followUps.forEach(f => {
      if (dayjs(f.follow_up_date).isSame(today, 'day') && f.status !== 'completed') {
        const contact = contacts.find(c => c.id === f.contact_id)
        if (contact) {
          if (!journeys.has(contact.id)) {
            journeys.set(contact.id, { contactId: contact.id, name: contact.name, touchpoints: [] })
          }
          journeys.get(contact.id)!.touchpoints.push({
            id: `fup-${f.id}`,
            event_type: 'followup',
            timestamp: dayjs(f.follow_up_date).hour(10).toISOString()
          })
        }
      }
    })

    return Array.from(journeys.values())
  }, [interviews, followUps, contacts])

  if (isLoading) {
    return <div className="p-8 flex items-center justify-center animate-pulse text-muted-foreground">Loading operations center...</div>
  }

  return (
    <ComponentErrorBoundary fallbackMessage="Failed to load Operations Center.">
      <div className="max-w-5xl mx-auto w-full p-4 md:p-6 space-y-6">
        {/* Top Tier: Mission Summary */}
        <section>
          {FEATURES.AI_ENABLED ? <OperationsCoachContainer /> : <OperationsSummary />}
        </section>

        {/* Middle Tier: The Queues & Automations */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Actionable Queues
            </h3>
          </div>
          <AutomationHubWidget />
          <PriorityQueueList queues={queues} />
        </section>

        {/* Bottom Tier: Inbox & Timeline */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
          <MarketingInbox recommendations={recommendations} />
          <div className="bg-card rounded-xl border p-4">
            <h3 className="text-sm font-semibold mb-4">Today's Timeline</h3>
            <JourneyTimeline candidates={candidateJourneys} />
          </div>
        </section>
      </div>
    </ComponentErrorBoundary>
  )
}
