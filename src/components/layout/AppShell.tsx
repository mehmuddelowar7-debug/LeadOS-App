import { Outlet } from "react-router"
import { BottomNav } from "./BottomNav"
import { NavRail } from "./NavRail"
import { Sidebar } from "./Sidebar"
import { GlobalCommandPalette } from '@/features/search/components/GlobalCommandPalette'
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { useSearchStore } from "@/hooks/useSearchStore"
import { GlobalAssistant } from "@/features/ai"
import { FEATURES } from '@/config/featureFlags'


export function AppShell() {
  const isOpen = useSearchStore(state => state.isOpen)
  const closeSearch = useSearchStore(state => state.closeSearch)
  // Theme is locked to dark in ThemeProvider
  useKeyboardShortcuts()

  return (
    <div className="min-h-[100dvh] bg-background flex safe-top">
      {/* Navigation Layer */}
      <Sidebar />
      <NavRail />
      <BottomNav />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 w-full md:w-auto md:ml-20 lg:ml-64 transition-all duration-300">
        <div className="flex-1 flex flex-col min-h-0 relative">
          <div className="max-w-7xl mx-auto w-full h-full flex-1 flex flex-col min-h-0 relative">
            <Outlet />
          </div>
        {/* Global Command Palette */}
        <GlobalCommandPalette open={isOpen} onClose={closeSearch} />
        
        {/* Global AI Assistant — only rendered when VITE_ENABLE_AI=true */}
        {FEATURES.AI_ENABLED && <GlobalAssistant />}
        </div>
      </main>
    </div>
  )
}
