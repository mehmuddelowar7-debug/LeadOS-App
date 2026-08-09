import { ChevronRight } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router'
import { ComponentErrorBoundary } from '@/components/providers/ComponentErrorBoundary'

export function MarketingLayout() {
  const location = useLocation()
  const paths = location.pathname.split('/').filter(Boolean)
  
  // Basic Breadcrumbs generation (Marketing > Sources > ID)
  // This will be expanded as we build the drill-down.
  
  return (
    <ComponentErrorBoundary fallbackMessage="Failed to load Marketing module.">
      <div className="flex-1 overflow-y-auto bg-background/50 h-[calc(100vh-theme(spacing.16))] sm:h-screen pb-20 sm:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
          
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-1 text-sm font-medium text-muted-foreground">
            <Link to="/marketing" className="hover:text-foreground transition-colors">
              Marketing
            </Link>
            
            {paths.length > 1 && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span className="capitalize">{paths[1]}</span>
              </>
            )}
            {paths.length > 2 && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground">{paths[2]}</span>
              </>
            )}
          </nav>

          {/* Dynamic Drill-Down Content */}
          <Outlet />
          
        </div>
      </div>
    </ComponentErrorBoundary>
  )
}
