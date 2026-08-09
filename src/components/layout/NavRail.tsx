import { NavLink } from "react-router"
import { cn } from "@/lib/utils"
import { NAV_ITEMS } from "./navItems"


export function NavRail() {
  // Theme locked to dark
  return (
    <nav className="fixed left-0 top-0 bottom-0 z-50 w-20 hidden md:flex lg:hidden flex-col items-center py-4 glass border-r border-border/50">
      <div className="flex-1 flex flex-col items-center gap-6 mt-8">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              aria-label={item.label}
              className={({ isActive }) =>
                cn(
                  'relative flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all',
                  isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("w-6 h-6 mb-1", isActive && "stroke-[2.5px]")} />
                  <span className="text-[10px] font-semibold">{item.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
