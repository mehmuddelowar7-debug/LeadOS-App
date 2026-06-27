import { Outlet, useLocation } from "react-router"
import { DailyPriorityQueueView } from "./DailyPriorityQueueView"
import { cn } from "@/lib/utils"

export function QueueLayout() {
  const location = useLocation()
  
  const isDetailView = location.pathname.split('/').filter(Boolean).length > 1

  return (
    <div className="flex w-full h-full">
      {/* Master List Pane */}
      <div 
        className={cn(
          "w-full md:w-[350px] lg:w-[400px] h-full flex-shrink-0 border-r border-border/50",
          isDetailView ? "hidden md:block" : "block"
        )}
      >
        <DailyPriorityQueueView />
      </div>

      {/* Detail Pane */}
      <div 
        className={cn(
          "flex-1 h-full bg-background overflow-y-auto",
          isDetailView ? "block" : "hidden md:block"
        )}
      >
        <div className="max-w-4xl mx-auto w-full h-full p-4 lg:p-8">
          {isDetailView ? (
            <Outlet />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <p>Select a task to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
