import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://osnxdtsrayulwndbvgjl.supabase.co'
const supabaseAnonKey = 'sb_publishable_httSDJUUohbMitg7ke85bg_v9m-e-rP'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function diagnose() {
  console.log('=== AI Proxy Diagnosis ===')
  console.log('Supabase URL:', supabaseUrl)
  console.log('Testing supabase.functions.invoke("ai-proxy")...\n')

  const { data, error } = await supabase.functions.invoke('ai-proxy', {
    body: {
      document: {
        system: 'You are a helpful assistant.',
        messages: [{ role: 'user', content: 'Reply with exactly: PROBE_OK' }]
      }
    }
  })

  if (error) {
    console.log('❌ FAILED')
    console.log('Error message:', error.message)
    
    // Access the raw response for HTTP status
    const ctx = (error as any).context
    if (ctx) {
      console.log('HTTP Status:', ctx.status)
      console.log('HTTP StatusText:', ctx.statusText)
      try {
        const body = await ctx.text()
        console.log('Response body:', body)
      } catch {}
    }
  } else {
    console.log('✅ SUCCESS')
    console.log('Response:', JSON.stringify(data, null, 2))
  }
}

diagnose()
