import { ROUTES, useAppNavigate } from '@/lib/routes'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Check, Loader2, Phone, User,
  AlertTriangle, Calendar, Users, Copy,
  MessageCircle, Search, UserPlus, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { pushToMutationQueue } from '@/lib/offlineSync'
import { checkDuplicateContact, insertContact, insertContactActivity, type DuplicateContactInfo } from './queries'
import { useAuthStore } from '@/features/auth/AuthStore'
import { analytics } from '@/lib/analytics'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type CaptureStep = 'phone' | 'name' | 'source' | 'referrer' | 'campaign' | 'opening'

interface FormState {
  phone: string
  name: string
  source: string
  referrerId: string | null
  referrerName: string | null
  campaignId: string | null
  campaignName: string | null
}

// ─────────────────────────────────────────────────────────────
// Source definitions — ordered by recruiter frequency
// ─────────────────────────────────────────────────────────────

const SOURCES = [
  { key: 'instagram', emoji: '📸', label: 'Instagram' },
  { key: 'meta_lead', emoji: '📣', label: 'Meta Lead' },
  { key: 'referral',  emoji: '👥', label: 'Referral' },
  { key: 'walk_in',   emoji: '🚶', label: 'Walk-In' },
  { key: 'whatsapp',  emoji: '💬', label: 'WhatsApp' },
  { key: 'facebook',  emoji: '📘', label: 'Facebook' },
  { key: 'google',    emoji: '🔍', label: 'Google' },
  { key: 'other',     emoji: '✨', label: 'Other' },
] as const

const PAID_SOCIAL = ['instagram', 'facebook', 'meta_lead']

function stageLabel(stage: string | null): string {
  if (!stage) return 'New Lead'
  return stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// ─────────────────────────────────────────────────────────────
// Slide variants — Stripe Checkout style
// ─────────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? '60%' : '-60%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 380, damping: 36 },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? '-60%' : '60%',
    opacity: 0,
    transition: { duration: 0.18 },
  }),
}

// ─────────────────────────────────────────────────────────────
// Confirmed step — compact collapsed line
// ─────────────────────────────────────────────────────────────



function ConfirmedLine({
  icon: Icon, value, sub, onEdit
}: {
  icon: React.ElementType
  value: string
  sub?: string
  onEdit?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onEdit}
      disabled={!onEdit}
      className="flex items-center gap-2.5 py-1.5 w-full text-left group"
    >
      <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
        <Check className="w-3 h-3 text-emerald-400" />
      </div>
      <Icon className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
      <span className="text-sm font-semibold text-foreground/80">{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      {onEdit && (
        <span className="ml-auto text-[10px] text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity">
          edit
        </span>
      )}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// Phone quick-actions — WhatsApp / Call / Copy
// ─────────────────────────────────────────────────────────────

function PhoneQuickActions({ phone }: { phone: string }) {
  const copy = () => {
    navigator.clipboard.writeText(phone)
    toast.success('Copied to clipboard')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 mt-2"
    >
      <a
        href={`https://wa.me/91${phone}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors font-medium"
      >
        <MessageCircle className="w-3 h-3" />
        WhatsApp
      </a>
      <a
        href={`tel:${phone}`}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors font-medium"
      >
        <Phone className="w-3 h-3" />
        Call
      </a>
      <button
        type="button"
        onClick={copy}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground border border-border/40 hover:text-foreground transition-colors"
      >
        <Copy className="w-3 h-3" />
        Copy
      </button>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// Duplicate card
// ─────────────────────────────────────────────────────────────

function DuplicateCard({
  info, onOpenProfile, onLogEnquiry,
}: {
  info: DuplicateContactInfo
  onOpenProfile: () => void
  onLogEnquiry: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: -6 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="rounded-2xl border border-amber-500/25 bg-amber-500/5 overflow-hidden"
    >
      {/* Banner */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="text-xs font-bold text-amber-300 uppercase tracking-widest">
          Already in RecruitOS
        </span>
      </div>

      {/* Contact identity */}
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400/30 to-orange-400/30 flex items-center justify-center text-lg font-bold text-amber-200 shrink-0 border border-amber-500/20">
            {info.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-foreground text-base leading-tight">{info.name}</p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{info.phone}</p>
          </div>
        </div>

        {/* Status grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-background/60 rounded-xl p-2.5 text-center">
            <p className="text-[11px] font-bold text-foreground leading-tight">{stageLabel(info.stage)}</p>
            <p className="text-[9px] text-muted-foreground mt-1 uppercase tracking-wide">Pipeline</p>
          </div>
          <div className="bg-background/60 rounded-xl p-2.5 text-center">
            <p className="text-sm font-bold text-foreground flex items-center justify-center gap-0.5">
              <Calendar className="w-3 h-3 text-emerald-400 inline" /> {info.interviewCount}
            </p>
            <p className="text-[9px] text-muted-foreground mt-1 uppercase tracking-wide">Interviews</p>
          </div>
          <div className="bg-background/60 rounded-xl p-2.5 text-center">
            <p className="text-sm font-bold text-foreground">{info.followUpCount}</p>
            <p className="text-[9px] text-muted-foreground mt-1 uppercase tracking-wide">Follow-ups</p>
          </div>
        </div>

        {info.lastActivity && (
          <p className="text-xs text-muted-foreground">
            Last active {dayjs(info.lastActivity).fromNow()}
          </p>
        )}

        {/* Three actions */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onOpenProfile}
            className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Open Profile
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onLogEnquiry}
            className="w-full h-10 rounded-xl border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs font-semibold transition-colors active:scale-[0.98]"
          >
            Log New Enquiry — same candidate, new contact
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────
// Referrer search
// ─────────────────────────────────────────────────────────────

function ReferrerSearch({ onSelect, onSkip }: {
  onSelect: (id: string, name: string) => void
  onSkip: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ id: string; name: string; phone: string }[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100) }, [])

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      setIsSearching(true)
      const { data } = await supabase
        .from('contacts')
        .select('id, name, phone')
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(6)
      setResults(data || [])
      setIsSearching(false)
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Name or phone..."
          className="w-full h-14 pl-11 pr-4 text-base rounded-2xl bg-muted/50 border-2 border-transparent focus:border-primary focus:bg-background focus:outline-none transition-all"
        />
        {isSearching && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </div>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1.5"
          >
            {results.map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelect(r.id, r.name)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left active:scale-[0.99]"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {r.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{r.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{r.phone}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
              </button>
            ))}
          </motion.div>
        )}
        {query.length >= 2 && results.length === 0 && !isSearching && (
          <p className="text-sm text-muted-foreground text-center py-3">No matches</p>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={onSkip}
        className="w-full text-xs text-muted-foreground/60 hover:text-muted-foreground py-2 transition-colors"
      >
        Skip — referrer unknown
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Campaign picker
// ─────────────────────────────────────────────────────────────

function CampaignPicker({ campaigns, onSelect, onSkip }: {
  campaigns: { id: string; name: string }[]
  onSelect: (id: string, name: string) => void
  onSkip: () => void
}) {
  return (
    <div className="space-y-2">
      {campaigns.map(c => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSelect(c.id, c.name)}
          className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-muted/50 hover:bg-muted border border-transparent hover:border-primary/20 transition-all text-left active:scale-[0.99]"
        >
          <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
          <span className="text-sm font-medium text-foreground flex-1">{c.name}</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      ))}
      <button
        type="button"
        onClick={onSkip}
        className="w-full text-xs text-muted-foreground/60 hover:text-muted-foreground py-2 transition-colors"
      >
        Skip — no specific campaign
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Opening profile transition screen
// ─────────────────────────────────────────────────────────────

function OpeningProfile({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-5">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 400 }}
        >
          <Check className="w-8 h-8 text-emerald-400" />
        </motion.div>
      </motion.div>
      <div className="text-center space-y-1">
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-bold text-foreground text-lg"
        >
          {name} added
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-sm text-muted-foreground flex items-center gap-1.5 justify-center"
        >
          <Loader2 className="w-3 h-3 animate-spin" />
          Opening profile...
        </motion.p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Quick Capture Form — main component
// ─────────────────────────────────────────────────────────────

export function QuickCaptureForm() {
  const navigate = useAppNavigate()
  const user = useAuthStore(state => state.user)
  const queryClient = useQueryClient()

  const [step, setStep] = useState<CaptureStep>('phone')
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = backward
  const [form, setForm] = useState<FormState>({
    phone: '', name: '', source: '',
    referrerId: null, referrerName: null,
    campaignId: null, campaignName: null,
  })

  const [duplicate, setDuplicate] = useState<DuplicateContactInfo | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([])

  const phoneRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const formRef = useRef(form)
  useEffect(() => { formRef.current = form }, [form])

  // Helper to advance step with direction
  const advance = useCallback((next: CaptureStep) => {
    setDirection(1)
    setStep(next)
  }, [])
  const goBack = useCallback((prev: CaptureStep) => {
    setDirection(-1)
    setStep(prev)
  }, [])

  // Focus management
  useEffect(() => {
    if (step === 'phone') setTimeout(() => phoneRef.current?.focus(), 100)
    if (step === 'name') setTimeout(() => nameRef.current?.focus(), 350)
  }, [step])

  // ── Phone ────────────────────────────────────────────────────

  const handlePhoneChange = useCallback(async (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 10)
    setForm(f => ({ ...f, phone: digits }))
    setDuplicate(null)

    if (digits.length === 10) {
      setIsChecking(true)
      try {
        const found = await checkDuplicateContact(digits)
        if (found) {
          setDuplicate(found)
          analytics.trackEvent('contact_entry', 'duplicate_detected')
        } else {
          advance('name')
        }
      } catch { /* offline — allow user to continue */ }
      setIsChecking(false)
    }
  }, [advance])

  // ── Save ──────────────────────────────────────────────────────

  const doSave = useCallback(async (overrides: Partial<FormState> = {}) => {
    advance('opening')
    const merged = { ...formRef.current, ...overrides }
    const contactId = crypto.randomUUID()
    const userId = user?.id || '00000000-0000-0000-0000-000000000000'
    const workspaceId = user?.user_metadata?.workspace_id || '00000000-0000-0000-0000-000000000000'

    const payload = {
      id: contactId,
      workspace_id: workspaceId,
      created_by: userId,
      name: merged.name.trim(),
      phone: merged.phone,
      roles: ['opportunity'],
      source: merged.source || 'other',
      notes: merged.referrerName ? `Referred by: ${merged.referrerName}` : undefined,
    }

    try {
      if (!navigator.onLine) {
        await pushToMutationQueue({ table: 'contacts', action: 'INSERT', payload })
      } else {
        await insertContact(payload)
        analytics.trackEvent('contact_entry', 'created', merged.source)
        queryClient.invalidateQueries({ queryKey: ['contacts'] })
      }
      // Brief delay so the "Opening profile..." screen is visible
      setTimeout(() => navigate(ROUTES.CONTACT_DETAILS.replace(':id', contactId)), 500)
    } catch (err: any) {
      console.error('insertContact failed:', err)
      const errCode = err?.code ? `[${err.code}] ` : ''
      const errMsg = err?.message || err?.details || 'Unknown error'
      toast.error(`Failed: ${errCode}${errMsg}`, { duration: 6000 })
      goBack('source')
    }
  }, [advance, goBack, navigate, user])

  // ── Source handling ───────────────────────────────────────────

  const handleSourceSelect = useCallback(async (key: string) => {
    setForm(f => ({ ...f, source: key }))

    if (key === 'referral') {
      advance('referrer')
      return
    }

    if (PAID_SOCIAL.includes(key)) {
      const { data } = await supabase
        .from('marketing_campaigns')
        .select('id, name')
        .order('name')
      if (data && data.length > 0) {
        setCampaigns(data)
        advance('campaign')
        return
      }
    }

    await doSave({ source: key })
  }, [doSave, advance])

  // ── Log New Enquiry (for duplicates) ─────────────────────────

  const handleLogEnquiry = useCallback(async (existingId: string) => {
    const userId = user?.id || '00000000-0000-0000-0000-000000000000'
    
    // ALWAYS query the DB to be safe against stale JWTs
    let workspaceId = '00000000-0000-0000-0000-000000000000'
    try {
      const { data: memberData } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', userId)
        .limit(1)
        
      if (memberData && memberData.length > 0 && memberData[0].workspace_id) {
        workspaceId = memberData[0].workspace_id
      } else {
        workspaceId = user?.user_metadata?.workspace_id || workspaceId
      }
    } catch (err) {
      workspaceId = user?.user_metadata?.workspace_id || workspaceId
    }

    try {
      await insertContactActivity({
        contact_id: existingId,
        workspace_id: workspaceId,
        created_by: userId,
        activity_type: 'note_added',
        metadata: { title: 'New Enquiry' },
        content: `New enquiry logged — candidate re-approached on ${new Date().toLocaleDateString()}`,
      })
      toast.success('Enquiry logged on timeline')
    } catch (err) {
      console.warn('Could not log enquiry activity:', err)
    }
    navigate(ROUTES.CONTACT_DETAILS.replace(':id', existingId))
  }, [navigate, user])

  // ── Step rendering ────────────────────────────────────────────

  const sourceLabel = SOURCES.find(s => s.key === form.source)
  const confirmedSource = sourceLabel ? `${sourceLabel.emoji} ${sourceLabel.label}` : ''

  return (
    <div className="flex flex-col gap-4 overflow-hidden">

      {/* Confirmed breadcrumb trail */}
      <div className="space-y-0.5 min-h-[24px]">
        {step !== 'phone' && form.phone && (
          <ConfirmedLine
            icon={Phone}
            value={form.phone}
            onEdit={step !== 'opening' ? () => { goBack('phone'); setDuplicate(null) } : undefined}
          />
        )}
        {['source', 'referrer', 'campaign', 'opening'].includes(step) && form.name && (
          <ConfirmedLine
            icon={User}
            value={form.name}
            onEdit={step !== 'opening' ? () => goBack('name') : undefined}
          />
        )}
        {['referrer', 'campaign', 'opening'].includes(step) && form.source && (
          <ConfirmedLine
            icon={Users}
            value={confirmedSource}
            onEdit={step !== 'opening' ? () => goBack('source') : undefined}
          />
        )}
      </div>

      {/* Animated step content */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full"
          >

            {/* ── STEP: Phone ── */}
            {step === 'phone' && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" /> Phone Number
                </label>
                <div className="relative">
                  <input
                    ref={phoneRef}
                    type="tel"
                    inputMode="numeric"
                    placeholder="10-digit number"
                    value={form.phone}
                    onChange={e => handlePhoneChange(e.target.value)}
                    className="w-full h-[72px] px-5 text-3xl font-mono tracking-[0.2em] rounded-2xl bg-muted/50 border-2 border-transparent focus:border-primary focus:bg-background focus:outline-none transition-all placeholder:text-2xl placeholder:tracking-normal"
                    maxLength={10}
                    autoComplete="off"
                  />
                  {isChecking && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking...
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="h-1 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    animate={{ width: `${(form.phone.length / 10) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                </div>

                {/* Quick actions (appear when phone complete) */}
                {form.phone.length === 10 && !isChecking && !duplicate && (
                  <PhoneQuickActions phone={form.phone} />
                )}

                {/* Duplicate card */}
                <AnimatePresence>
                  {duplicate && (
                    <DuplicateCard
                      info={duplicate}
                      onOpenProfile={() => navigate(ROUTES.CONTACT_DETAILS.replace(':id', duplicate.id))}
                      onLogEnquiry={() => handleLogEnquiry(duplicate.id)}
                    />
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ── STEP: Name ── */}
            {step === 'name' && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Full Name
                </label>
                <input
                  ref={nameRef}
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && form.name.trim().length >= 2) advance('source')
                  }}
                  className="w-full h-[72px] px-5 text-2xl rounded-2xl bg-muted/50 border-2 border-transparent focus:border-primary focus:bg-background focus:outline-none transition-all"
                  autoComplete="name"
                />
                <button
                  type="button"
                  disabled={form.name.trim().length < 2}
                  onClick={() => advance('source')}
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-35 hover:bg-primary/90 transition-colors active:scale-[0.98]"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ── STEP: Source ── */}
            {step === 'source' && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  How did they hear about us?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {SOURCES.map(({ key, emoji, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSourceSelect(key)}
                      className={cn(
                        'min-h-[80px] rounded-2xl border-2 flex flex-col items-center justify-center gap-2 p-3 transition-all active:scale-95',
                        form.source === key
                          ? 'border-primary bg-primary/10 shadow-sm shadow-primary/20'
                          : 'border-transparent bg-muted/50 hover:bg-muted hover:border-border'
                      )}
                    >
                      <span className="text-3xl leading-none">{emoji}</span>
                      <span className="text-[11px] font-semibold text-foreground/80">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP: Referrer ── */}
            {step === 'referrer' && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" /> Who referred them?
                </label>
                <ReferrerSearch
                  onSelect={(id, name) => doSave({ referrerId: id, referrerName: name })}
                  onSkip={() => doSave({ referrerId: null, referrerName: null })}
                />
              </div>
            )}

            {/* ── STEP: Campaign ── */}
            {step === 'campaign' && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Which campaign brought them?
                </label>
                <CampaignPicker
                  campaigns={campaigns}
                  onSelect={(id, name) => doSave({ campaignId: id, campaignName: name })}
                  onSkip={() => doSave({ campaignId: null, campaignName: null })}
                />
              </div>
            )}

            {/* ── STEP: Opening profile ── */}
            {step === 'opening' && (
              <OpeningProfile name={form.name} />
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Contact Entry View wrapper
// ─────────────────────────────────────────────────────────────

export function ContactEntryView() {
  const navigate = useAppNavigate()

  return (
    <div className="flex flex-col h-full px-4 md:px-6 pt-4 max-w-lg mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3 -ml-1 shrink-0 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-muted transition-colors active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Add Candidate
          </h1>
          <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
            Phone · Name · Source → Done
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto pb-10 scrollbar-hide">
        <QuickCaptureForm />
      </div>
    </div>
  )
}


