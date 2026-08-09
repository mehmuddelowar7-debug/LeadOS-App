import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://osnxdtsrayulwndbvgjl.supabase.co',
  'sb_publishable_httSDJUUohbMitg7ke85bg_v9m-e-rP'
)

async function testRPC() {
  console.log('Testing RPC get_dashboard_metrics...')
  // We don't have a real user session, but we can just pass fake UUIDs 
  // to see if the DB throws a syntax/column-missing error
  const { data, error } = await supabase.rpc('get_dashboard_metrics', {
    p_workspace_id: '00000000-0000-0000-0000-000000000000',
    p_user_id: '00000000-0000-0000-0000-000000000000'
  })
  
  if (error) {
    console.error('ERROR:', error)
  } else {
    console.log('DATA:', JSON.stringify(data, null, 2))
  }
}

testRPC()
