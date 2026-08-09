import { supabase } from '@/lib/supabase'
import { eventBus } from './EventBus'

/**
 * RealtimeBridge
 * Connects Supabase Realtime to the local in-memory Event Bus.
 * This bridges the gap between backend Webhooks (which write to Postgres)
 * and frontend React components (which listen to the EventBus).
 */
export function initializeRealtimeBridge() {
  console.log('[RealtimeBridge] Initializing Supabase Realtime subscription...')

  const channel = supabase.channel('table-db-changes')
    
  channel
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'contacts',
      },
      (payload) => {
        console.log('[RealtimeBridge] Detected Contact Insert:', payload.new)
        
        // Dispatch local event for UI components and AI Context to react to
        eventBus.dispatch('candidate.created', {
          candidateId: payload.new.id,
          source: payload.new.source || 'unknown'
        })
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'contacts',
      },
      (payload) => {
        console.log('[RealtimeBridge] Detected Contact Update:', payload.new)
        
        eventBus.dispatch('candidate.updated', {
          candidateId: payload.new.id,
          changes: payload.new
        })
      }
    )
    .subscribe((status) => {
      console.log(`[RealtimeBridge] Subscription status: ${status}`)
    })

  return () => {
    supabase.removeChannel(channel)
  }
}
