import { ROUTES } from '@/lib/routes'
import { useAppNavigate } from '@/lib/routes'
import { useState, useRef } from 'react'
import { useParams } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Phone, MessageCircle, Edit, Calendar,
  FileText, GraduationCap, User,
  MoreHorizontal, Share2, Award, Users, MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StatusBadge, ScoreBadge } from '@/components/shared/StatusBadge'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { getProbabilityLabel } from '@/types'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { supabase } from '@/lib/supabase'
import { CallLogSheet } from './CallLogSheet'
import { WhatsAppSheet } from './WhatsAppTemplates'
import { AddInterviewSheet } from './AddInterviewSheet'
import { AddFollowUpSheet } from './AddFollowUpSheet'
import { ContactActionsSheet } from './ContactActionsSheet'
import { ContactEditSheet } from './ContactEditSheet'
import { CRMSummaryPanel } from './components/CRMSummaryPanel'
import { getHealth, getPriorityLevel, getNextAction, type CandidateData } from '@/engine/intelligence'
import { logActivity } from '@/lib/activityLogger'
import { useDocumentUpload } from '@/hooks/useDocumentUpload'

dayjs.extend(relativeTime)

import { useContactProfile } from '@/hooks/useContactProfile'

import { InfoRow } from './components/InfoRow'
import { ContactTimeline as Timeline } from './components/ContactTimeline'
import { CandidatePipeline } from './components/CandidatePipeline'
import { CandidateSummaryPanel } from '@/features/ai'
import { useAIContextBuilder } from '@/sdk/ai'

// ============================================================================
// Contact Profile View
// ============================================================================
const TABS = ['Profile', 'History', 'Operations'] as const

export function ContactProfileView() {
  const { id } = useParams()
  const navigate = useAppNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadDocument, isUploading } = useDocumentUpload(id!)
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Profile')
  const [callSheetOpen, setCallSheetOpen] = useState(false)
  const [whatsappSheetOpen, setWhatsappSheetOpen] = useState(false)
  const [interviewSheetOpen, setInterviewSheetOpen] = useState(false)
  const [followUpSheetOpen, setFollowUpSheetOpen] = useState(false)
  const [actionsSheetOpen, setActionsSheetOpen] = useState(false)
  const [editSheetOpen, setEditSheetOpen] = useState(false)

  const { data: profile, isLoading } = useContactProfile(id)
  const aiSnapshot = useAIContextBuilder('default', true)

  const handleCall = () => {
    if (!profile) return
    window.open(`tel:${profile.phone}`)
    setTimeout(() => setCallSheetOpen(true), 1500)
  }

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    const url = await uploadDocument(file, 'document')
    if (url) {
      logActivity(profile.id, 'note', `Uploaded a document: ${file.name}`)
    }
  }

  const handleArchive = async () => {
    if (window.confirm('Are you sure you want to archive this contact?')) {
      try {
        const { error } = await supabase
          .from('contacts')
          .update({ is_archived: true, updated_at: new Date().toISOString() })
          .eq('id', profile!.id)

        if (error) throw error
        
        await logActivity(profile!.id, 'note', 'Contact was archived')
        toast.success('Contact archived successfully')
        navigate(ROUTES.CONTACTS)
      } catch (err: any) {
        toast.error('Failed to archive: ' + err.message)
      }
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
        <Button onClick={() => navigate(ROUTES.CONTACTS)}>Return to Candidates</Button>
      </div>
    )
  }

  const contact = profile
  const opportunity = profile.opportunity
  const activities = [...profile.activities].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  const referredBy = profile.referredBy
  const referredCandidates = profile.referredCandidates

  const initials = contact.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const probability = opportunity ? getProbabilityLabel(opportunity.score) : 'Low'

  const candidateData: CandidateData = {
    id: contact.id,
    name: contact.name,
    stage: opportunity?.status || 'lead',
    status: opportunity?.status || 'lead',
    lastContactedAt: contact.updated_at,
    lastActivityAt: contact.updated_at,
    stageUpdatedAt: opportunity?.updated_at || contact.updated_at,
    nextFollowUp: opportunity?.next_followup || null,
    interviewDate: opportunity?.next_followup || null,
    interviewStatus: null,
    rechargeAmount: (opportunity as any)?.recharge_amount || 0,
    rechargeStatus: (opportunity as any)?.recharge_status || null,
  }
  const today = dayjs()
  const health = getHealth(candidateData, today)
  const priority = getPriorityLevel(candidateData, today)
  const nextAction = getNextAction(candidateData, today)

  const healthColor = health === 'Healthy' ? 'bg-emerald-500/10 text-emerald-500' : health === 'Warning' ? 'bg-yellow-500/10 text-yellow-500' : health === 'Critical' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
  const priorityColor = priority === 'P0' ? 'bg-red-500/10 text-red-500' : priority === 'P1' ? 'bg-orange-500/10 text-orange-500' : priority === 'P2' ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-500/10 text-zinc-500'

  return (
    <div className="flex flex-col h-full relative px-4 md:px-6 lg:px-8">
      <div className="space-y-4 pb-4">
        <div className="relative pt-2">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(ROUTES.CONTACTS)}
              className="md:hidden h-9 w-9 rounded-xl flex items-center justify-center hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1 ml-auto">
              <button className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-muted/50 transition-colors">
                <Share2 className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setActionsSheetOpen(true)}
                className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-muted/50 transition-colors"
              >
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
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <StatusBadge status={opportunity.status} />
                  <ScoreBadge score={opportunity.score} />
                  <div className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] uppercase font-semibold transition-colors border-transparent", healthColor)}>
                     {health}
                  </div>
                  <div className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] uppercase font-semibold transition-colors border-transparent", priorityColor)}>
                     {priority}
                  </div>
                </div>
              )}
              
              <div className="mt-2 text-xs font-bold text-primary flex items-center gap-1.5 bg-primary/5 w-fit px-2 py-1 rounded border border-primary/10">
                Next Action: {nextAction}
              </div>

              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                {contact.origin && <span>{contact.origin}</span>}
                {contact.origin && contact.current_area && <span>·</span>}
                {contact.current_area && <span>{contact.current_area}</span>}
              </div>
            </div>
          </div>

          {/* Inline Action Bar */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button
              className="flex-1 min-w-[90px] h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
              onClick={handleCall}
            >
              <Phone className="h-4 w-4 mr-1.5" /> Call
            </Button>
            <Button
              className="flex-1 min-w-[90px] h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-sm"
              onClick={() => setWhatsappSheetOpen(true)}
            >
              <MessageCircle className="h-4 w-4 mr-1.5" /> WhatsApp
            </Button>
            <a
              href={`sms:${contact.phone}`}
              className="flex-1 min-w-[90px] h-11 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold shadow-sm inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onClick={() => logActivity(contact.id, 'sms', 'Sent SMS via action bar')}
            >
              <MessageSquare className="h-4 w-4 mr-1.5" /> SMS
            </a>
            <Button
              variant="outline"
              className="w-11 h-11 rounded-xl p-0 shrink-0 bg-background shadow-sm border-violet-500/20 text-violet-500 hover:bg-violet-500/10"
              onClick={() => setFollowUpSheetOpen(true)}
            >
              <Calendar className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-11 h-11 rounded-xl p-0 shrink-0 bg-background shadow-sm"
              onClick={() => setEditSheetOpen(true)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-11 h-11 rounded-xl p-0 shrink-0 bg-background shadow-sm"
              onClick={() => setActionsSheetOpen(true)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
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

          {/* Candidate Pipeline */}
          {opportunity && (
            <CandidatePipeline 
              contactId={contact.id} 
              opportunity={opportunity} 
              onOpenInterview={() => setInterviewSheetOpen(true)}
            />
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

        <div className="pb-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              {activeTab === 'Profile' && (
                <div className="space-y-4">
                  {/* Local CRM Summary (Deterministic fallback) */}
                  <CRMSummaryPanel contact={contact as any} />
                  
                  {/* AI Candidate Summary */}
                  {contact && aiSnapshot && (
                    <CandidateSummaryPanel snapshot={aiSnapshot} candidateId={contact.id} />
                  )}

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
                    <div className="glass-card rounded-2xl p-4">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Location</h3>
                      <InfoRow label="Area" value={contact.current_area} />
                      <Separator className="opacity-50" />
                      <InfoRow label="City" value={contact.custom_fields?.city as string} />
                      <Separator className="opacity-50" />
                      <InfoRow label="State" value={contact.custom_fields?.state as string} />
                      <Separator className="opacity-50" />
                      <InfoRow label="Address" value={contact.custom_fields?.address as string} />
                    </div>
                  </div>

                  {opportunity && (
                    <div className="space-y-4">
                      <div className="glass-card rounded-2xl p-4">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Skills & Experience</h3>
                      <InfoRow label="Education" value={opportunity.education?.replace('_', ' ')} icon={<GraduationCap className="h-3 w-3" />} />
                      <Separator className="opacity-50" />
                      <InfoRow label="English Level" value={opportunity.english_level} />
                      <Separator className="opacity-50" />
                      <InfoRow label="Experience" value={opportunity.experience === 'fresher' ? 'Fresher' : `${opportunity.experience} years`} />
                      </div>

                      <div className="glass-card rounded-2xl p-4">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Financials</h3>
                        <InfoRow label="Current Salary" value={(opportunity as any).current_salary ? `₹${(opportunity as any).current_salary}` : null} />
                        <Separator className="opacity-50" />
                        <InfoRow label="Expected Salary" value={(opportunity as any).expected_salary ? `₹${(opportunity as any).expected_salary}` : null} />
                        <Separator className="opacity-50" />
                        <InfoRow label="Expected Benefits" value={(opportunity as any).expected_benefits || null} />
                      </div>
                      
                      <div className="glass-card rounded-2xl p-4">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
                          Documents
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={handleDocumentUpload} 
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-[10px] px-2 text-primary"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                          >
                            {isUploading ? 'Uploading...' : 'Upload'}
                          </Button>
                        </h3>
                        <div className="flex flex-col gap-2 mt-3">
                          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border/50">
                            <span className="text-sm font-medium text-muted-foreground">Resume</span>
                            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded uppercase">Pending</span>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border/50">
                            <span className="text-sm font-medium text-muted-foreground">Aadhaar Card</span>
                            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded uppercase">Pending</span>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border/50">
                            <span className="text-sm font-medium text-muted-foreground">PAN Card</span>
                            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded uppercase">Pending</span>
                          </div>
                        </div>
                      </div>
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

                  {referredBy && (
                    <div 
                      className="glass-card rounded-2xl p-4 cursor-pointer active:scale-95 transition-transform"
                      onClick={() => navigate(ROUTES.CONTACT_DETAILS.replace(':id', referredBy.referrer_id))}
                    >
                      <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Award className="h-4 w-4" /> Referred By
                      </h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-foreground">{(referredBy.referrer as any)?.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Partner</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">₹{referredBy.commission_amount}</p>
                          <span className={cn(
                            "inline-block px-2 py-0.5 mt-1 rounded-full text-[9px] font-bold uppercase",
                            referredBy.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' :
                            referredBy.status === 'approved' ? 'bg-blue-500/10 text-blue-500' :
                            referredBy.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                            'bg-amber-500/10 text-amber-500'
                          )}>
                            {referredBy.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {referredCandidates && referredCandidates.length > 0 && (
                    <div className="glass-card rounded-2xl p-4">
                      <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" /> Referred Candidates
                      </h3>
                      <div className="space-y-3">
                        {referredCandidates.map(ref => (
                          <div 
                            key={ref.id} 
                            className="flex items-center justify-between p-3 rounded-xl bg-muted/50 cursor-pointer active:scale-95 transition-transform"
                            onClick={() => {
                              if (ref.candidate_contact_id) {
                                navigate(ROUTES.CONTACT_DETAILS.replace(':id', ref.candidate_contact_id))
                              }
                            }}
                          >
                            <div>
                              <p className="font-bold text-sm text-foreground">{(ref.candidate as any)?.name || 'Unknown Candidate'}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{dayjs(ref.referral_date).format('MMM D, YYYY')}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-foreground">₹{ref.commission_amount}</p>
                              <span className={cn(
                                "inline-block px-2 py-0.5 mt-1 rounded-full text-[9px] font-bold uppercase",
                                ref.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' :
                                ref.status === 'approved' ? 'bg-blue-500/10 text-blue-500' :
                                ref.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                'bg-amber-500/10 text-amber-500'
                              )}>
                                {ref.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
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

                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Button onClick={() => setInterviewSheetOpen(true)} variant="outline" className="h-12 rounded-xl font-semibold">
                        <Calendar className="h-4 w-4 mr-2 text-primary" />
                        Interview
                      </Button>
                      <Button onClick={() => setFollowUpSheetOpen(true)} variant="outline" className="h-12 rounded-xl font-semibold">
                        <Calendar className="h-4 w-4 mr-2 text-primary" />
                        Follow-up
                      </Button>
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button variant="destructive" className="w-full rounded-xl font-bold bg-destructive/10 text-destructive hover:bg-destructive/20 border-transparent shadow-none" onClick={handleArchive}>
                      Archive Contact
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
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
        lead={contact as any}
      />

      <AddInterviewSheet
        open={interviewSheetOpen}
        onClose={() => setInterviewSheetOpen(false)}
        contactId={contact.id}
      />
      
      <AddFollowUpSheet
        open={followUpSheetOpen}
        onClose={() => setFollowUpSheetOpen(false)}
        contactId={contact.id}
      />

      <ContactActionsSheet 
        open={actionsSheetOpen} 
        onOpenChange={setActionsSheetOpen} 
        contactId={contact.id} 
        isDeleted={(contact as any).is_deleted}
        onEdit={() => setEditSheetOpen(true)}
      />
      
      <ContactEditSheet 
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        contact={contact}
      />
    </div>
  )
}
