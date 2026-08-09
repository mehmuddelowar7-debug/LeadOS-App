import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://osnxdtsrayulwndbvgjl.supabase.co'
const supabaseAnonKey = 'sb_publishable_httSDJUUohbMitg7ke85bg_v9m-e-rP'

async function getLiveSchemaCsv() {
  const response = await fetch(`${supabaseUrl}/rest/v1/contacts?limit=0`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Accept': 'text/csv'
    }
  })
  const csv = await response.text()
  console.log("CSV Header (Columns):")
  console.log(csv)
}

getLiveSchemaCsv()
