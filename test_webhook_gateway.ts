import { verifyMetaSignature } from './supabase/functions/webhook-gateway/verify'
import { parseMetaWebhook } from './supabase/functions/webhook-gateway/parsers/MetaWebhookParser'
import { createHmac } from 'node:crypto'

async function runTest() {
  console.log('--- Mocking Supabase Webhook Gateway (Edge Function) ---')
  const APP_SECRET = 'dummy_secret_for_testing'

  const mockPayload = {
    id: "666666666666666",
    created_time: "2026-08-09T00:00:00+0000",
    form_id: "777777777777777",
    field_data: [
      { name: "full_name", values: ["Webhook Test User"] },
      { name: "email", values: ["webhook@example.com"] },
      { name: "phone_number", values: ["+15555555555"] }
    ]
  }

  const rawBody = JSON.stringify(mockPayload)
  
  // Create valid signature
  const validSignature = `sha256=${createHmac('sha256', APP_SECRET).update(rawBody).digest('hex')}`

  console.log('1. Verifying Signature...')
  const isValid = verifyMetaSignature(rawBody, validSignature, APP_SECRET)
  if (isValid) {
    console.log('✅ Signature verified successfully!')
  } else {
    console.log('❌ Signature verification failed!')
    return
  }

  console.log('2. Parsing Payload...')
  const normalizedLead = parseMetaWebhook(mockPayload)
  if (normalizedLead) {
    console.log('✅ Payload parsed successfully into NormalizedLead:')
    console.log(JSON.stringify(normalizedLead, null, 2))
  } else {
    console.log('❌ Parsing failed!')
    return
  }

  console.log('3. Edge Function would now persist to Supabase DB via Admin client.')
  console.log('4. Supabase Realtime detects change and broadcasts.')
  console.log('5. Frontend EventBus receives candidate.created.')
  console.log('6. AI Context invalidates cache and refreshes.')
}

runTest().catch(console.error)
