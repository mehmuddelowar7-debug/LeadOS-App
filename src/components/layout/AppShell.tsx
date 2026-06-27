import { Outlet } from "react-router"
import { BottomNav } from "./BottomNav"
import { NavRail } from "./NavRail"
import { Sidebar } from "./Sidebar"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { GlobalSearch } from "@/components/shared/GlobalSearch"
import { useSearchStore } from "@/hooks/useSearchStore"
import { useTheme } from "@/components/theme-provider"
import { Sun, Moon } from "lucide-react"

export function AppShell() {
  const isOpen = useSearchStore(state => state.isOpen)
  const closeSearch = useSearchStore(state => state.closeSearch)
  const { theme, setTheme } = useTheme()
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
        </div>
      </main>
      {/* Mobile Theme Toggle */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="md:hidden fixed top-4 right-[4.5rem] z-[60] h-12 w-12 glass-card border border-border/50 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all shadow-sm"
        aria-label="Toggle Theme"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <GlobalSearch open={isOpen} onClose={closeSearch} />
    </div>
  )
}
