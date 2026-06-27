import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { useLocation, Outlet } from 'react-router'
import { DashboardView } from '@/features/dashboard/DashboardView'
import { ContactsLayout } from '@/features/contacts/ContactsLayout'
import { ReferralDashboardView } from '@/features/referrals/ReferralDashboardView'
import { AlertTriangle } from 'lucide-react'

class KeepAliveErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('KeepAliveTabs Runtime Error:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center space-y-4 p-8">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
          <h2 className="text-xl font-bold">Rendering Error</h2>
          <p className="text-muted-foreground text-center">There was a problem rendering the cached view. Falling back to normal routing...</p>
          <Outlet />
        </div>
      )
    }
    return this.props.children
  }
}

function KeepAliveTabsInner() {
  const location = useLocation()
  const path = location.pathname

  const isHomeActive = path === '/'
  const isContactsActive = path.startsWith('/contacts') && path !== '/contacts/new'
  const isReferralsActive = path === '/referrals'

  const isMainTab = isHomeActive || isContactsActive || isReferralsActive

  return (
    <>
      <div className={isHomeActive ? 'block h-full w-full' : 'hidden'}>
        <DashboardView />
      </div>
      <div className={isContactsActive ? 'block h-full w-full' : 'hidden'}>
        <ContactsLayout />
      </div>
      <div className={isReferralsActive ? 'block h-full w-full' : 'hidden'}>
        <ReferralDashboardView />
      </div>

      {!isMainTab && (
        <div className="block h-full w-full">
          <Outlet />
        </div>
      )}
    </>
  )
}

export function KeepAliveTabs() {
  return (
    <KeepAliveErrorBoundary>
      <KeepAliveTabsInner />
    </KeepAliveErrorBoundary>
  )
}
