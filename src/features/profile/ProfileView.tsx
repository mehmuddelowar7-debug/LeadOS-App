import { motion } from 'framer-motion'
import { useAppNavigate } from '@/lib/routes'
import {
  Sun, Moon, LogOut, ChevronRight, Shield, Bell,
  Download, Trophy, Zap, Flame, Target, BrainCircuit, Bug
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useTheme } from '@/components/theme-provider'
import { useAuthStore } from '@/features/auth/AuthStore'
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { BugReportSheet } from './BugReportSheet'
import { DataManagementSheet } from './DataManagementSheet'
import { useState } from 'react'

// Animation variants
// Removed animation variants to reduce UX latency

// ============================================================================
// Level Badge
// ============================================================================
const LEVEL_CONFIG = {
  bronze: { label: 'Bronze', color: 'from-amber-700 to-amber-500', icon: '🥉', min: 0 },
  silver: { label: 'Silver', color: 'from-gray-400 to-gray-300', icon: '🥈', min: 500 },
  gold: { label: 'Gold', color: 'from-yellow-500 to-yellow-400', icon: '🥇', min: 2000 },
  diamond: { label: 'Diamond', color: 'from-cyan-400 to-blue-500', icon: '💎', min: 5000 },
}

// ============================================================================
// Profile View
// ============================================================================
export function ProfileView() {
  const { theme, setTheme } = useTheme()
  const signOut = useAuthStore(state => state.signOut)
  const user = useAuthStore(state => state.user)
  const { data: metrics } = useDashboardMetrics()
  const navigate = useAppNavigate()
  const [bugReportOpen, setBugReportOpen] = useState(false)
  const [dataManagementOpen, setDataManagementOpen] = useState(false)

  const profile = {
    name: user?.user_metadata?.first_name 
            ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim() 
            : 'LeadOS Partner',
    email: user?.email || 'partner@leados.app',
    avatar: null as string | null,
    level: 'silver' as 'bronze' | 'silver' | 'gold' | 'diamond',
    totalPoints: metrics?.contacts.total ? metrics.contacts.total * 10 : 0,
    currentStreak: 1,
    longestStreak: 1,
    dailyTarget: 10,
    dailyCompleted: metrics?.mission.walkinsToday || 0,
    monthlyEarnings: metrics?.referrals.paid ? metrics.referrals.paid * 5000 : 0,
    monthlyConversion: metrics?.contacts.total ? Math.round((metrics.contacts.active / metrics.contacts.total) * 100) : 0,
    totalLeads: metrics?.contacts.total || 0,
    badges: ['🎯 First Lead', '🔥 5-Day Streak', '⭐ 50 Leads', '📞 100 Calls'],
  }

  const levelConfig = LEVEL_CONFIG[profile.level]
  const nextLevel = profile.level === 'bronze' ? LEVEL_CONFIG.silver : profile.level === 'silver' ? LEVEL_CONFIG.gold : LEVEL_CONFIG.diamond
  const progressToNext = ((profile.totalPoints - LEVEL_CONFIG[profile.level].min) / (nextLevel.min - LEVEL_CONFIG[profile.level].min)) * 100

  const menuItems = [
    { icon: BrainCircuit, label: 'Intelligence Engine', onClick: () => navigate('/analytics') },
    { icon: Bell, label: 'Notifications', onClick: () => {} },
    { icon: Bug, label: 'Report Issue', onClick: () => setBugReportOpen(true) },
    { icon: Shield, label: 'Privacy & Security', onClick: () => {} },
    { icon: Download, label: 'Data Management (Import/Export)', onClick: () => setDataManagementOpen(true) },
    {
      icon: theme === 'dark' ? Sun : Moon,
      label: theme === 'dark' ? 'Light Mode' : 'Dark Mode',
      onClick: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    },
  ]

  return (
    <div className="space-y-6 pb-24 h-full flex flex-col px-4 pt-4 md:px-6 lg:px-8">
      {/* Profile Card */}
      <div className="glass-card rounded-2xl p-5 text-center">
        <Avatar className="h-20 w-20 mx-auto ring-4 ring-primary/20">
          <AvatarImage src={profile.avatar ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
            {profile.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-lg font-bold text-foreground mt-3">{profile.name}</h2>
        <p className="text-sm text-muted-foreground">{profile.email}</p>

        {/* Level Badge */}
        <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r text-white text-sm font-semibold"
          style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to))` }}
        >
          <span className={`bg-gradient-to-r ${levelConfig.color} bg-clip-text text-transparent`}>
            {levelConfig.icon} {levelConfig.label}
          </span>
        </div>

        {/* Level Progress */}
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{profile.totalPoints} pts</span>
            <span>{nextLevel.min} pts to {nextLevel.label}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressToNext, 100)}%` }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Target, label: 'Daily Target', value: `${profile.dailyCompleted}/${profile.dailyTarget}`, color: 'text-violet-500 bg-violet-500/10' },
          { icon: Flame, label: 'Current Streak', value: `${profile.currentStreak} days`, color: 'text-orange-500 bg-orange-500/10' },
          { icon: Trophy, label: 'Monthly Earnings', value: `₹${profile.monthlyEarnings.toLocaleString()}`, color: 'text-emerald-500 bg-emerald-500/10' },
          { icon: Zap, label: 'Conversion Rate', value: `${profile.monthlyConversion}%`, color: 'text-amber-500 bg-amber-500/10' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card rounded-xl p-3">
            <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center mb-2', stat.color)}>
              <stat.icon className="h-4 w-4" />
            </div>
            <div className="text-lg font-bold text-foreground">{stat.value}</div>
            <div className="text-[10px] text-muted-foreground font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Badges</h3>
        <div className="flex flex-wrap gap-2">
          {profile.badges.map((badge) => (
            <span key={badge} className="px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-foreground">
              {badge}
            </span>
          ))}
        </div>
      </div>

      <Separator />

      {/* Settings Menu */}
      <div className="space-y-1">
        {menuItems.map((menuItem) => (
          <button
            key={menuItem.label}
            onClick={menuItem.onClick}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors touch-target"
          >
            <menuItem.icon className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground text-left">{menuItem.label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <Separator />

      {/* Sign Out */}
      <div>
        <Button
          variant="ghost"
          className="w-full h-12 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-500/10"
          onClick={async () => {
            await signOut()
            navigate('/login')
          }}
        >
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>

      {/* App Info */}
      <div className="pt-4 pb-2 text-center">
        <p className="text-[10px] text-muted-foreground font-mono">
          LeadOS v{__APP_VERSION__} • {import.meta.env.PROD ? 'Production' : 'Development'}
        </p>
      </div>

      <BugReportSheet open={bugReportOpen} onOpenChange={setBugReportOpen} />
      <DataManagementSheet open={dataManagementOpen} onOpenChange={setDataManagementOpen} />
    </div>
  )
}
