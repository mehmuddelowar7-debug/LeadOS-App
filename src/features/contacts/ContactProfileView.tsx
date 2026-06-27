import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Phone, MessageCircle, Edit, Calendar,
  FileText, GraduationCap, User,
  MoreHorizontal, Share2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StatusBadge, ScoreBadge } from '@/components/shared/StatusBadge'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import type { ContactActivity } from '@/types'
import { getProbabilityLabel } from '@/types'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { CallLogSheet } from './CallLogSheet'
import { WhatsAppSheet } from './WhatsAppTemplates'

dayjs.extend(relativeTime)

import { useContactProfile } from '@/hooks/useContactProfile'

// ============================================================================
// Activity Icon & Color
// ============================================================================
const ACTIVITY_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  created: { icon: '✨', color: 'bg-blue-500/10 text-blue-500', label: 'Created' },
  called: { icon: '📞', color: 'bg-emerald-500/10 text-emerald-500', label: 'Call' },
  whatsapp_sent: { icon: '💬', color: 'bg-green-500/10 text-green-500', label: 'WhatsApp' },
  visited: { icon: '🏠', color: 'bg-purple-500/10 text-purple-500', label: 'Visited' },
  note_added: { icon: '📝', color: 'bg-amber-500/10 text-amber-500', label: 'Note' },
  status_changed: { icon: '🔄', color: 'bg-violet-500/10 text-violet-500', label: 'Status Changed' },
  registered: { icon: '📋', color: 'bg-indigo-500/10 text-indigo-500', label: 'Registered' },
  recharged: { icon: '💳', color: 'bg-teal-500/10 text-teal-500', label: 'Recharged' },
  training_started: { icon: '📚', color: 'bg-cyan-500/10 text-cyan-500', label: 'Training Started' },
  training_completed: { icon: '🎓', color: 'bg-emerald-500/10 text-emerald-500', label: 'Training Done' },
  activated: { icon: '🚀', color: 'bg-green-500/10 text-green-500', label: 'Activated' },
  document_updated: { icon: '📄', color: 'bg-orange-500/10 text-orange-500', label: 'Document' },
  follow_up_set: { icon: '📅', color: 'bg-violet-500/10 text-violet-500', label: 'Follow-up Set' },
}

// ============================================================================
// Info Row
// ============================================================================
function InfoRow({ label, value, icon }: { label: string; value: string | null | undefined; icon?: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-xs text-muted-foreground flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

// ============================================================================
// Timeline Component
// ============================================================================
function Timeline({ activities }: { activities: ContactActivity[] }) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
      <div className="space-y-0">
        {activities.map((activity, i) => {
          const config = ACTIVITY_CONFIG[activity.activity_type] || ACTIVITY_CONFIG.note_added
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative flex gap-3 pb-4"
            >
              <div className={cn('relative z-10 h-8 w-8 rounded-full flex items-center justify-center text-sm shrink-0', config.color)}>
                {config.icon}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground">{config.label}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {dayjs(activity.created_at).format('h:mm A')}
                  </span>
                </div>
                {activity.content && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{activity.content}</p>
                )}
                {(i === 0 || dayjs(activity.created_at).format('MMM D') !== dayjs(activities[i - 1]?.created_at).format('MMM D')) && (
                  <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1 block">
                    {dayjs(activity.created_at).format('ddd, MMM D')}
                  </span>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// Contact Profile View
// ============================================================================
const TABS = ['Profile', 'History', 'Operations'] as const

export function ContactProfileView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Profile')
  const [callSheetOpen, setCallSheetOpen] = useState(false)
  const [whatsappSheetOpen, setWhatsappSheetOpen] = useState(false)

  const { data: profile, isLoading } = useContactProfile(id)

  const handleCall = () => {
    if (!profile) return
    window.open(`tel:${profile.phone}`)
    setTimeout(() => setCallSheetOpen(true), 1500)
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this contact? This cannot be undone.')) {
      toast.success('Contact deleted successfully')
      navigate('/contacts')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6 text-center">
        <h3 className="text-lg font-bold text-foreground mb-2">Contact not found</h3>
        <p className="text-sm text-muted-foreground mb-4">This contact may have been deleted.</p>
        <Button onClick={() => navigate('/contacts')}>Return to Network</Button>
      </div>
    )
  }

  const contact = profile
  const opportunity = profile.opportunity
  const activities = [...profile.activities].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const initials = contact.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const probability = opportunity ? getProbabilityLabel(opportunity.score) : 'Low'

  return (
    <div className="flex flex-col h-full relative px-4 md:px-6 lg:px-8">
      <div className="space-y-4 pb-4">
        <div className="relative pt-2">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/contacts')}
              className="md:hidden h-9 w-9 rounded-xl flex items-center justify-center hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1 ml-auto">
              <button className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-muted/50 transition-colors">
                <Share2 className="h-4 w-4" />
              </button>
              <button className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-muted/50 transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-primary/20 shadow-lg">
              <AvatarImage src={contact.photo_url ?? undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">{initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">{contact.name}</h1>
              <div className="flex flex-wrap gap-1 mt-1">
                {contact.roles.map(role => (
                   <div key={role} className="inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] uppercase font-semibold transition-colors bg-violet-500/10 text-violet-500 border-transparent">
                     {role.replace('_', ' ')}
                   </div>
                ))}
                {contact.labels?.map(label => (
                   <div key={label} className="inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] uppercase font-semibold transition-colors bg-amber-500/10 text-amber-500 border-transparent">
                     {label}
                   </div>
                ))}
              </div>
              
              {opportunity && (
                <div className="flex items-center gap-2 mt-2">
                  <StatusBadge status={opportunity.status} />
                  <ScoreBadge score={opportunity.score} />
                </div>
              )}
              
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                {contact.origin && <span>{contact.origin}</span>}
                {contact.origin && contact.current_area && <span>·</span>}
                {contact.current_area && <span>{contact.current_area}</span>}
              </div>
            </div>
          </div>

          {opportunity && (
            <div className="mt-5 space-y-3">
              <div className="glass-card rounded-xl p-3 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Readiness Score</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold tracking-tight text-foreground">{opportunity.score}</span>
                    <div className="flex flex-col gap-0.5">
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded text-white', 
                        probability === 'High' ? 'bg-emerald-500' : probability === 'Medium' ? 'bg-amber-500' : 'bg-red-500'
                      )}>
                        {probability} Probability
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {opportunity?.next_followup && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'mt-3 rounded-xl p-3 flex items-center gap-2',
                dayjs(opportunity.next_followup).isBefore(dayjs())
                  ? 'bg-red-500/10 border border-red-500/20'
                  : 'bg-violet-500/10 border border-violet-500/20'
              )}
            >
              <Calendar className="h-4 w-4 shrink-0 text-violet-500" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">
                  Follow-up {dayjs(opportunity.next_followup).fromNow()}
                </p>
              </div>
              <Button size="sm" variant="ghost" className="h-7 text-[11px] rounded-lg">
                Reschedule
              </Button>
            </motion.div>
          )}
        </div>

        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md pt-2 pb-2">
          <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto scrollbar-hide">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex-1 min-w-[80px] py-2 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap',
                  activeTab === tab
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="pb-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'Profile' && (
                <div className="space-y-4">
                  <div className="glass-card rounded-2xl p-4">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Personal</h3>
                    <InfoRow label="Phone" value={contact.phone} icon={<Phone className="h-3 w-3" />} />
                    <Separator className="opacity-50" />
                    <InfoRow label="WhatsApp" value={contact.whatsapp} icon={<MessageCircle className="h-3 w-3" />} />
                    <Separator className="opacity-50" />
                    <InfoRow label="Age" value={contact.age ? `${contact.age} years` : null} icon={<User className="h-3 w-3" />} />
                    <Separator className="opacity-50" />
                    <InfoRow label="Gender" value={contact.gender} />
                    <Separator className="opacity-50" />
                    <InfoRow label="Origin" value={contact.origin} />
                  </div>

                  {opportunity && (
                    <div className="glass-card rounded-2xl p-4">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Skills & Experience</h3>
                      <InfoRow label="Education" value={opportunity.education?.replace('_', ' ')} icon={<GraduationCap className="h-3 w-3" />} />
                      <Separator className="opacity-50" />
                      <InfoRow label="English Level" value={opportunity.english_level} />
                      <Separator className="opacity-50" />
                      <InfoRow label="Experience" value={opportunity.experience === 'fresher' ? 'Fresher' : `${opportunity.experience} years`} />
                    </div>
                  )}
                  
                  {opportunity?.currently_working && (
                    <div className="glass-card rounded-2xl p-4 border border-amber-500/20">
                      <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-2">Competitor Intelligence</h3>
                      <InfoRow label="Currently Working" value="Yes" />
                      <Separator className="opacity-50" />
                      <InfoRow label="Competitor" value={opportunity.competitor} />
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'History' && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Latest Notes</h3>
                    {contact.notes ? (
                      <div className="glass-card rounded-2xl p-4">
                        <p className="text-sm text-foreground whitespace-pre-wrap">{contact.notes}</p>
                        <p className="text-[10px] text-muted-foreground mt-2">
                          Updated {dayjs(contact.updated_at).fromNow()}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-[11px] text-muted-foreground">No notes yet</p>
                      </div>
                    )}
                    <Button variant="outline" className="w-full h-10 rounded-xl gap-2">
                      <FileText className="h-4 w-4" /> Add Note
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Activity Timeline</h3>
                    <Timeline activities={activities} />
                  </div>
                </div>
              )}

              {activeTab === 'Operations' && opportunity && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Required Documents</h3>
                    {(['aadhaar', 'pan', 'bank', 'photo'] as const).map(doc => (
                      <div key={doc} className="glass-card rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium capitalize">{doc}</span>
                        </div>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                          Pending
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Training Status</h3>
                    <div className="glass-card rounded-xl p-6 text-center border-dashed">
                      <GraduationCap className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-sm font-medium text-foreground">Not Started</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Complete documents to begin training</p>
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button variant="destructive" className="w-full rounded-xl font-bold bg-destructive/10 text-destructive hover:bg-destructive/20 border-transparent shadow-none" onClick={handleDelete}>
                      Delete Contact
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed-bottom-safe left-4 right-4 z-50 bg-background/80 backdrop-blur-md p-2 rounded-[24px] border shadow-2xl flex gap-2">
        <Button
          className="flex-1 min-h-[52px] rounded-[16px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
          onClick={handleCall}
        >
          <Phone className="h-5 w-5 mr-1.5" /> Call
        </Button>
        <Button
          className="flex-1 min-h-[52px] rounded-[16px] bg-[#25D366] hover:bg-[#128C7E] text-white font-bold shadow-sm"
          onClick={() => setWhatsappSheetOpen(true)}
        >
          <MessageCircle className="h-5 w-5 mr-1.5" /> WhatsApp
        </Button>
        <Button
          variant="outline"
          className="w-[52px] min-h-[52px] rounded-[16px] p-0 shrink-0 bg-background shadow-sm"
          onClick={() => alert('Follow-up sheet logic')}
        >
          <Calendar className="h-5 w-5 text-violet-500" />
        </Button>
        <Button
          variant="outline"
          className="w-[52px] min-h-[52px] rounded-[16px] p-0 shrink-0 bg-background shadow-sm"
          onClick={() => navigate(`/contacts/${id}/edit`)}
        >
          <Edit className="h-5 w-5" />
        </Button>
      </div>

      <CallLogSheet
        open={callSheetOpen}
        onClose={() => setCallSheetOpen(false)}
        leadId={contact.id}
        leadName={contact.name}
      />

      <WhatsAppSheet
        open={whatsappSheetOpen}
        onClose={() => setWhatsappSheetOpen(false)}
        lead={contact as any} // Keeping as any for now to avoid refactoring the entire WhatsApp sheet right now
      />
    </div>
  )
}
