import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://osnxdtsrayulwndbvgjl.supabase.co', 'sb_publishable_httSDJUUohbMitg7ke85bg_v9m-e-rP')

async function run() {
  const email = `test-${Date.now()}@example.com`
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'Password123!',
    options: {
      data: { name: 'Test User' }
    }
  })
  if (error) {
    console.error('Signup error:', error.message)
    return
  }
  console.log('Signup success:', data.user?.identities?.length ? 'Confirmed' : 'Unconfirmed / Requires email check')
  
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password: 'Password123!'
  })
  if (loginError) {
    console.error('Login error:', loginError.message)
  } else {
    console.log('Login successful!')
  }
}
run()
