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
import { InsightsView } from "@/features/dashboard/InsightsView"
import { ContactEntryView } from "@/features/contacts/ContactEntryView"
import { QueueLayout } from "@/features/followups/QueueLayout"
import { NetworkProvider } from "@/components/providers/NetworkProvider"
import { ContactProfileView } from "@/features/contacts/ContactProfileView"
import { ROUTES } from "@/lib/routes"
import { NotFoundRedirect } from "@/components/layout/NotFoundRedirect"
import { RouteErrorBoundary } from "@/components/providers/RouteErrorBoundary"

// Lazy load non-critical routes
const AnalyticsView = lazy(() => import("@/features/analytics/AnalyticsView").then(m => ({ default: m.AnalyticsView })))
const ProfileView = lazy(() => import("@/features/profile/ProfileView").then(m => ({ default: m.ProfileView })))
const IncentiveTrackerView = lazy(() => import("@/features/incentives/IncentiveTrackerView").then(m => ({ default: m.IncentiveTrackerView })))
import { KeepAliveTabs } from "@/components/layout/KeepAliveTabs"
import { RouteTracker } from "@/components/dev/RouteTracker"
import { DashboardView } from "@/features/dashboard/DashboardView"
import { ContactsLayout } from "@/features/contacts/ContactsLayout"
import { ReferralDashboardView } from "@/features/referrals/ReferralDashboardView"
import { SetupScreen } from "@/features/dev/SetupScreen"
import { HealthView } from "@/features/dev/HealthView"
import { PWAUpdater } from "@/components/layout/PWAUpdater"

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
      We encountered a problem loading the latest version of LeadOS. This usually happens if your browser cached an old version during a deployment.
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
  console.log('BOOT TRACE: 4. App mounted');
  const setUser = useAuthStore((state) => state.setUser)
  const [bootState, setBootState] = useState<'pending' | 'ready' | 'setup' | 'error'>('pending')

  useEffect(() => {
    // Run diagnostics silently. If ready, bypass SetupScreen.
    import('@/lib/diagnostics').then(({ runStartupDiagnostics }) => {
      runStartupDiagnostics().then(res => {
        console.log('BOOT TRACE: 7. Startup diagnostics completed', res);
        sessionStorage.removeItem('leadOS_chunk_reload')
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
        
        if (!sessionStorage.getItem('leadOS_chunk_reload')) {
          sessionStorage.setItem('leadOS_chunk_reload', 'true')
          window.location.reload()
        } else {
          sessionStorage.removeItem('leadOS_chunk_reload')
          setBootState('error')
        }
      } else {
        setBootState('error')
      }
    })

    console.log('BOOT TRACE: 6. Auth initialized');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('BOOT TRACE: 6. Auth getSession completed');
      setUser(session?.user ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
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

  console.log('BOOT TRACE: 5. BrowserRouter mounting / Routes created');
  return (
    <ThemeProvider defaultTheme="dark" storageKey="leados-ui-theme">
      <PWAUpdater />
      <RouteErrorBoundary>
        <BrowserRouter>
          <RouteTracker />
          <Routes>
            <Route path={ROUTES.HEALTH} element={<HealthView />} />
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
                  <Route path={ROUTES.HOME} element={<DashboardView />} />
                  <Route path={ROUTES.CONTACTS} element={<ContactsLayout />} />
                  <Route path={ROUTES.REFERRALS} element={<ReferralDashboardView />} />
                  
                  <Route path={ROUTES.INSIGHTS} element={<InsightsView />} />
                  <Route path={ROUTES.CONTACTS_NEW} element={<ContactEntryView />} />
                  <Route path={ROUTES.QUEUE} element={<QueueLayout />}>
                    <Route path="calls" element={<div className="p-4">Call Queue</div>} />
                    <Route path="whatsapp" element={<div className="p-4">WhatsApp Queue</div>} />
                    <Route path="pending" element={<div className="p-4">Pending Sync</div>} />
                  </Route>
                  <Route path={ROUTES.ANALYTICS} element={<AnalyticsView />} />
                  <Route path={ROUTES.PROFILE} element={<ProfileView />} />
                  <Route path={ROUTES.INCENTIVES} element={<IncentiveTrackerView />} />
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
