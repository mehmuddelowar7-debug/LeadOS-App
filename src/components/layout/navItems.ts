import { LayoutDashboard, Users, Clock, LineChart, Award } from 'lucide-react'
import { ROUTES } from '@/lib/routes'

export const NAV_ITEMS = [
  { path: ROUTES.HOME, label: 'Home', icon: LayoutDashboard },
  { path: ROUTES.CONTACTS, label: 'Network', icon: Users },
  { path: ROUTES.QUEUE, label: 'Tasks', icon: Clock },
  { path: ROUTES.REFERRALS, label: 'Referrals', icon: Award },
  { path: ROUTES.INSIGHTS, label: 'Insights', icon: LineChart },
]
