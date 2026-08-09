export interface NormalizedLead {
  source: string
  externalId: string
  receivedAt: string
  candidate: {
    name: string
    email?: string
    phone?: string
  }
  attribution: {
    campaignId?: string
    adId?: string
    formId?: string
  }
  metadata: Record<string, any>
}

/**
 * Parses a Meta Lead Ad Webhook JSON payload into a generic NormalizedLead
 */
export function parseMetaWebhook(payload: any): NormalizedLead | null {
  // Meta webhooks have a specific structure.
  // Generally, payload.entry[0].changes[0].value contains the leadgen data.
  // For this parser, we handle the simplified mock payload directly, 
  // or fall back to extracting from the complex graph structure.

  try {
    // Handling direct simplified mock payload for testing
    if (payload.field_data) {
      return extractFromFieldData(payload)
    }

    // Handling actual Meta structure
    if (payload.object === 'page' && payload.entry) {
      const change = payload.entry[0]?.changes?.[0]?.value
      if (change && change.item === 'leadgen') {
        // Normally you'd fetch the lead details from the Graph API using change.leadgen_id
        // But for LeadOS webhook parser demo, we assume the data is either enriched or passed.
        return {
          source: 'meta',
          externalId: change.leadgen_id,
          receivedAt: new Date().toISOString(),
          candidate: {
            name: 'Meta Lead (Pending Fetch)',
          },
          attribution: {
            formId: change.form_id,
            adId: change.ad_id
          },
          metadata: change
        }
      }
    }

    return null
  } catch (err) {
    console.error('Error parsing Meta webhook:', err)
    return null
  }
}

function extractFromFieldData(data: any): NormalizedLead {
  let email = ''
  let phone = ''
  let name = ''

  data.field_data.forEach((field: any) => {
    const val = field.values[0] || ''
    if (field.name === 'email') email = val
    if (field.name === 'phone_number') phone = val
    if (field.name === 'full_name') name = val
  })

  return {
    source: 'meta',
    externalId: data.id || `mock_${Date.now()}`,
    receivedAt: data.created_time || new Date().toISOString(),
    candidate: { name, email, phone },
    attribution: {
      formId: data.form_id,
      campaignId: data.campaign_id,
      adId: data.ad_id
    },
    metadata: { raw: data }
  }
}
