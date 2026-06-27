import { NavLink } from "react-router"
import { cn } from "@/lib/utils"
import { NAV_ITEMS } from "./navItems"
import { Search, Plus, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

export function Sidebar() {
  const { theme, setTheme } = useTheme()
  return (
    <nav className="fixed left-0 top-0 bottom-0 z-50 w-64 hidden lg:flex flex-col py-6 px-4 glass border-r border-border/50">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground shadow-sm">
          L
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">LeadOS</h1>
      </div>

      {/* Global Actions */}
      <div className="space-y-2 mb-8">
        <Button className="w-full justify-start text-muted-foreground bg-muted/50 hover:bg-muted" variant="secondary">
          <Search className="mr-2 h-4 w-4" />
          <span>Search...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
        <Button className="w-full justify-start font-bold">
          <Plus className="mr-2 h-4 w-4" />
          New Contact
        </Button>
      </div>

      {/* Nav Links */}
      <div className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              aria-label={item.label}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-semibold text-sm',
                  isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                  {item.label}
                </>
              )}
            </NavLink>
          )
        })}
      </div>

      {/* Theme Toggle */}
      <div className="mt-auto pt-4 border-t border-border/50">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? (
            <><Sun className="mr-3 h-5 w-5" /> Light Mode</>
          ) : (
            <><Moon className="mr-3 h-5 w-5" /> Dark Mode</>
          )}
        </Button>
      </div>
    </nav>
  )
}
