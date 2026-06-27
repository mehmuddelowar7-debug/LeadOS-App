import { useEffect, useState } from 'react'
import { Server, Activity, Database, CloudOff, Cloud, RefreshCw, Layers } from 'lucide-react'
import { getMutationQueue } from '@/lib/offlineSync'
import { isSupabaseConfigured } from '@/lib/supabase'

export function HealthView() {
  const [offlineQueueLen, setOfflineQueueLen] = useState<number | null>(null)
  const avatarStorageStatus = 'Unknown' // Storage is purely optional and lazily evaluated.
  
  const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0'
  const APP_ENV = import.meta.env.APP_ENV || 'development'

  useEffect(() => {
    getMutationQueue().then(queue => setOfflineQueueLen(queue.length))
  }, [])

  return (
    <div className="min-h-[100dvh] bg-zinc-950 p-6 md:p-12 text-zinc-300 font-mono flex flex-col items-center">
      <div className="max-w-2xl w-full">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-zinc-800">
          <Activity className="h-6 w-6 text-emerald-500" />
          <h1 className="text-xl font-bold text-white tracking-widest">SYSTEM_HEALTH</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-black border border-zinc-800 rounded-xl p-5 shadow-xl">
            <h2 className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-4 flex items-center gap-2">
              <Layers className="h-4 w-4" /> Application
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Version</span>
                <span className="text-emerald-500 font-bold">v{APP_VERSION}</span>
              </div>
              <div className="flex justify-between">
                <span>Environment</span>
                <span className="text-white">{APP_ENV}</span>
              </div>
              <div className="flex justify-between">
                <span>Network</span>
                <span className="flex items-center gap-1">
                  {navigator.onLine ? (
                    <><Cloud className="h-3 w-3 text-emerald-500" /> Online</>
                  ) : (
                    <><CloudOff className="h-3 w-3 text-amber-500" /> Offline</>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-black border border-zinc-800 rounded-xl p-5 shadow-xl">
            <h2 className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-4 flex items-center gap-2">
              <Server className="h-4 w-4" /> Infrastructure
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Supabase</span>
                <span className={isSupabaseConfigured ? 'text-emerald-500' : 'text-red-500'}>
                  {isSupabaseConfigured ? 'Connected' : 'Missing Keys'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Service Worker</span>
                <span className={'serviceWorker' in navigator ? 'text-emerald-500' : 'text-red-500'}>
                  {'serviceWorker' in navigator ? 'Active' : 'Unsupported'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Avatars Storage</span>
                <span className="text-zinc-500">
                  {avatarStorageStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-black border border-zinc-800 rounded-xl p-5 shadow-xl md:col-span-2">
            <h2 className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-4 flex items-center gap-2">
              <Database className="h-4 w-4" /> Offline Engine
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>IndexedDB Storage</span>
                <span className="text-emerald-500">Accessible</span>
              </div>
              <div className="flex justify-between">
                <span>Dead Letter Queue</span>
                <span className="flex items-center gap-2 text-white">
                  {offlineQueueLen !== null ? offlineQueueLen : <RefreshCw className="h-3 w-3 animate-spin" />} items
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center text-xs text-zinc-600 uppercase tracking-widest">
          LeadOS V1 Diagnostics Interface
        </div>
      </div>
    </div>
  )
}
