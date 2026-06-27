import { supabase } from './supabase'
import { type Contact } from '@/types'

/**
 * LeadOS V1 Synthetic Stress Test Generator
 * This exposes a global function to the window object that allows the developer 
 * to flood the local IndexedDB cache with 5,000 mock contacts for performance testing.
 * 
 * Usage in Browser Console:
 * window.runLeadOSStressTest(5000)
 */

declare global {
  interface Window {
    runLeadOSStressTest: (count: number) => Promise<void>
  }
}

export const initStressTester = () => {
  if (typeof window !== 'undefined') {
    window.runLeadOSStressTest = async (count: number = 5000) => {
      console.log(`🚀 [Stress Test] Generating ${count} mock contacts...`)
      
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id
      
      if (!userId) {
        console.error('❌ [Stress Test] You must be logged in to run the stress test.')
        return
      }

      // Generate mock contacts
      const mocks: Contact[] = Array.from({ length: count }).map((_, i) => ({
        id: crypto.randomUUID(),
        workspace_id: userId,
        name: `Stress Test Lead ${i + 1}`,
        phone: `+9190000${String(i).padStart(5, '0')}`,
        email: `lead${i}@stresstest.local`,
        stage: 'NEW',
        type: 'WALK_IN',
        assigned_to: userId,
        status: 'ACTIVE',
        is_synced: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false,
        priority: 'MEDIUM',
        score: Math.floor(Math.random() * 100),
        source: 'DIRECT',
        metadata: {
          test: true,
          index: i
        }
      } as unknown as Contact))

      console.log(`📦 [Stress Test] Inserting ${count} contacts into local cache...`)
      
      try {
        // We bypass the mutation queue and insert directly into the React Query cache
        // to simulate a massive initial sync fetch.
        const req = indexedDB.open('leados_query_cache')
        
        req.onsuccess = (e) => {
          const db = (e.target as IDBOpenDBRequest).result
          if (!db.objectStoreNames.contains('leados_query_cache')) {
            console.error('❌ [Stress Test] Query cache store not found. Please log in and load the dashboard first.')
            return
          }
          
          const tx = db.transaction('leados_query_cache', 'readwrite')
          const store = tx.objectStore('leados_query_cache')
          
          // Get existing contacts
          const getReq = store.get('contacts')
          
          getReq.onsuccess = () => {
            let state = getReq.result
            if (!state) {
              // Create mock state if empty
              state = {
                id: 'contacts',
                state: {
                  data: mocks,
                  dataUpdateCount: 1,
                  dataUpdatedAt: Date.now(),
                  error: null,
                  errorUpdateCount: 0,
                  errorUpdatedAt: 0,
                  fetchFailureCount: 0,
                  fetchFailureReason: null,
                  fetchMeta: null,
                  isInvalidated: false,
                  status: 'success',
                  fetchStatus: 'idle',
                }
              }
            } else {
              // Append to existing
              state.state.data = [...state.state.data, ...mocks]
              state.state.dataUpdatedAt = Date.now()
            }
            
            store.put(state, 'contacts')
            
            tx.oncomplete = () => {
              console.log(`✅ [Stress Test] Successfully injected ${count} contacts!`)
              console.log(`🔄 [Stress Test] Hard reloading the page to hydrate from IndexedDB...`)
              setTimeout(() => {
                window.location.reload()
              }, 1500)
            }
          }
        }
      } catch (err) {
        console.error('❌ [Stress Test] Failed:', err)
      }
    }
    
    console.log('🧪 [Stress Test] Loaded. Run window.runLeadOSStressTest(5000) in console.')
  }
}
