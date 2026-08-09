import { LayoutDashboard, Users, Columns3, Megaphone, User } from 'lucide-react'
import { ROUTES } from '@/lib/routes'

export const NAV_ITEMS = [
  { path: ROUTES.HOME,      label: 'Home',       icon: LayoutDashboard },
  { path: ROUTES.PIPELINE,  label: 'Pipeline',   icon: Columns3 },
  { path: ROUTES.CONTACTS,  label: 'Candidates', icon: Users },
  { path: ROUTES.MARKETING, label: 'Marketing',  icon: Megaphone },
  { path: ROUTES.PROFILE,   label: 'Profile',    icon: User },
]
