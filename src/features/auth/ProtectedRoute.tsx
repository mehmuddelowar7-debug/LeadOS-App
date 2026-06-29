import { Navigate, Outlet } from "react-router"
import { useAuthStore } from "./AuthStore"
import { ROUTES } from "@/lib/routes"

export function ProtectedRoute() {
  const { user, isLoading } = useAuthStore()



  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to={ROUTES.AUTH} replace />
  }

  return <Outlet />
}
