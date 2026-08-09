import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://osnxdtsrayulwndbvgjl.supabase.co',
  'sb_publishable_httSDJUUohbMitg7ke85bg_v9m-e-rP'
)

async function getFunctionDef() {
  const { data, error } = await supabase.rpc('get_dashboard_metrics_def_if_possible')
  // We can't do that. Let's just query a test row or see what's wrong.
  // Actually, we can fetch all contacts to see columns using REST API
  const { data: contactsData, error: contactsErr } = await supabase.from('contacts').select('*').limit(1)
  console.log('Contacts columns:', contactsData && contactsData.length > 0 ? Object.keys(contactsData[0]) : 'no rows or error', contactsErr)
}

getFunctionDef()
