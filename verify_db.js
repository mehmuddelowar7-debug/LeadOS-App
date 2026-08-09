import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://osnxdtsrayulwndbvgjl.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_httSDJUUohbMitg7ke85bg_v9m-e-rP'
const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyLiveDatabase() {
  console.log('--- PHASE 1: DATABASE VERIFICATION ---\n')

  // 1. Check contacts columns
  console.log('[1] Checking contacts table columns...')
  const { data: contactsData, error: contactsErr } = await supabase.from('contacts').select('entry_date').limit(1)
  console.log('  -> Querying entry_date:', contactsErr ? contactsErr.message : 'SUCCESS')
  
  const { data: contactsData2, error: contactsErr2 } = await supabase.from('contacts').select('created_at').limit(1)
  console.log('  -> Querying created_at:', contactsErr2 ? contactsErr2.message : 'SUCCESS')

  // 2. Check contact_activities columns
  console.log('\n[2] Checking contact_activities table columns...')
  const { data: activitiesData, error: activitiesErr } = await supabase.from('contact_activities').select('activity_date').limit(1)
  console.log('  -> Querying activity_date:', activitiesErr ? activitiesErr.message : 'SUCCESS')
  
  const { data: activitiesData2, error: activitiesErr2 } = await supabase.from('contact_activities').select('created_at').limit(1)
  console.log('  -> Querying created_at:', activitiesErr2 ? activitiesErr2.message : 'SUCCESS')

  // 3. Check RPC output (what is actually returning right now)
  console.log('\n[3] Checking live get_dashboard_metrics RPC return value...')
  const { data: rpcData, error: rpcErr } = await supabase.rpc('get_dashboard_metrics', {
    p_workspace_id: '00000000-0000-0000-0000-000000000000',
    p_user_id: '00000000-0000-0000-0000-000000000000'
  })
  
  if (rpcErr) {
    console.log('  -> RPC Error:', rpcErr.message)
  } else {
    console.log('  -> RPC Data Returned:\n', JSON.stringify(rpcData, null, 2))
  }
}

verifyLiveDatabase()
