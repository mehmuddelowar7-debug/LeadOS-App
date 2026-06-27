import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder')
)

import { usePerformanceStore } from '@/hooks/usePerformanceStore'
import { IS_PERF_MODE } from '@/components/dev/PerformanceProfiler'

const customFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
  const start = IS_PERF_MODE ? performance.now() : 0
  
  // Calculate request size
  let reqSize = 0
  if (IS_PERF_MODE && options?.body) {
    reqSize = typeof options.body === 'string' ? new Blob([options.body]).size : 0
  }

  const res = await fetch(url, options)
  
  if (IS_PERF_MODE) {
    const end = performance.now()
    const duration = end - start
    
    // Parse endpoint
    const urlStr = url.toString()
    let endpoint = urlStr
    try {
      const parsedUrl = new URL(urlStr)
      endpoint = parsedUrl.pathname + parsedUrl.search
    } catch (e) {}

    // We can't safely clone and read the body without potentially breaking some streams,
    // so we rely on Content-Length header or fallback to 0.
    const contentLength = res.headers.get('content-length')
    const resSize = contentLength ? parseInt(contentLength, 10) : 0
    
    setTimeout(() => {
      usePerformanceStore.getState().recordSupabaseRequest(endpoint, duration, reqSize, resSize)
    }, 0)
  }
  return res
}

// Provide a dummy client if not configured so the app doesn't crash on import.
// App.tsx will intercept this state and show the setup screen.
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, { global: { fetch: customFetch } }) 
  : createClient('https://unconfigured.supabase.co', 'dummy.key.unconfigured')
