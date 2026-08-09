import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://osnxdtsrayulwndbvgjl.supabase.co'
const supabaseAnonKey = 'sb_publishable_httSDJUUohbMitg7ke85bg_v9m-e-rP'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function runTest() {
  console.log("1. Creating dummy user...")
  const email = `test+${Date.now()}@example.com`
  const password = "Password123!"
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        workspace_id: '00000000-0000-0000-0000-000000000000' // Let's see if we can just set this
      }
    }
  })

  if (authError) {
    console.error("Auth error:", authError)
    // If sign up fails because of email confirmation, we might need to use a different approach
    // But usually in dev it's disabled. Let's see.
  } else {
    console.log("Logged in as:", authData.user?.id)
  }

  const userId = authData.user?.id || '00000000-0000-0000-0000-000000000000'
  const workspaceId = authData.user?.user_metadata?.workspace_id || '00000000-0000-0000-0000-000000000000'

  const payload = {
    id: crypto.randomUUID(),
    workspace_id: workspaceId,
    created_by: userId,
    name: 'John Doe',
    phone: '9876543210',
    roles: ['opportunity'],
    source: 'instagram',
    // entry_date removed!
  }

  console.log("2. Attempting insert with authenticated user...")
  const { data, error, status, statusText } = await supabase.from('contacts').insert(payload).select()
  
  if (error) {
    console.error("Insert failed:", error, status, statusText)
  } else {
    console.log("Insert succeeded!", data)
  }
}

runTest()
