import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://osnxdtsrayulwndbvgjl.supabase.co'
const supabaseAnonKey = 'sb_publishable_httSDJUUohbMitg7ke85bg_v9m-e-rP'
// We cannot create a workspace if workspaces table has RLS for insert that only allows service role or something?
// Let's check RLS on workspaces. 

// Actually, wait, we can't easily set up a workspace if RLS blocks it.
// Let's try it anyway.
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testCompleteFlow() {
  console.log("1. Creating test user...")
  const email = `test+${Date.now()}@example.com`
  const password = "Password123!"
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password
  })
  
  if (authError) {
    console.error("Auth Error:", authError)
    return
  }
  
  const userId = authData.user?.id
  console.log("User created:", userId)

  console.log("2. Creating workspace...")
  const { data: wsData, error: wsError } = await supabase.from('workspaces').insert({
    name: 'Test Workspace',
    slug: `test-${Date.now()}`
  }).select().single()
  
  if (wsError) {
    console.error("Workspace Error:", wsError)
    // If we can't create a workspace, we might not be able to test end-to-end via script without a seed user.
  } else {
    console.log("Workspace created:", wsData.id)
    
    console.log("3. Adding to workspace_members...")
    await supabase.from('workspace_members').insert({
      workspace_id: wsData.id,
      user_id: userId,
      role: 'owner'
    })
    
    console.log("4. Attempting contact insert...")
    const contactId = crypto.randomUUID()
    const payload = {
      id: contactId,
      workspace_id: wsData.id,
      created_by: userId,
      name: 'John Doe',
      phone: '9876543210',
      roles: ['opportunity'],
      source: 'instagram'
    }
    const { data: contactData, error: contactError } = await supabase.from('contacts').insert(payload).select().single()
    if (contactError) {
      console.error("Contact Insert Error:", contactError)
    } else {
      console.log("Contact Inserted Successfully!")
      console.log(JSON.stringify(contactData, null, 2))
    }
  }
}
testCompleteFlow()
