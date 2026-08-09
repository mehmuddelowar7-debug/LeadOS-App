import { eventBus } from '../../events'
import { v4 as uuidv4 } from 'uuid' // Ensure uuid is installed or generate an id

export interface MetaLeadPayload {
  id: string
  created_time: string
  field_data: Array<{ name: string; values: string[] }>
  form_id: string
  ad_id?: string
  campaign_id?: string
}

export class MetaLeadAdsIngestion {
  /**
   * Processes a raw Meta Lead Ad Webhook payload.
   * Maps it to RecruitOS Candidate structure and dispatches the event.
   */
  async processWebhook(payload: MetaLeadPayload): Promise<{ success: boolean; candidateId?: string }> {
    try {
      console.log('[Ingestion:Meta] Processing incoming lead', payload.id)
      
      // Extract fields (simplified example)
      // Extract values directly in returned object

      // Simulate Candidate Creation (In reality, this hits the DB via CRM SDK)
      const newCandidateId = `cnd_${uuidv4().substring(0, 8)}`
      
      // Dispatch Event
      eventBus.dispatch('marketing.lead_received', {
        source: 'meta',
        rawData: payload,
        normalizedCandidateId: newCandidateId
      })

      // Trigger candidate created event as well
      eventBus.dispatch('candidate.created', {
        candidateId: newCandidateId,
        source: 'meta'
      })

      return { success: true, candidateId: newCandidateId }

    } catch (err) {
      console.error('[Ingestion:Meta] Failed to process lead', err)
      return { success: false }
    }
  }
}
