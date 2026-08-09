import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { env } from '@/config/env'

if (env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Tracing
    tracesSampleRate: 1.0, 
    // Session Replay
    replaysSessionSampleRate: 0.1, 
    replaysOnErrorSampleRate: 1.0, 
  })
}

const root = document.getElementById('root')!

if (window.location.pathname === '/ping') {
  createRoot(root).render(
    <div style={{ color: 'white', background: 'black', padding: '20px', fontFamily: 'monospace' }}>
      LeadOS Debug OK
    </div>
  )
} else if (window.location.pathname === '/debug') {
  import('./features/dev/DebugView').then(m => {
    createRoot(root).render(<m.DebugView />)
  }).catch(e => {
    console.error('DebugView load failed', e)
    root.innerHTML = `<div style="color:red; background:black; padding:20px;">Failed to load DebugView: ${e.message}</div>`
  })
} else {
  // Dynamically load the rest of the app to isolate the main.tsx entrypoint
  import('./bootstrap').then(m => {
    m.renderApp(root)
  }).catch(e => {
    console.error('Bootstrap load failed', e)
    root.innerHTML = `<div style="color:red; background:black; padding:20px;">Failed to boot application chunk: ${e.message}</div>`
  })
}
