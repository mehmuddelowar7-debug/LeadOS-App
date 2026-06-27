import { useNavigate } from 'react-router';
import type { NavigateOptions, To } from 'react-router';

export const ROUTES = {
  HOME: "/",
  AUTH: "/auth",
  CONTACTS: "/contacts",
  CONTACT_DETAILS: "/contacts/:id", // Use dynamic matching in components, but careful when navigating directly
  CONTACTS_NEW: "/contacts/new",
  REFERRALS: "/referrals",
  INSIGHTS: "/insights",
  PROFILE: "/profile",
  SETTINGS: "/settings",
  ANALYTICS: "/analytics",
  INCENTIVES: "/incentives",
  QUEUE: "/queue",
  QUEUE_CALLS: "/queue/calls",
  QUEUE_WHATSAPP: "/queue/whatsapp",
  QUEUE_PENDING: "/queue/pending",
  HEALTH: "/health"
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = typeof ROUTES[RouteKey];

export function useAppNavigate() {
  const navigate = useNavigate();

  return (to: To | number, options?: NavigateOptions) => {
    if (import.meta.env.DEV) {
      // Basic validation for string routes
      if (typeof to === 'string') {
        // Strip query params and hashes for validation
        const basePath = to.split('?')[0].split('#')[0];
        
        // Ignore external URLs
        if (!to.startsWith('http')) {
          const isValid = Object.values(ROUTES).some(route => {
            // Check exact match
            if (route === basePath) return true;
            // Check dynamic route match (e.g., /contacts/123 matches /contacts/:id)
            if (route.includes(':')) {
              const routeParts = route.split('/');
              const pathParts = basePath.split('/');
              if (routeParts.length !== pathParts.length) return false;
              
              return routeParts.every((part, i) => {
                return part.startsWith(':') || part === pathParts[i];
              });
            }
            // Allow sub-routes to pass if they match a known prefix, 
            // but strict matching is preferred.
            return false;
          });

          if (!isValid) {
            console.warn(
              `[Router Warning] Navigation to unregistered route: "${to}"`,
              new Error().stack
            );
          }
        }
      }
    }
    
    if (typeof to === 'number') {
      return navigate(to);
    }
    
    return navigate(to as any, options)
  };
}
