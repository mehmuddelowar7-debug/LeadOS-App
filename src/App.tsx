import { useEffect, lazy, Suspense, useState } from "react"
import { BrowserRouter, Routes, Route } from "react-router"
import { Loader2 } from "lucide-react"
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
  <div className="h-full w-full flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
  </div>
)

function App() {
  const setUser = useAuthStore((state) => state.setUser)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [setUser])

  if (!isReady) {
    return <SetupScreen onComplete={() => setIsReady(true)} />
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="leados-ui-theme">
      <PWAUpdater />
      <BrowserRouter>
        <RouteTracker />
        <Routes>
          <Route path="/health" element={<HealthView />} />
          <Route path="/auth" element={<LoginView />} />

          <Route element={<ProtectedRoute />}>
            <Route element={
              <NetworkProvider>
                <Suspense fallback={<PageLoader />}>
                  <AppShell />
                </Suspense>
              </NetworkProvider>
            }>
              <Route element={<KeepAliveTabs />}>
                <Route path="/" element={<DashboardView />} />
                <Route path="/contacts" element={<ContactsLayout />} />
                <Route path="/referrals" element={<ReferralDashboardView />} />
                
                <Route path="/insights" element={<InsightsView />} />
                <Route path="/contacts/new" element={<ContactEntryView />} />
                <Route path="/queue" element={<QueueLayout />}>
                  <Route path=":id" element={<ContactProfileView />} />
                </Route>
                <Route path="/analytics" element={<AnalyticsView />} />
                <Route path="/profile" element={<ProfileView />} />
                <Route path="/earnings" element={<IncentiveTrackerView />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </ThemeProvider>
  )
}

export default App
