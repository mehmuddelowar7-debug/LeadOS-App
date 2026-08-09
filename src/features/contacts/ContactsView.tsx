import { useAppNavigate } from '@/lib/routes'
import { useState, useRef, memo, useMemo, useCallback } from 'react'
import { PerformanceProfiler } from '@/components/dev/PerformanceProfiler'
import { useRenderProfiler } from '@/hooks/useRenderProfiler'
import { Search, UserPlus, Download, Phone, MessageCircle, CheckSquare, Square, Trash2, Calendar, PhoneOutgoing, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { CONTACT_ROLES, type ContactRole, type Contact } from '@/types'
import { useLocation } from 'react-router'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useDebounce } from '@/lib/useDebounce'
import { toast } from 'sonner'
import { motion, useAnimation, AnimatePresence, type PanInfo } from 'framer-motion'
import { useContacts } from '@/hooks/useContacts'
import { analytics } from '@/lib/analytics'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

// ============================================================================
// Swipeable Contact Card Component
// ============================================================================
const ContactCard = memo(function ContactCard({ contact, onClick, isActive, isSelectMode, isSelected, onToggleSelect }: { contact: Contact, onClick: () => void, isActive: boolean, isSelectMode: boolean, isSelected: boolean, onToggleSelect: () => void }) {
  const controls = useAnimation()
  
  const handleDragEnd = async (_e: any, info: PanInfo) => {
    const threshold = 60
    if (info.offset.x > threshold) {
      window.open(`tel:${contact.phone}`)
    } else if (info.offset.x < -threshold) {
      window.open(`https://wa.me/${contact.phone}`)
    }
    controls.start({ x: 0, transition: { type: 'spring', stiffness: 400, damping: 40 } })
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl touch-pan-y bg-muted/50">
      {/* Background Actions */}
      <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
        <div className="flex items-center gap-2 text-emerald-600 font-bold">
           <Phone className="h-6 w-6" /> 
        </div>
        <div className="flex items-center gap-2 text-emerald-500 font-bold">
           <MessageCircle className="h-6 w-6" />
        </div>
      </div>
      
      {/* Foreground Card */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        onDragEnd={isSelectMode ? undefined : handleDragEnd}
        animate={controls}
        onClick={isSelectMode ? onToggleSelect : onClick}
        onContextMenu={(e) => {
          e.preventDefault()
          toast.success('Quick actions opened for ' + contact.name)
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            isSelectMode ? onToggleSelect() : onClick()
          }
        }}
        className={cn(
          "glass-card rounded-2xl p-4 cursor-pointer transition-colors relative z-10 w-full active:scale-[0.99] touch-pan-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          isActive ? "bg-primary/10 border-primary shadow-sm" : "bg-background hover:bg-muted/50",
          isSelected && "border-primary bg-primary/5"
        )}
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0 flex items-start gap-3">
            {isSelectMode && (
              <div className="mt-1 text-primary shrink-0 transition-all">
                {isSelected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5 opacity-50" />}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-foreground truncate">{contact.name}</h3>
            <p className="text-base font-semibold text-muted-foreground mt-0.5">{contact.phone}</p>
            {contact.current_area && (
              <p className="text-xs font-medium text-muted-foreground mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              </p>
            )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 self-start flex-wrap max-w-[45%] shrink-0">
            {contact.roles.map(role => (
              <span 
                key={role} 
                className="px-2 py-1 rounded border border-primary/20 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-wider text-right max-w-full break-words whitespace-normal"
              >
                {role.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
})

// ============================================================================
// Virtualized List View
// ============================================================================
function ListView({ contacts, onContactClick, activeId, isSelectMode, selectedIds, onToggleSelect }: { contacts: Contact[], onContactClick: (contact: Contact) => void, activeId: string | null, isSelectMode: boolean, selectedIds: Set<string>, onToggleSelect: (id: string) => void }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: contacts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 110, // approximate height + gap
    overscan: 5,
  })

  if (contacts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center h-[50vh]">
        <div className="h-20 w-20 bg-muted/50 rounded-3xl flex items-center justify-center mb-4">
          <Search className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-bold text-foreground">No contacts found</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-[250px]">
          Try adjusting your search criteria.
        </p>
      </div>
    )
  }

  return (
    <div 
      ref={parentRef} 
      className="flex-1 overflow-y-auto w-full scrollbar-hide pb-32 pt-2"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
          const contact = contacts[virtualItem.index]
          return (
            <div
              key={contact.id}
              ref={rowVirtualizer.measureElement}
              data-index={virtualItem.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
                paddingBottom: '16px'
              }}
            >
              <ContactCard 
                contact={contact} 
                onClick={() => onContactClick(contact)} 
                isActive={activeId === contact.id} 
                isSelectMode={isSelectMode}
                isSelected={selectedIds.has(contact.id)}
                onToggleSelect={() => onToggleSelect(contact.id)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// Contacts View (Main)
// ============================================================================
export function ContactsView() {
  const navigate = useAppNavigate()
  const location = useLocation()
  
  const activeId = location.pathname.split('/').pop() || null

  const handleExportContacts = async () => {
    analytics.trackEvent('contacts', 'export_all')
    toast.success('Exporting contacts')
  }

  const { data: allContacts = [], isLoading } = useContacts()
  
  useRenderProfiler('ContactsView', {}, { activeId, allContacts })
  
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [activeFilter, setActiveFilter] = useState<ContactRole | 'all'>('all')

  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const queryClient = useQueryClient()
  const handleBulkAction = async (action: string) => {
    if (selectedIds.size === 0) return
    
    analytics.trackEvent('contacts', 'bulk_action', action)
    
    try {
      if (action === 'Archive') {
        const { error } = await supabase
          .from('contacts')
          .update({ is_archived: true })
          .in('id', Array.from(selectedIds))
          
        if (error) throw error
        toast.success(`${selectedIds.size} contacts archived.`)
        queryClient.invalidateQueries({ queryKey: ['contacts'] })
      } else if (action === 'Delete') {
        const { error } = await supabase
          .from('contacts')
          .update({ is_deleted: true })
          .in('id', Array.from(selectedIds))
          
        if (error) throw error
        toast.success(`${selectedIds.size} contacts deleted.`)
        queryClient.invalidateQueries({ queryKey: ['contacts'] })
      } else {
        toast.success(`Bulk action "${action}" scheduled for ${selectedIds.size} contacts.`)
      }
    } catch (err: any) {
      toast.error(`Failed to ${action.toLowerCase()}: ` + err.message)
    }

    setIsSelectMode(false)
    setSelectedIds(new Set())
  }

  // Memoize filtering so it only recalculates when deps change, not on every render
  const filteredContacts = useMemo(() => {
    if (!debouncedSearch && activeFilter === 'all') return allContacts
    return allContacts.filter((contact) => {
      if (activeFilter !== 'all' && !contact.roles.includes(activeFilter)) return false
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase()
        return (
          contact.name.toLowerCase().includes(q) ||
          contact.phone.includes(q) ||
          (contact.current_area?.toLowerCase().includes(q) ?? false)
        )
      }
      return true
    })
  }, [allContacts, debouncedSearch, activeFilter])

  // Precompute role counts once per contact list update, not per role button render
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const contact of allContacts) {
      for (const role of contact.roles) {
        counts[role] = (counts[role] || 0) + 1
      }
    }
    return counts
  }, [allContacts])

  const onContactClick = useCallback((contact: Contact) => {
    navigate(`/contacts/${contact.id}`)
  }, [navigate])

  if (isLoading && allContacts.length === 0) {
    // Skeleton: show immediately, never block the shell
    return (
      <div className="flex flex-col h-full px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between pt-6 pb-2 shrink-0">
          <div className="h-9 w-32 bg-muted animate-pulse rounded-xl" />
        </div>
        <div className="pt-2 pb-4 space-y-4">
          <div className="h-14 w-full bg-muted animate-pulse rounded-2xl" />
          <div className="flex gap-2">
            {[1,2,3].map(i => <div key={i} className="h-12 w-28 bg-muted animate-pulse rounded-2xl shrink-0" />)}
          </div>
        </div>
        <div className="space-y-3 pt-2">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-[82px] w-full bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (allContacts.length === 0) {
    return (
      <div className="flex flex-col h-full px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between pt-6 pb-2 shrink-0">
          <h1 className="text-3xl font-black tracking-tight text-foreground">Candidates</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 pb-32">
          <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6">
            <UserPlus className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">No contacts yet.</h3>
          <p className="text-base text-muted-foreground max-w-[250px] mb-8">
            Start building your candidate pool by capturing your first lead.
          </p>
          <button 
            onClick={() => navigate('/contacts/new?mode=quick')}
            className="px-8 h-14 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Quick Capture
          </button>
        </div>
      </div>
    )
  }

  return (
    <PerformanceProfiler id="ContactsView">
      <div className="flex flex-col h-full px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between pt-6 pb-2 shrink-0">
        <h1 className="text-3xl font-black tracking-tight text-foreground">Candidates</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setIsSelectMode(!isSelectMode)
              if (isSelectMode) setSelectedIds(new Set())
            }}
            className={cn(
              "h-12 px-4 flex items-center justify-center font-bold text-sm rounded-2xl transition-colors touch-target",
              isSelectMode ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {isSelectMode ? 'Cancel' : 'Select'}
          </button>
          <button 
            onClick={handleExportContacts}
            className="h-12 w-12 flex items-center justify-center bg-muted text-muted-foreground rounded-2xl hover:bg-muted/80 transition-colors touch-target"
            title="Export Contacts"
          >
            <Download className="h-5 w-5" />
          </button>
          <button 
            onClick={() => navigate('/contacts/new?mode=quick')}
            className="h-12 w-12 flex items-center justify-center bg-primary/10 text-primary rounded-2xl hover:bg-primary/20 transition-colors touch-target"
            title="Add Candidate"
          >
            <UserPlus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Sticky Search & Filters */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-2 pb-4 space-y-4 shrink-0">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search name, phone, area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-14 rounded-2xl text-lg bg-muted/50 border-transparent focus:bg-background shadow-sm"
          />
        </div>

        {/* Role Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
          <button
            onClick={() => {
              analytics.trackEvent('contacts', 'filter', 'all')
              setActiveFilter('all')
            }}
            className={cn(
              'px-5 h-12 rounded-2xl text-sm font-bold whitespace-nowrap transition-all shrink-0 touch-target snap-start border-2',
              activeFilter === 'all' ? 'bg-foreground text-background border-foreground shadow-md' : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
            )}
          >
          All Contacts ({allContacts.length})
          </button>
          {CONTACT_ROLES.map((role) => {
            const count = roleCounts[role] || 0
            if (count === 0) return null
            return (
              <button
                key={role}
                onClick={() => {
                  analytics.trackEvent('contacts', 'filter', role)
                  setActiveFilter(role)
                }}
                className={cn(
                  'px-5 h-12 rounded-2xl text-sm font-bold whitespace-nowrap transition-all shrink-0 uppercase tracking-wider touch-target snap-start border-2',
                  activeFilter === role ? 'bg-primary/10 text-primary border-primary shadow-sm' : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
                )}
              >
                {role.replace('_', ' ')} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <ListView 
        contacts={filteredContacts} 
        onContactClick={onContactClick} 
        activeId={activeId} 
        isSelectMode={isSelectMode}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
      />

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {isSelectMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 p-4 z-50 pointer-events-none"
          >
            <div className="max-w-md mx-auto pointer-events-auto bg-card border shadow-2xl rounded-2xl overflow-hidden p-2">
              <div className="flex items-center justify-between px-3 pt-1 pb-2">
                <span className="text-sm font-bold text-primary">{selectedIds.size} selected</span>
                <button onClick={() => setSelectedIds(new Set())} className="text-xs text-muted-foreground font-semibold">Clear</button>
              </div>
              <div className="grid grid-cols-5 gap-1">
                <button onClick={() => handleBulkAction('Status')} className="flex flex-col items-center justify-center gap-1 h-14 rounded-xl bg-muted/50 hover:bg-muted text-foreground transition-colors">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Status</span>
                </button>
                <button onClick={() => handleBulkAction('Interview')} className="flex flex-col items-center justify-center gap-1 h-14 rounded-xl bg-muted/50 hover:bg-muted text-foreground transition-colors">
                  <Calendar className="h-4 w-4" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Interview</span>
                </button>
                <button onClick={() => handleBulkAction('Follow-up')} className="flex flex-col items-center justify-center gap-1 h-14 rounded-xl bg-muted/50 hover:bg-muted text-foreground transition-colors">
                  <PhoneOutgoing className="h-4 w-4" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Follow-up</span>
                </button>
                <button onClick={() => handleBulkAction('Export')} className="flex flex-col items-center justify-center gap-1 h-14 rounded-xl bg-muted/50 hover:bg-muted text-foreground transition-colors">
                  <Download className="h-4 w-4" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Export</span>
                </button>
                <button onClick={() => handleBulkAction('Archive')} className="flex flex-col items-center justify-center gap-1 h-14 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors">
                  <Trash2 className="h-4 w-4" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Archive</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </PerformanceProfiler>
  )
}
