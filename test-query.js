import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://osnxdtsrayulwndbvgjl.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_httSDJUUohbMitg7ke85bg_v9m-e-rP';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Fetching contacts...');
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('id, name, phone, roles, labels, created_at, photo_url, whatsapp, opportunity:opportunities(status)')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) console.error('Contacts Error:', error);
    else console.log('Contacts Data length:', data.length);
  } catch(e) { console.error('Contacts Throw:', e); }

  console.log('Fetching interviews...');
  try {
    const { data, error } = await supabase
      .from('interviews')
      .select(`
        *,
        contact:contacts(name, phone)
      `)
      .order('interview_date', { ascending: true })
      .order('interview_time', { ascending: true })
      .limit(5);
      
    if (error) console.error('Interviews Error:', error);
    else console.log('Interviews Data length:', data.length);
  } catch(e) { console.error('Interviews Throw:', e); }

  console.log('Fetching follow ups...');
  try {
    const { data, error } = await supabase
      .from('follow_ups')
      .select(`
        *,
        contact:contacts(name, phone)
      `)
      .order('follow_up_date', { ascending: true })
      .order('follow_up_time', { ascending: true })
      .limit(5);
      
    if (error) console.error('Followups Error:', error);
    else console.log('Followups Data length:', data.length);
  } catch(e) { console.error('Followups Throw:', e); }
}

test();
