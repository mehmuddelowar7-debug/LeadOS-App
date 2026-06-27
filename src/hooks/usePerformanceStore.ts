import { create } from 'zustand'

export interface SlowComponent {
  name: string
  renderTime: number
  mountTime: number
  reRenderCount: number
}

interface PerformanceState {
  currentScreen: string
  lastNavTime: number
  slowestComponents: SlowComponent[]
  offlineQueueLength: number
  
  // React Query Cache
  queryCacheHits: number
  queryNetworkHits: number
  lastQueryDuration: number
  
  // IDB
  lastIdbReadTime: number
  lastIdbWriteTime: number
  idbHydrationTime: number
  
  // Supabase
  lastSupabaseTime: number
  supabaseRequests: { endpoint: string, duration: number, reqSize: number, resSize: number }[]
  
  // Render
  renderReasons: { [component: string]: string[] }
  
  // Web Vitals
  fps: number
  longTasks: { duration: number, source: string, timestamp: number }[]
  firstPaint: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  
  // Memory
  memoryUsage: number
  heapGrowth: number
  
  // Setters
  setCurrentScreen: (screen: string) => void
  setLastNavTime: (time: number) => void
  recordSlowComponent: (name: string, renderTime: number, phase: string) => void
  setOfflineQueueLength: (len: number) => void
  
  recordQuery: (type: 'cache' | 'network', duration: number) => void
  setIdbMetrics: (type: 'read' | 'write' | 'hydration', time: number) => void
  recordSupabaseRequest: (endpoint: string, duration: number, reqSize: number, resSize: number) => void
  recordRenderReason: (component: string, reason: string) => void
  
  setFps: (fps: number) => void
  addLongTask: (duration: number, source: string, timestamp: number) => void
  setWebVital: (name: 'fp' | 'fcp' | 'lcp', value: number) => void
  
  updateMemoryUsage: () => void
  getJsonReport: () => string
}

export const usePerformanceStore = create<PerformanceState>((set, get) => ({
  currentScreen: 'Home',
  lastNavTime: 0,
  slowestComponents: [],
  offlineQueueLength: 0,
  
  queryCacheHits: 0,
  queryNetworkHits: 0,
  lastQueryDuration: 0,
  
  lastIdbReadTime: 0,
  lastIdbWriteTime: 0,
  idbHydrationTime: 0,
  
  lastSupabaseTime: 0,
  supabaseRequests: [],
  
  renderReasons: {},
  
  fps: 60,
  longTasks: [],
  firstPaint: 0,
  firstContentfulPaint: 0,
  largestContentfulPaint: 0,
  
  memoryUsage: 0,
  heapGrowth: 0,

  setCurrentScreen: (screen) => set({ currentScreen: screen }),
  setLastNavTime: (time) => set({ lastNavTime: time }),
  recordSlowComponent: (name, time, phase) => set((state) => {
    if (time <= 16) return state
    const existing = state.slowestComponents.find(c => c.name === name)
    let newArray = [...state.slowestComponents]
    if (existing) {
      newArray = newArray.map(c => c.name === name ? {
        ...c,
        renderTime: Math.max(c.renderTime, time),
        reRenderCount: phase === 'update' ? c.reRenderCount + 1 : c.reRenderCount
      } : c)
    } else {
      newArray.push({
        name,
        renderTime: time,
        mountTime: phase === 'mount' ? time : 0,
        reRenderCount: phase === 'update' ? 1 : 0
      })
    }
    newArray.sort((a, b) => b.renderTime - a.renderTime)
    if (newArray.length > 10) newArray = newArray.slice(0, 10)
    return { slowestComponents: newArray }
  }),
  setOfflineQueueLength: (len) => set({ offlineQueueLength: len }),
  
  recordQuery: (type, duration) => set(state => ({
    queryCacheHits: type === 'cache' ? state.queryCacheHits + 1 : state.queryCacheHits,
    queryNetworkHits: type === 'network' ? state.queryNetworkHits + 1 : state.queryNetworkHits,
    lastQueryDuration: duration
  })),
  
  setIdbMetrics: (type, time) => set(state => ({
    lastIdbReadTime: type === 'read' ? time : state.lastIdbReadTime,
    lastIdbWriteTime: type === 'write' ? time : state.lastIdbWriteTime,
    idbHydrationTime: type === 'hydration' ? time : state.idbHydrationTime
  })),
  
  recordSupabaseRequest: (endpoint, duration, reqSize, resSize) => set(state => {
    const newReqs = [{ endpoint, duration, reqSize, resSize }, ...state.supabaseRequests].slice(0, 50)
    return { supabaseRequests: newReqs, lastSupabaseTime: duration }
  }),
  
  recordRenderReason: (component, reason) => set(state => {
    const reasons = state.renderReasons[component] || []
    return { renderReasons: { ...state.renderReasons, [component]: [...reasons, reason].slice(-10) } }
  }),
  
  setFps: (fps) => set({ fps }),
  
  addLongTask: (duration, source, timestamp) => set(state => ({
    longTasks: [{ duration, source, timestamp }, ...state.longTasks].slice(0, 20)
  })),
  
  setWebVital: (name, value) => set(state => ({
    firstPaint: name === 'fp' ? value : state.firstPaint,
    firstContentfulPaint: name === 'fcp' ? value : state.firstContentfulPaint,
    largestContentfulPaint: name === 'lcp' ? value : state.largestContentfulPaint
  })),
  
  updateMemoryUsage: () => {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const current = (performance as any).memory.usedJSHeapSize / (1024 * 1024)
      set(state => ({
        memoryUsage: current,
        heapGrowth: state.memoryUsage ? current - state.memoryUsage : 0
      }))
    }
  },
  
  getJsonReport: () => {
    return JSON.stringify(get(), null, 2)
  }
}))
