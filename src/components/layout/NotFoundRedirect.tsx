import { Navigate } from 'react-router';
import { useAuthStore } from '@/features/auth/AuthStore';
import { ROUTES } from '@/lib/routes';

export function NotFoundRedirect() {
  const user = useAuthStore(state => state.user);
  
  if (user) {
    return <Navigate to={ROUTES.HOME} replace />;
  }
  
  return <Navigate to={ROUTES.AUTH} replace />;
}
