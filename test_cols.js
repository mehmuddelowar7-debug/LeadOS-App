import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://osnxdtsrayulwndbvgjl.supabase.co',
  'sb_publishable_httSDJUUohbMitg7ke85bg_v9m-e-rP'
)

async function checkColumns() {
  const { data, error } = await supabase.from('contacts').select('entry_date').limit(1)
  console.log('Result for entry_date:', error?.message || 'Success')
  
  const { data: d2, error: e2 } = await supabase.from('contacts').select('created_at').limit(1)
  console.log('Result for created_at:', e2?.message || 'Success')
}

checkColumns()
