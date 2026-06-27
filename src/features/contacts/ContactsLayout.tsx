import { Routes, Route, useLocation } from "react-router"
import { ContactsView } from "./ContactsView"
import { ContactProfileView } from "./ContactProfileView"
import { cn } from "@/lib/utils"

export function ContactsLayout() {
  const location = useLocation()
  
  // If the user is on exactly '/contacts', we show the list.
  // If they are on '/contacts/:id', we show both on tablet/desktop, but ONLY the detail on mobile.
  const isDetailView = location.pathname.split('/').filter(Boolean).length > 1 && !location.pathname.endsWith('/new')

  return (
    <div className="flex w-full h-full">
      {/* Master List Pane */}
      <div 
        className={cn(
          "w-full md:w-[350px] lg:w-[400px] h-full flex-shrink-0 border-r border-border/50",
          isDetailView ? "hidden md:block" : "block"
        )}
      >
        <ContactsView />
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
            <Routes>
              <Route path="/contacts/:id" element={<ContactProfileView />} />
            </Routes>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <p>Select a contact to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
