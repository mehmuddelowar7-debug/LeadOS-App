import { MetaLeadAdsIngestion } from './src/sdk/ingestion/meta/MetaLeadAds'
import { eventBus } from './src/sdk/events'

async function runTest() {
  console.log('--- Starting Meta Lead Ads Ingestion Test ---\n')

  // Setup listeners
  eventBus.subscribe('marketing.lead_received', (payload) => {
    console.log('[Event Received] marketing.lead_received:', JSON.stringify(payload, null, 2))
  })

  eventBus.subscribe('candidate.created', (payload) => {
    console.log('[Event Received] candidate.created:', JSON.stringify(payload, null, 2))
  })

  const ingestion = new MetaLeadAdsIngestion()

  const mockPayload = {
    id: "444444444444444",
    created_time: "2026-08-09T00:00:00+0000",
    form_id: "555555555555555",
    field_data: [
      { name: "full_name", values: ["Test Candidate"] },
      { name: "email", values: ["test@example.com"] },
      { name: "phone_number", values: ["+919999999999"] }
    ]
  }

  const result = await ingestion.processWebhook(mockPayload)
  
  console.log('\nResult:', result)
}

runTest().catch(console.error)
