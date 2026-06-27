import { useEffect, useState } from 'react'
import { usePerformanceStore } from '@/hooks/usePerformanceStore'
import { IS_PERF_MODE } from './PerformanceProfiler'
import { Copy, Activity, Server, Database, BrainCircuit, Minimize2, Clock, Monitor } from 'lucide-react'
import { toast } from 'sonner'
import { useIsFetching } from '@tanstack/react-query'

export function PerformanceDevPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const isFetching = useIsFetching()
  
  const state = usePerformanceStore()

  useEffect(() => {
    if (!IS_PERF_MODE) return
    const interval = setInterval(() => {
      state.updateMemoryUsage()
    }, 2000)
    return () => clearInterval(interval)
  }, [state])

  if (!IS_PERF_MODE) return null

  const getColor = (ms: number) => {
    if (ms < 50) return 'text-emerald-500'
    if (ms < 100) return 'text-amber-500'
    return 'text-red-500'
  }
  
  const getFpsColor = (fps: number) => {
    if (fps >= 55) return 'text-emerald-500'
    if (fps >= 30) return 'text-amber-500'
    return 'text-red-500'
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(state.getJsonReport())
    toast.success('Performance JSON copied to clipboard')
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-[9999] p-3 rounded-full bg-black border border-zinc-800 text-zinc-400 hover:text-white shadow-2xl shadow-black/50"
      >
        <Activity className="h-5 w-5" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-20 right-4 z-[9999] w-[350px] max-h-[80vh] overflow-y-auto scrollbar-hide bg-black/90 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl shadow-black/50 font-mono text-xs pb-4">
      <div className="sticky top-0 flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900/90 z-10">
        <div className="flex items-center gap-2 text-zinc-300 font-bold">
          <Activity className="h-4 w-4 text-emerald-500" />
          PERF DIAGNOSTICS
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopy} className="text-zinc-500 hover:text-white" title="Copy JSON Report">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white">
            <Minimize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      
      <div className="p-3 space-y-2 text-zinc-400">
        <div className="flex justify-between items-center bg-zinc-900/50 p-1.5 rounded">
          <span className="flex items-center gap-1.5"><Monitor className="h-3 w-3" /> FPS</span>
          <span className={`font-bold ${getFpsColor(state.fps)}`}>{state.fps.toFixed(0)}</span>
        </div>
        <div className="flex justify-between">
          <span>Screen</span>
          <span className="text-white font-bold">{state.currentScreen}</span>
        </div>
        <div className="flex justify-between">
          <span>Last Nav</span>
          <span className={`font-bold ${getColor(state.lastNavTime)}`}>{state.lastNavTime.toFixed(1)}ms</span>
        </div>
        
        <div className="text-[10px] text-zinc-500 font-bold mt-3 mb-1 uppercase border-b border-zinc-800 pb-1">Web Vitals</div>
        <div className="flex justify-between">
          <span>First Paint (FP)</span>
          <span className={`font-bold ${getColor(state.firstPaint)}`}>{state.firstPaint.toFixed(1)}ms</span>
        </div>
        <div className="flex justify-between">
          <span>First Contentful Paint (FCP)</span>
          <span className={`font-bold ${getColor(state.firstContentfulPaint)}`}>{state.firstContentfulPaint.toFixed(1)}ms</span>
        </div>
        <div className="flex justify-between">
          <span>Largest Contentful Paint (LCP)</span>
          <span className={`font-bold ${getColor(state.largestContentfulPaint)}`}>{state.largestContentfulPaint.toFixed(1)}ms</span>
        </div>

        <div className="text-[10px] text-zinc-500 font-bold mt-3 mb-1 uppercase border-b border-zinc-800 pb-1">Memory</div>
        <div className="flex justify-between items-center gap-2">
          <span className="flex items-center gap-1.5"><BrainCircuit className="h-3 w-3" /> JS Heap Size</span>
          <span className="text-white">{state.memoryUsage.toFixed(2)} MB</span>
        </div>
        <div className="flex justify-between items-center gap-2">
          <span>Heap Growth</span>
          <span className={state.heapGrowth > 0 ? 'text-red-400' : 'text-emerald-400'}>
            {state.heapGrowth > 0 ? '+' : ''}{state.heapGrowth.toFixed(2)} MB
          </span>
        </div>

        <div className="text-[10px] text-zinc-500 font-bold mt-3 mb-1 uppercase border-b border-zinc-800 pb-1">Network & Cache</div>
        <div className="flex justify-between items-center gap-2">
          <span className="flex items-center gap-1.5"><Server className="h-3 w-3" /> Supabase HTTP</span>
          <span className={`font-bold ${getColor(state.lastSupabaseTime)}`}>{state.lastSupabaseTime.toFixed(1)}ms</span>
        </div>
        <div className="flex justify-between items-center gap-2">
          <span className="flex items-center gap-1.5"><Database className="h-3 w-3" /> IndexedDB Read</span>
          <span className={`font-bold ${getColor(state.lastIdbReadTime)}`}>{state.lastIdbReadTime.toFixed(1)}ms</span>
        </div>
        <div className="flex justify-between items-center gap-2">
          <span className="flex items-center gap-1.5"><Database className="h-3 w-3" /> IndexedDB Write</span>
          <span className={`font-bold ${getColor(state.lastIdbWriteTime)}`}>{state.lastIdbWriteTime.toFixed(1)}ms</span>
        </div>
        <div className="flex justify-between">
          <span>React Query active</span>
          <span className={isFetching > 0 ? 'text-amber-500' : 'text-emerald-500'}>{isFetching}</span>
        </div>
        <div className="flex justify-between">
          <span>Cache Hits / Network Hits</span>
          <span className="text-white">{state.queryCacheHits} / {state.queryNetworkHits}</span>
        </div>
        
      </div>

      {state.longTasks.length > 0 && (
        <div className="border-t border-zinc-800 p-3 bg-red-950/20">
          <div className="text-[10px] text-zinc-500 font-bold mb-2 uppercase flex items-center gap-1">
            <Clock className="h-3 w-3" /> Long Tasks ({'>'}50ms)
          </div>
          <div className="space-y-1.5">
            {state.longTasks.slice(0, 3).map((t, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="truncate pr-2 text-zinc-300 max-w-[150px]">{t.source}</span>
                <span className="font-bold text-red-500">{t.duration.toFixed(1)}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {state.slowestComponents.length > 0 && (
        <div className="border-t border-zinc-800 p-3 bg-zinc-900/50">
          <div className="text-[10px] text-zinc-500 font-bold mb-2 uppercase">Slow Components ({'>'}16ms)</div>
          <div className="space-y-1.5">
            {state.slowestComponents.slice(0, 3).map(c => (
              <div key={c.name} className="flex justify-between items-center">
                <span className="truncate pr-2 text-zinc-300 max-w-[150px]">{c.name} ({c.reRenderCount}x)</span>
                <span className={`font-bold ${getColor(c.renderTime)}`}>{c.renderTime.toFixed(1)}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
