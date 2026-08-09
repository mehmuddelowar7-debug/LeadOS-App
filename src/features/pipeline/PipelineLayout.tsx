import { Routes, Route, useLocation } from "react-router"
import { PipelineView } from "./PipelineView"
import { ContactProfileView } from "@/features/contacts/ContactProfileView"
import { cn } from "@/lib/utils"
import { ComponentErrorBoundary } from '@/components/providers/ComponentErrorBoundary'

export function PipelineLayout() {
  const location = useLocation()
  
  // URL matching /pipeline/:id
  const isDetailView = location.pathname.split('/').filter(Boolean).length > 1

  return (
    <ComponentErrorBoundary fallbackMessage="Failed to load Pipeline.">
      <div className="flex w-full h-full bg-background overflow-hidden relative">
        {/* Master Board Pane - Always visible on desktop, hidden on mobile if detail is open */}
        <div 
          className={cn(
            "h-full flex-shrink-0 transition-all duration-300 ease-in-out",
            isDetailView ? "hidden lg:block lg:w-[60%] xl:w-[70%] border-r border-border/50" : "w-full block"
          )}
        >
          <PipelineView activeContactId={isDetailView ? location.pathname.split('/').pop() || null : null} />
        </div>

        {/* Detail Pane - Right side slide-over/panel style on desktop */}
        <div 
          className={cn(
            "h-full bg-background overflow-y-auto shadow-xl z-10",
            isDetailView ? "w-full lg:w-[40%] xl:w-[30%] block" : "hidden"
          )}
        >
          {isDetailView && (
            <Routes>
              <Route path="/:id" element={<ContactProfileView />} />
            </Routes>
          )}
        </div>
      </div>
    </ComponentErrorBoundary>
  )
}
