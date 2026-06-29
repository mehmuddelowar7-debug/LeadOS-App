import { ROUTES } from '@/lib/routes'
import { useAppNavigate } from '@/lib/routes'
import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'react-router'
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { pushToMutationQueue } from '@/lib/offlineSync'
import { supabase } from '@/lib/supabase'
import {
  CONTACT_SOURCES,
} from '@/types'
import { useAuthStore } from '@/features/auth/AuthStore'


// ============================================================================
// Touch Card Select Component
// ============================================================================
interface TouchCardSelectProps {
  options: readonly string[]
  value: string | string[]
  onChange: (value: string | string[]) => void
  multiple?: boolean
  label: string
}

function TouchCardSelect({ options, value, onChange, multiple = false, label }: TouchCardSelectProps) {
  const selected = Array.isArray(value) ? value : [value]

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Label className="text-sm font-bold text-foreground uppercase tracking-wider">{label}</Label>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = selected.includes(option)
          return (
            <button
              key={option}
              type="button"
              onClick={() => {
                if (multiple) {
                  const arr = Array.isArray(value) ? value : []
                  onChange(isSelected ? arr.filter((v) => v !== option) : [...arr, option])
                } else {
                  onChange(option)
                }
              }}
              className={cn(
                'min-h-[64px] rounded-2xl text-sm font-bold transition-all border-2 touch-target flex flex-col items-center justify-center p-3 text-center active:scale-95',
                isSelected
                  ? 'bg-primary/10 border-primary text-primary shadow-sm'
                  : 'bg-muted/50 border-transparent text-muted-foreground hover:bg-accent'
              )}
            >
              {option.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// Quick Capture Form (Walk-in / Contact Entry)
// ============================================================================
function QuickCaptureForm() {
  const navigate = useAppNavigate()
  const user = useAuthStore(state => state.user)
  const [duplicateContact, setDuplicateContact] = useState<any>(null)
  
  const { register, handleSubmit, watch, setValue, formState: {} } = useForm<any>({
    defaultValues: { 
      roles: ['opportunity'],
      source: 'walk_in', 
      name: '',
      phone: '',
      current_area: '',
      origin: '',
      notes: '',
      entry_date: new Date().toISOString().split('T')[0]
    }
  })

  const phoneInputRef = useRef<HTMLInputElement>(null)

  const checkDuplicate = async (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      setDuplicateContact(null)
      return
    }
    
    try {
      const { data } = await supabase.from('contacts').select('id, name, phone').eq('phone', cleanPhone).maybeSingle()
      if (data) {
        setDuplicateContact(data)
      } else {
        setDuplicateContact(null)
      }
    } catch(e) {
      // ignore offline errors
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 10) val = val.slice(0, 10)
    setValue('phone', val)
    if (val.length === 10) {
       checkDuplicate(val)
    } else {
       setDuplicateContact(null)
    }
  }

  const handleMerge = () => {
    toast.success('Merged with existing contact!')
    navigate(`/contacts/${duplicateContact.id}`)
  }

  const onSubmit = async (data: any) => {
    const contactId = duplicateContact ? duplicateContact.id : crypto.randomUUID()
    const workspaceId = user?.user_metadata?.workspace_id || '00000000-0000-0000-0000-000000000000'
    const userId = user?.id || '00000000-0000-0000-0000-000000000000'
    
    const contactPayload = {
      id: contactId,
      workspace_id: workspaceId,
      created_by: userId,
      name: data.name,
      phone: data.phone,
      roles: data.roles,
      source: data.source,
      origin: data.origin,
      current_area: data.current_area,
      notes: data.notes,
      entry_date: data.entry_date
    }

    try {
      if (!navigator.onLine) {
        await pushToMutationQueue({ table: 'contacts', action: 'INSERT', payload: contactPayload })
        toast.success('Saved Offline')
      } else {
        if (!duplicateContact) {
          const { error } = await supabase.from('contacts').insert(contactPayload)
          if (error) throw error
        } else {
          const { error } = await supabase.from('contacts').update(contactPayload).eq('id', contactId)
          if (error) throw error
        }
        
        toast.success('Contact saved instantly!')
      }
      navigate(ROUTES.CONTACTS)
    } catch (err) {
      console.error(err)
      toast.error('Failed to save contact')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-[calc(100vh-140px)]">
      <div className="flex-1 overflow-y-auto space-y-8 pb-32 pt-2 px-1 scrollbar-hide">
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="contact-name" className="text-sm font-bold text-foreground uppercase tracking-wider">Full Name *</Label>
            <Input
              id="contact-name"
              placeholder="John Doe"
              className="h-16 text-xl rounded-2xl bg-muted/50 border-transparent focus:bg-background shadow-sm"
              {...register('name')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  phoneInputRef.current?.focus()
                }
              }}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-phone" className="text-sm font-bold text-foreground uppercase tracking-wider">Phone Number *</Label>
            <Input
              id="contact-phone"
              type="tel"
              placeholder="9876543210"
              inputMode="numeric"
              pattern="[0-9]*"
              className="h-16 text-xl font-mono tracking-wider rounded-2xl bg-muted/50 border-transparent focus:bg-background shadow-sm"
              {...register('phone')}
              ref={(e) => {
                register('phone').ref(e)
                // @ts-ignore
                phoneInputRef.current = e
              }}
              onChange={handlePhoneChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entry-date" className="text-sm font-bold text-foreground uppercase tracking-wider">Entry Date *</Label>
            <Input
              id="entry-date"
              type="date"
              className="h-16 text-xl rounded-2xl bg-muted/50 border-transparent focus:bg-background shadow-sm"
              {...register('entry_date')}
            />
          </div>
        </div>

        <AnimatePresence>
          {duplicateContact && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-2xl border-2 border-amber-500/30 bg-amber-500/10 p-4 flex flex-col gap-3 overflow-hidden"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400">Contact Already Exists</h4>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                {duplicateContact.name} ({duplicateContact.phone}) is already in the network.
              </p>
              <Button type="button" onClick={handleMerge} className="min-h-[52px] w-full bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl">
                Merge & Update Contact
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-4 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">More Details</h3>
            <div className="h-px bg-border flex-1" />
          </div>

          <TouchCardSelect
            label="Source"
            options={CONTACT_SOURCES}
            value={watch('source') || ''}
            onChange={(v) => setValue('source', v as string)}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-area" className="text-sm font-bold text-foreground uppercase tracking-wider">Location</Label>
              <Input
                id="contact-area"
                placeholder="e.g. Koramangala"
                className="h-14 text-base rounded-2xl bg-muted/50 border-transparent focus:bg-background shadow-sm"
                {...register('current_area')}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact-state" className="text-sm font-bold text-foreground uppercase tracking-wider">State</Label>
              <select
                id="contact-state"
                className="w-full h-14 text-base rounded-2xl bg-muted/50 border-transparent focus:bg-background shadow-sm px-4 focus:outline-none focus:ring-2 focus:ring-ring"
                {...register('origin')}
              >
                <option value="">Select State</option>
                {['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-notes" className="text-sm font-bold text-foreground uppercase tracking-wider">Notes</Label>
            <textarea
              id="contact-notes"
              placeholder="Any additional details..."
              className="w-full min-h-[100px] p-4 text-base rounded-2xl bg-muted/50 border-transparent focus:bg-background shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              {...register('notes')}
            />
          </div>
        </div>
        
      </div>

      <div className="sticky-bottom-safe pt-4 bg-gradient-to-t from-background via-background to-transparent pb-4 md:pb-0 z-50">
        <Button type="submit" className="w-full min-h-[64px] rounded-2xl text-xl font-bold shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]">
          <Save className="h-6 w-6 mr-2" /> Save Contact
        </Button>
      </div>
    </form>
  )
}

// ============================================================================
// Full Lead Entry Placeholder (Can be implemented later)
// ============================================================================
function FullEntryForm() {
  return (
    <div className="text-center py-10">
      <p className="text-muted-foreground">Full entry mode is being refactored for the new Contacts schema.</p>
    </div>
  )
}

// ============================================================================
// Contact Entry Router
// ============================================================================
export function ContactEntryView() {
  const navigate = useAppNavigate()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode') || 'quick'

  return (
    <div className="space-y-4 h-full flex flex-col px-4 md:px-6 lg:px-8 pt-4">
      {/* Header */}
      <div className="flex items-center gap-3 -ml-1 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="h-12 w-12 rounded-xl flex items-center justify-center hover:bg-muted transition-colors active:scale-95 touch-target"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {mode === 'quick' ? 'Quick Capture' : 'Full Entry'}
        </h1>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 shrink-0">
        {([
          { key: 'quick', label: 'Quick Capture', icon: '⚡' },
          { key: 'full', label: 'Full Entry', icon: '📋' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => navigate(tab.key === 'quick' ? ROUTES.QUICK_CAPTURE : `${ROUTES.CONTACTS_NEW}?mode=full`, { replace: true })}
            className={cn(
              'flex-1 py-3 rounded-lg text-sm font-bold transition-all touch-target',
              (mode === tab.key || (mode === 'quick' && window.location.pathname === ROUTES.QUICK_CAPTURE))
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-hidden">
        {(mode === 'quick' || window.location.pathname === ROUTES.QUICK_CAPTURE) && <QuickCaptureForm />}
        {mode === 'full' && window.location.pathname !== ROUTES.QUICK_CAPTURE && <FullEntryForm />}
      </div>
    </div>
  )
}
