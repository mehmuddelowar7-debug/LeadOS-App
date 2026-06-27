import { ROUTES } from '@/lib/routes'
import { useState, useMemo } from 'react'
import { PerformanceProfiler } from '@/components/dev/PerformanceProfiler'
import { useRenderProfiler } from '@/hooks/useRenderProfiler'
import { motion } from 'framer-motion'
import { useAppNavigate } from '@/lib/routes'
import { 
  Plus, Zap, ArrowRight,
  MoonStar, PhoneCall, AlertCircle, Clock
} from 'lucide-react'
import { EndDaySheet } from './EndDaySheet'
import { useAuthStore } from '@/features/auth/AuthStore'
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics'
import { useSearchStore } from '@/hooks/useSearchStore'
import { useContacts } from '@/hooks/useContacts'
import { Loader2, Search as SearchIcon } from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export function DashboardView() {
  const navigate = useAppNavigate()
  const user = useAuthStore(state => state.user)
  const openSearch = useSearchStore(state => state.openSearch)
  const [endDayOpen, setEndDayOpen] = useState(false)

  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics()
  const { data: contacts = [], isLoading: contactsLoading } = useContacts()

  useRenderProfiler('DashboardView', {}, { user, metrics, contacts, endDayOpen })

  const mission = useMemo(() => ({
    target: 10,
    walkins: metrics?.mission.walkinsToday || 0,
    nurtureTasks: metrics?.mission.followupsPending || 0,
  }), [metrics])

  const recentContacts = useMemo(() => {
    return [...contacts]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
  }, [contacts])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  if (metricsLoading || contactsLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    )
  }

  return (
    <PerformanceProfiler id="DashboardView">
      <div className="space-y-6 pb-32 md:pb-8 h-full flex flex-col px-4 pt-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{greeting}, {user?.user_metadata?.first_name || 'Partner'} 👋</h1>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">
            {dayjs().format('dddd, D MMM')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openSearch}
            className="h-12 w-12 rounded-xl flex items-center justify-center bg-muted text-foreground hover:bg-accent transition-colors shadow-sm touch-target"
          >
            <SearchIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-6 px-1">
        
        {/* Today's Mission & KPIs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-primary font-bold mb-2 text-sm">
              <Zap className="h-4 w-4 fill-primary" /> Walk-ins Today
            </div>
            <div className="text-3xl font-black tracking-tighter">
              {mission.walkins} <span className="text-sm text-muted-foreground font-semibold tracking-normal">/ {mission.target}</span>
            </div>
          </div>

          <div 
            onClick={() => navigate('/queue')}
            className="glass-card rounded-2xl p-4 flex flex-col justify-between bg-amber-500/10 border-amber-500/20 active:scale-95 transition-all cursor-pointer touch-target"
          >
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-bold mb-2 text-sm">
              <PhoneCall className="h-4 w-4" /> Follow-ups
            </div>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-black tracking-tighter text-amber-700 dark:text-amber-400">{mission.nurtureTasks}</span>
              <ArrowRight className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>

        {/* High Priority Contacts */}
        {mission.nurtureTasks > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5" /> High Priority
            </h2>
            <div 
              onClick={() => navigate('/queue?filter=urgent')} 
              className="glass-card rounded-2xl p-4 flex items-center justify-between active:scale-95 transition-all cursor-pointer touch-target border-red-500/20"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-foreground truncate">Needs Attention</h3>
                  <p className="text-xs text-muted-foreground truncate">{mission.nurtureTasks} {mission.nurtureTasks === 1 ? 'contact requires' : 'contacts require'} action</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 ml-2" />
            </div>
          </div>
        )}

        {/* Recent Contacts */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" /> Recently Added
          </h2>
          <div className="space-y-2">
            {recentContacts.length > 0 ? recentContacts.map(contact => {
              const initials = contact.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
              return (
                <div 
                  key={contact.id}
                  onClick={() => navigate(`/contacts/${contact.id}`)}
                  className="glass-card rounded-2xl p-4 flex items-center justify-between active:scale-95 transition-all cursor-pointer touch-target"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {contact.photo_url ? (
                      <img src={contact.photo_url} alt={contact.name} className="h-12 w-12 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-foreground truncate">{contact.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">Added {dayjs(contact.created_at).fromNow()}</p>
                    </div>
                  </div>
                </div>
              )
            }) : (
              <div className="glass-card rounded-2xl p-6 text-center">
                <p className="text-sm font-bold text-muted-foreground">No contacts yet.</p>
              </div>
            )}
            
            <button onClick={() => navigate(ROUTES.CONTACTS)} className="w-full h-14 rounded-2xl text-sm font-bold text-primary hover:bg-primary/10 transition-colors touch-target">
              View All Network
            </button>
          </div>
        </div>

        <div className="pt-4 pb-20">
          <button
            onClick={() => setEndDayOpen(true)}
            className="w-full h-14 rounded-2xl flex items-center justify-center bg-muted text-foreground font-bold text-sm hover:bg-accent transition-colors touch-target"
          >
            <MoonStar className="h-5 w-5 mr-2 text-violet-500" /> End Day
          </button>
        </div>
      </div>

      {/* Massive Quick Capture FAB */}
      <div className="fixed-bottom-safe left-4 right-4 md:left-auto md:right-6 md:w-14">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/contacts/new?mode=quick')}
          className="w-full h-16 md:w-14 md:h-14 rounded-2xl md:rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/30 flex items-center justify-center font-black text-xl touch-target"
        >
          <Plus className="h-7 w-7 md:mr-0 mr-2 stroke-[3]" /> <span className="md:hidden">QUICK CAPTURE</span>
        </motion.button>
      </div>

      <EndDaySheet open={endDayOpen} onClose={() => setEndDayOpen(false)} />
    </div>
    </PerformanceProfiler>
  )
}
