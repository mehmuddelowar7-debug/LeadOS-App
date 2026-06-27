import { LayoutDashboard, Users, Clock, LineChart, Award } from 'lucide-react'

export const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: LayoutDashboard },
  { path: '/contacts', label: 'Network', icon: Users },
  { path: '/queue', label: 'Tasks', icon: Clock },
  { path: '/referrals', label: 'Referrals', icon: Award },
  { path: '/insights', label: 'Insights', icon: LineChart },
]
