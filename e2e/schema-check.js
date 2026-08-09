import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://osnxdtsrayulwndbvgjl.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_httSDJUUohbMitg7ke85bg_v9m-e-rP'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase.from('information_schema.columns').select('*').limit(1)
  console.log('Data:', data)
  console.log('Error:', error)
}
run()
