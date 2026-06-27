import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env' })
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)
supabase.storage.from('missing_bucket_123').download('test').then(console.log).catch(console.error)
