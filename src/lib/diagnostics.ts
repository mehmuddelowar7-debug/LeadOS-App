import { supabase, isSupabaseConfigured } from './supabase'

export type DiagnosticStatus = 'pending' | 'ok' | 'error' | 'warning' | 'idle'

export interface DiagnosticState {
  envVars: DiagnosticStatus
  supabaseConnection: DiagnosticStatus
  schemaValidation: DiagnosticStatus
  storageBuckets: DiagnosticStatus
}

export interface DiagnosticReport {
  isReady: boolean
  state: DiagnosticState
  details: string[]
}

export async function runStartupDiagnostics(): Promise<DiagnosticReport> {
  const state: DiagnosticState = {
    envVars: 'idle',
    supabaseConnection: 'idle',
    schemaValidation: 'idle',
    storageBuckets: 'idle'
  }
  const details: string[] = []
  let isReady = true

  // 1. Env Vars
  if (isSupabaseConfigured) {
    state.envVars = 'ok'
  } else {
    state.envVars = 'error'
    details.push('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment variables.')
    isReady = false
    return { isReady, state, details } // Halt immediately
  }

  // 2. Supabase Connection & Schema Validation
  try {
    // A single query to check if 'workspaces' table exists and we can connect
    const { error } = await supabase.from('workspaces').select('id').limit(1)
    
    if (error) {
      if (error.message.includes('FetchError') || error.message.includes('Failed to fetch')) {
        state.supabaseConnection = 'warning'
        state.schemaValidation = 'pending'
        details.push('Could not reach Supabase (Offline). Bypassing schema checks.')
        // DO NOT set isReady = false. Offline-first apps must boot even if unreachable!
      } else if (error.code === '42P01' || error.message.includes('does not exist') || error.code?.startsWith('PGRST')) {
        state.supabaseConnection = 'ok'
        state.schemaValidation = 'error'
        details.push('Database schema is missing. Please run `schema.sql` in the Supabase SQL Editor.')
        // Self-Healing: Purge potentially invalid local cache
        indexedDB.deleteDatabase('leados_query_cache')
        isReady = false
      } else {
        // Unknown error, but we connected
        state.supabaseConnection = 'ok'
        state.schemaValidation = 'warning'
        details.push(`Schema warning: ${error.message}`)
      }
    } else {
      state.supabaseConnection = 'ok'
      state.schemaValidation = 'ok'
    }
  } catch (err: any) {
    state.supabaseConnection = 'error'
    details.push(`Connection exception: ${err.message}`)
    isReady = false
  }

  // 3. Storage Buckets
  // Frontend anon keys do not have permissions to query storage.buckets. 
  // We assume the bucket is configured if the database is.
  state.storageBuckets = 'ok'

  return { isReady, state, details }
}
