import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://osnxdtsrayulwndbvgjl.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_httSDJUUohbMitg7ke85bg_v9m-e-rP'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const report = []
  
  function log(item, status, detail) {
    report.push({ item, status, detail })
    console.log(`[${status}] ${item} - ${detail}`)
  }

  try {
    // 1. Auth / Setup
    const email = `test-${Date.now()}@example.com`
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email, password: 'Password123!',
      options: { data: { name: 'E2E Tester' } }
    })
    
    if (authErr) throw new Error('Auth failed: ' + authErr.message)
    const userId = authData.user.id
    log('Authentication', 'PASS', `Created user ${userId}`)

    // Get Workspace
    const { data: wsData, error: wsErr } = await supabase.from('workspace_members').select('workspace_id').eq('user_id', userId).single()
    const workspaceId = wsData?.workspace_id
    if (!workspaceId) throw new Error('No workspace created for new user via trigger')
    log('Workspace Creation', 'PASS', `Assigned workspace ${workspaceId}`)

    // 2. Candidate Creation (CRUD)
    const contactId = crypto.randomUUID()
    const phone = `9477${Math.floor(100000 + Math.random() * 900000)}`
    
    const { error: insertErr } = await supabase.from('contacts').insert({
      id: contactId,
      workspace_id: workspaceId,
      created_by: userId,
      name: 'E2E Test Candidate',
      phone: phone,
      source: 'meta_lead'
    })
    if (insertErr) throw new Error('Insert contact failed: ' + insertErr.message)
    log('Candidate CRUD - Create', 'PASS', 'Inserted contact successfully')

    // 3. Duplicate Prevention
    const { error: dupErr } = await supabase.from('contacts').insert({
      id: crypto.randomUUID(), workspace_id: workspaceId, created_by: userId, name: 'Dupe', phone: phone, source: 'other'
    })
    if (dupErr && dupErr.code === '23505') {
      log('Duplicate Prevention', 'PASS', 'Unique constraint successfully blocked duplicate phone')
    } else {
      log('Duplicate Prevention', 'FAIL', 'Allowed duplicate or failed for wrong reason: ' + (dupErr?.message || 'No error'))
    }

    // 4. Update Profile
    const { error: updErr } = await supabase.from('contacts').update({ age: 25 }).eq('id', contactId)
    if (updErr) throw new Error('Update failed: ' + updErr.message)
    log('Candidate CRUD - Edit', 'PASS', 'Updated contact successfully')

    // 5. Timeline Action
    const { error: tlErr } = await supabase.from('contact_activities').insert({
      contact_id: contactId, workspace_id: workspaceId, created_by: userId, activity_type: 'note_added', content: 'Test Note'
    })
    if (tlErr) throw new Error('Timeline insert failed: ' + tlErr.message)
    log('Timeline', 'PASS', 'Inserted activity successfully')

    // 6. Archive
    const { error: archErr } = await supabase.from('contacts').update({ is_archived: true }).eq('id', contactId)
    if (archErr) throw new Error('Archive failed: ' + archErr.message)
    
    const { data: checkData } = await supabase.from('contacts').select('is_archived').eq('id', contactId).single()
    if (checkData.is_archived) {
      log('Archive Operations', 'PASS', 'Contact archived successfully')
    } else {
      log('Archive Operations', 'FAIL', 'is_archived flag not set')
    }

    // Cleanup / Generate Output
    fs.writeFileSync('e2e-report.json', JSON.stringify(report, null, 2))
    console.log('--- VALIDATION COMPLETE ---')

  } catch (err) {
    log('Execution', 'FATAL', err.message)
    fs.writeFileSync('e2e-report.json', JSON.stringify(report, null, 2))
    console.log('--- VALIDATION FAILED ---')
  }
}
run()
