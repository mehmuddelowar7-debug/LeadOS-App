import { get, set, del } from 'idb-keyval'
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client'
import { supabase } from './supabase'
import { toast } from 'sonner'
import { logger } from './logger'

// ============================================================================
// React Query Cache Persister (Read cache)
// ============================================================================

import { usePerformanceStore } from '@/hooks/usePerformanceStore'
import { IS_PERF_MODE } from '@/components/dev/PerformanceProfiler'

const IDB_CACHE_KEY = 'leados_query_cache'

export function createIDBPersister(idbValidKey: IDBValidKey = IDB_CACHE_KEY): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      try {
        const start = IS_PERF_MODE ? performance.now() : 0
        await set(idbValidKey, client)
        if (IS_PERF_MODE) {
          usePerformanceStore.getState().setIdbMetrics('write', performance.now() - start)
        }
      } catch (err: any) {
        logger.error('IndexedDB Persist Error', err)
        if (err.name === 'QuotaExceededError' || err.name === 'InvalidStateError') {
          logger.warn('Clearing IDB cache to recover from error.')
          await del(idbValidKey).catch(() => {})
        }
      }
    },
    restoreClient: async () => {
      try {
        const start = IS_PERF_MODE ? performance.now() : 0
        const res = await get<PersistedClient>(idbValidKey)
        if (IS_PERF_MODE) {
          usePerformanceStore.getState().setIdbMetrics('hydration', performance.now() - start)
        }
        return res
      } catch (err) {
        logger.error('IndexedDB Restore Error', err)
        return undefined
      }
    },
    removeClient: async () => {
      try {
        await del(idbValidKey)
      } catch (err) {
        logger.error('IndexedDB Remove Error', err)
      }
    },
  }
}

// ============================================================================
// Offline Mutation Queue (Write cache)
// ============================================================================

const IDB_MUTATION_QUEUE_KEY = 'leados_mutation_queue'

export type OfflineMutation = {
  id: string
  timestamp: number
  table: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  payload: any
  matchField?: string
  matchValue?: string
}


export async function getMutationQueue(): Promise<OfflineMutation[]> {
  try {
    const start = IS_PERF_MODE ? performance.now() : 0
    const queue = await get<OfflineMutation[]>(IDB_MUTATION_QUEUE_KEY)
    if (IS_PERF_MODE) {
      const end = performance.now()
      usePerformanceStore.getState().setIdbMetrics('read', end - start)
      usePerformanceStore.getState().setOfflineQueueLength(queue?.length || 0)
    }
    return queue || []
  } catch (err) {
    logger.error('Failed to read mutation queue from IDB', err)
    return []
  }
}

export async function pushToMutationQueue(mutation: Omit<OfflineMutation, 'id' | 'timestamp'>) {
  const queue = await getMutationQueue()
  const newMutation: OfflineMutation = {
    ...mutation,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  }
  queue.push(newMutation)
  try {
    await set(IDB_MUTATION_QUEUE_KEY, queue)
  } catch (err: any) {
    logger.error('Failed to push mutation to IDB', err)
    toast.error('Local storage full or corrupted. Please refresh the app.')
  }
  return newMutation
}

export async function clearMutationQueue() {
  try {
    await set(IDB_MUTATION_QUEUE_KEY, [])
  } catch (err) {
    logger.error('Failed to clear mutation queue', err)
  }
}

export async function syncOfflineMutations(retryCount = 0) {
  if (!navigator.onLine) return

  const queue = await getMutationQueue()
  if (queue.length === 0) return

  logger.info(`Syncing offline mutations`, { count: queue.length, retryCount })
  let successCount = 0
  const failedMutations: OfflineMutation[] = []

  // Drain queue sequentially
  for (const mutation of queue) {
    try {
      if (mutation.action === 'INSERT') {
        // Use UPSERT for idempotency. If network dropped after successful insert but before 200 OK, 
        // a retry with INSERT would throw unique constraint error. UPSERT safely ignores/overwrites.
        const { error } = await supabase.from(mutation.table).upsert(mutation.payload)
        if (error) throw error
      } else if (mutation.action === 'UPDATE' && mutation.matchField && mutation.matchValue) {
        const { error } = await supabase
          .from(mutation.table)
          .update(mutation.payload)
          .eq(mutation.matchField, mutation.matchValue)
        if (error) throw error
      } else if (mutation.action === 'DELETE' && mutation.matchField && mutation.matchValue) {
        const { error } = await supabase
          .from(mutation.table)
          .delete()
          .eq(mutation.matchField, mutation.matchValue)
        if (error) throw error
      }
      successCount++
    } catch (error) {
      logger.error('Failed to sync mutation', error, { mutation })
      failedMutations.push(mutation)
    }
  }

  // Update queue with only the failed mutations
  await set(IDB_MUTATION_QUEUE_KEY, failedMutations)

  if (successCount > 0) {
    toast.success(`Synced ${successCount} offline changes to cloud`)
  }

  // Exponential Backoff for failed mutations
  if (failedMutations.length > 0 && retryCount < 5) {
    const backoffTime = Math.pow(2, retryCount) * 1000 // 1s, 2s, 4s, 8s, 16s
    logger.warn(`Retrying failed mutations`, { count: failedMutations.length, backoffTime })
    setTimeout(() => {
      syncOfflineMutations(retryCount + 1)
    }, backoffTime)
  } else if (failedMutations.length > 0) {
    logger.error(`Max retries reached. Mutations stuck in dead-letter queue.`, null, { count: failedMutations.length })
    toast.error('Some offline changes failed to sync. We will try again later.')
  }
}

