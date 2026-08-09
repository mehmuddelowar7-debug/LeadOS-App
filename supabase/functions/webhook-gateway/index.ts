import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyMetaSignature } from './verify.ts'
import { parseMetaWebhook } from './parsers/MetaWebhookParser.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const path = url.pathname // e.g. /webhook-gateway/meta

  // ==========================================
  // META WEBHOOK VERIFICATION (GET)
  // ==========================================
  if (req.method === 'GET' && path.endsWith('/meta')) {
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    const metaVerifyToken = Deno.env.get('META_VERIFY_TOKEN')

    if (mode === 'subscribe' && token === metaVerifyToken) {
      console.log('Meta webhook verified successfully')
      return new Response(challenge, { status: 200 })
    } else {
      return new Response('Forbidden', { status: 403 })
    }
  }

  // ==========================================
  // META WEBHOOK INGESTION (POST)
  // ==========================================
  if (req.method === 'POST' && path.endsWith('/meta')) {
    try {
      const rawBody = await req.text()
      const signature = req.headers.get('x-hub-signature-256')
      const metaAppSecret = Deno.env.get('META_APP_SECRET') || ''

      // 1. Signature Verification
      if (!verifyMetaSignature(rawBody, signature, metaAppSecret)) {
        console.error('Invalid Meta Signature')
        return new Response('Invalid Signature', { status: 401 })
      }

      // 2. Parse Payload
      const jsonBody = JSON.parse(rawBody)
      const normalizedLead = parseMetaWebhook(jsonBody)

      if (!normalizedLead) {
        return new Response('Ignored (Not a lead event)', { status: 200 })
      }

      // 3. Persistence Layer
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // Insert Contact
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          name: normalizedLead.candidate.name,
          email: normalizedLead.candidate.email,
          phone: normalizedLead.candidate.phone,
          status: 'Lead',
          source: 'meta',
          metadata: normalizedLead.metadata
        })
        .select()
        .single()

      if (contactError) throw contactError

      // Insert Opportunity
      const { error: oppError } = await supabase
        .from('opportunities')
        .insert({
          contact_id: contact.id,
          title: `${normalizedLead.candidate.name} - Meta Lead`,
          stage: 'Lead',
          value: 0
        })

      if (oppError) throw oppError

      // Return success. Realtime will pick up the DB insert and broadcast to frontend EventBus.
      return new Response(JSON.stringify({ success: true, contactId: contact.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })

    } catch (error: any) {
      console.error('Webhook processing error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }
  }

  // Not Found
  return new Response('Not Found', { status: 404, headers: corsHeaders })
})
