import { useEffect, lazy, Suspense, useState } from "react"
import { BrowserRouter, Routes, Route } from "react-router"
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react"
import { ThemeProvider } from "@/components/theme-provider"
import { AppShell } from "@/components/layout/AppShell"
import { Toaster } from "@/components/ui/sonner"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/features/auth/AuthStore"
import { LoginView } from "@/features/auth/LoginView"
import { ProtectedRoute } from "@/features/auth/ProtectedRoute"
import { ContactEntryView } from "@/features/contacts/ContactEntryView"
import { NetworkProvider } from "@/components/providers/NetworkProvider"
import { ContactProfileView } from "@/features/contacts/ContactProfileView"
import { ROUTES } from "@/lib/routes"
import { NotFoundRedirect } from "@/components/layout/NotFoundRedirect"
import { RouteErrorBoundary } from "@/components/providers/RouteErrorBoundary"
import { initializeRealtimeBridge } from "@/sdk/events"

// Lazy load non-critical routes
const AnalyticsView = lazy(() => import("@/features/analytics/AnalyticsView").then(m => ({ default: m.AnalyticsView })))
const ProfileView = lazy(() => import("@/features/profile/ProfileView").then(m => ({ default: m.ProfileView })))
import { KeepAliveTabs } from "@/components/layout/KeepAliveTabs"
import { RouteTracker } from "@/components/dev/RouteTracker"
import { OperationsCenterView } from "@/features/operations/OperationsCenterView"
import { ContactsLayout } from "@/features/contacts/ContactsLayout"
import { SetupScreen } from "@/features/dev/SetupScreen"
import { HealthView } from "@/features/dev/HealthView"
import { PWAUpdater } from "@/components/layout/PWAUpdater"
import { SystemHealthView } from "@/features/dev/SystemHealthView"

import { PipelineLayout } from "@/features/pipeline/PipelineLayout"
import { MarketingLayout } from "@/features/marketing/components/MarketingLayout"
import { MarketingHomeView } from "@/features/marketing/MarketingHomeView"
import { MarketingSourceView } from "@/features/marketing/MarketingSourceView"
import { MarketingCampaignView } from "@/features/marketing/MarketingCampaignView"
import { MarketingCreativeView } from "@/features/marketing/MarketingCreativeView"
import { MarketingImportsView } from "@/features/marketing/MarketingImportsView"

// Marketing modules are imported at top

// Loading Fallback
const PageLoader = () => (
  <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
  </div>
)

const ChunkErrorScreen = () => (
  <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-background text-foreground p-6 text-center">
    <AlertTriangle className="h-12 w-12 text-destructive mb-6" />
    <h1 className="text-2xl font-bold mb-3">Application Update Error</h1>
    <p className="text-muted-foreground text-sm max-w-md mb-8">
      We encountered a problem loading the latest version of RecruitOS. This usually happens if your browser cached an old version during a deployment.
    </p>
    <button 
      onClick={() => {
        sessionStorage.clear()
        window.location.reload()
      }}
      className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-primary/90 transition-colors"
    >
      <RefreshCw className="h-5 w-5" />
      Force Reload Application
    </button>
  </div>
)

function App() {
  const setUser = useAuthStore((state) => state.setUser)
  const [bootState, setBootState] = useState<'pending' | 'ready' | 'setup' | 'error'>('pending')

  useEffect(() => {
    // Initialize Realtime Bridge for Webhooks
    const cleanupRealtime = initializeRealtimeBridge()

    // Run diagnostics silently. If ready, bypass SetupScreen.
    import('@/lib/diagnostics').then(({ runStartupDiagnostics }) => {
      runStartupDiagnostics().then(res => {
        sessionStorage.removeItem('recruitOS_chunk_reload')
        if (res.isReady) {
          setBootState('ready')
        } else {
          setBootState('setup')
        }
      })
    }).catch((err: Error) => {
      console.error('Failed to load diagnostics module:', err)
      const msg = err.message || ''
      const isChunkError = msg.includes('ChunkLoadError') || 
                           msg.includes('Failed to fetch dynamically imported module') || 
                           msg.includes('Loading chunk failed')
                           
      if (isChunkError) {
        import('@sentry/react').then(Sentry => Sentry.captureException(err)).catch(() => {})
        
        if (!sessionStorage.getItem('recruitOS_chunk_reload')) {
          sessionStorage.setItem('recruitOS_chunk_reload', 'true')
          window.location.reload()
        } else {
          sessionStorage.removeItem('recruitOS_chunk_reload')
          setBootState('error')
        }
      } else {
        setBootState('error')
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
      cleanupRealtime()
    }
  }, [setUser])

  if (bootState === 'pending') {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="leados-ui-theme">
        <PageLoader />
      </ThemeProvider>
    )
  }

  if (bootState === 'setup') {
    return <SetupScreen onComplete={() => setBootState('ready')} />
  }

  if (bootState === 'error') {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="leados-ui-theme">
        <ChunkErrorScreen />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="leados-ui-theme">
      <PWAUpdater />
      <RouteErrorBoundary>
        <BrowserRouter>
          <RouteTracker />
          <Routes>
            <Route path={ROUTES.HEALTH} element={<HealthView />} />
            <Route path={ROUTES.SYSTEM} element={<SystemHealthView />} />
            <Route path={ROUTES.AUTH} element={<LoginView />} />

            <Route element={<ProtectedRoute />}>
              <Route element={
                <NetworkProvider>
                  <Suspense fallback={<PageLoader />}>
                    <AppShell />
                  </Suspense>
                </NetworkProvider>
              }>
                <Route element={<KeepAliveTabs />}>
                  {/* ── Core Routes ── */}
                  <Route path={ROUTES.HOME} element={<OperationsCenterView />} />
                  <Route path={`${ROUTES.PIPELINE}/*`} element={<PipelineLayout />} />
                  <Route path={ROUTES.CONTACTS} element={<ContactsLayout />} />
                  <Route path={ROUTES.MARKETING} element={<MarketingLayout />}>
                    <Route index element={<MarketingHomeView />} />
                    <Route path="imports" element={<MarketingImportsView />} />
                    <Route path="sources/:id" element={<MarketingSourceView />} />
                    <Route path="campaigns/:id" element={<MarketingCampaignView />} />
                    <Route path="creatives/:id" element={<MarketingCreativeView />} />
                  </Route>
                  <Route path={ROUTES.PROFILE} element={<ProfileView />} />

                  {/* ── Secondary Routes ── */}
                  <Route path={ROUTES.CONTACTS_NEW} element={<ContactEntryView />} />
                  <Route path={ROUTES.QUICK_CAPTURE} element={<ContactEntryView />} />
                  <Route path={ROUTES.ANALYTICS} element={<AnalyticsView />} />
                  <Route path={ROUTES.CONTACT_DETAILS} element={<ContactProfileView />} />


                </Route>
              </Route>
            </Route>

            {/* Catch-all route to guarantee no blank screens */}
            <Route path="*" element={<NotFoundRedirect />} />
          </Routes>
        </BrowserRouter>
      </RouteErrorBoundary>
      <Toaster position="top-center" richColors />
    </ThemeProvider>
  )
}

export default App
