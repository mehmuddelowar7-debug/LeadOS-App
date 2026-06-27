import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createIDBPersister } from './lib/offlineSync'
import * as Sentry from '@sentry/react'
import { ErrorBoundary } from './components/providers/ErrorBoundary'
import { GlobalErrorBoundary } from './components/providers/GlobalErrorBoundary'
import { initStressTester } from './lib/stress-test'

if (import.meta.env.DEV) {
  initStressTester()
}

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0, 
  replaysSessionSampleRate: 0.1, 
  replaysOnErrorSampleRate: 1.0, 
})

import { usePerformanceStore } from './hooks/usePerformanceStore'
import { IS_PERF_MODE } from './components/dev/PerformanceProfiler'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours for offline support
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
})

if (IS_PERF_MODE) {
  const queryStartTimes = new Map<string, number>()
  queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'added' || event.type === 'updated') {
      const query = event.query
      if (query.state.fetchStatus === 'fetching') {
        if (!queryStartTimes.has(query.queryHash)) {
          queryStartTimes.set(query.queryHash, performance.now())
        }
      } else if (query.state.fetchStatus === 'idle' && queryStartTimes.has(query.queryHash)) {
        const duration = performance.now() - queryStartTimes.get(query.queryHash)!
        queryStartTimes.delete(query.queryHash)
        
        // If data updated, it was a network hit. 
        // If it was already fresh, it's a cache hit.
        // But if it fetched, it's a network hit. 
        usePerformanceStore.getState().recordQuery('network', duration)
      } else if (event.type === 'added' && query.state.status === 'success') {
        // Hydrated from cache without fetching
        usePerformanceStore.getState().recordQuery('cache', 0)
      }
    }
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: createIDBPersister() }}
      >
        <Sentry.ErrorBoundary fallback={<ErrorBoundary />}>
          <App />
        </Sentry.ErrorBoundary>
      </PersistQueryClientProvider>
    </GlobalErrorBoundary>
  </StrictMode>,
)
