import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://osnxdtsrayulwndbvgjl.supabase.co'
const supabaseAnonKey = 'sb_publishable_httSDJUUohbMitg7ke85bg_v9m-e-rP'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testInsert() {
  const payload = {
    id: crypto.randomUUID(),
    workspace_id: '00000000-0000-0000-0000-000000000000',
    created_by: '00000000-0000-0000-0000-000000000000',
    name: 'John Doe',
    phone: '9876543210',
    roles: ['opportunity'],
    source: 'instagram',
  }
  
  console.log('Sending payload:', JSON.stringify(payload, null, 2))

  const { data, error, status, statusText } = await supabase.from('contacts').insert(payload)
  
  console.log('Status:', status, statusText)
  
  if (error) {
    console.error('Error details:', error)
  } else {
    console.log('Success!', data)
  }
}

testInsert()
