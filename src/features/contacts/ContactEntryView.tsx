import { ROUTES } from '@/lib/routes'
import { useAppNavigate } from '@/lib/routes'
import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'react-router'
import { ArrowLeft, Save, AlertTriangle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { pushToMutationQueue } from '@/lib/offlineSync'
import { supabase } from '@/lib/supabase'
import {
  CONTACT_ROLES,
  INTEREST_LEVELS, CONTACT_SOURCES,
} from '@/types'
import { useAuthStore } from '@/features/auth/AuthStore'
import { useOpportunityTypes } from '@/hooks/useOpportunityTypes'

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
  const { data: opportunityTypes = [] } = useOpportunityTypes()
  
  const { register, handleSubmit, watch, setValue, formState: {} } = useForm<any>({
    defaultValues: { 
      roles: ['opportunity'],
      source: 'walk_in', 
      interest_level: 'interested',
      opportunity_type_id: '',
      name: '',
      phone: ''
    }
  })

  const phoneInputRef = useRef<HTMLInputElement>(null)

  const checkDuplicate = async (phone: string) => {
    const cleanPhone = phone.replace(/\\D/g, '')
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
    let val = e.target.value.replace(/\\D/g, '')
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
    const isOpportunity = data.roles.includes('opportunity')
    
    if (isOpportunity && !data.opportunity_type_id) {
      toast.error('Please select a campaign type for the opportunity')
      return
    }

    if (!data.name || !data.phone) {
      toast.error('Name and Phone are required')
      return
    }

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
      current_area: data.current_area
    }

    try {
      if (!navigator.onLine) {
        await pushToMutationQueue({ table: 'contacts', action: 'INSERT', payload: contactPayload })
        
        if (isOpportunity) {
           await pushToMutationQueue({
             table: 'opportunities',
             action: 'INSERT',
             payload: {
               id: crypto.randomUUID(),
               workspace_id: workspaceId,
               contact_id: contactId,
               opportunity_type_id: data.opportunity_type_id,
               status: 'new',
               interest_level: data.interest_level
             }
           })
        }
        toast.success('Saved Offline')
      } else {
        // Simple insert for mock purposes. Merge would normally use upsert.
        if (!duplicateContact) {
          const { error } = await supabase.from('contacts').insert(contactPayload)
          if (error) throw error
        }
        
        if (isOpportunity && !duplicateContact) {
           const { error: candError } = await supabase.from('opportunities').insert({
               id: crypto.randomUUID(),
               workspace_id: workspaceId,
               contact_id: contactId,
               opportunity_type_id: data.opportunity_type_id,
               status: 'new',
               interest_level: data.interest_level
           })
           if (candError) throw candError
        }
        
        toast.success('Contact saved instantly!')
      }
      navigate(ROUTES.CONTACTS)
    } catch (err) {
      console.error(err)
      toast.error('Failed to save contact')
    }
  }

  const selectedOpportunityType = watch('opportunity_type_id')
  const selectedRoles = watch('roles') || []

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

        <TouchCardSelect
          label="1. Select Roles"
          options={CONTACT_ROLES}
          value={selectedRoles}
          onChange={(v) => setValue('roles', v as string[])}
          multiple
        />

        {selectedRoles.includes('opportunity') && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Label className="text-sm font-bold text-foreground uppercase tracking-wider">2. Campaign *</Label>
            <div className="grid grid-cols-2 gap-3">
              {opportunityTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setValue('opportunity_type_id', type.id)}
                  className={cn(
                    'min-h-[64px] rounded-2xl flex items-center justify-between px-5 font-bold transition-all border-2 touch-target active:scale-95',
                    selectedOpportunityType === type.id 
                      ? `bg-${type.color}-500/10 border-${type.color}-500 text-${type.color}-600 dark:text-${type.color}-400 shadow-sm`
                      : 'bg-muted/50 border-transparent text-muted-foreground hover:bg-accent'
                  )}
                >
                  <span className="truncate mr-2 text-base">{type.name}</span>
                  {selectedOpportunityType === type.id && <Check className="h-6 w-6 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedRoles.includes('opportunity') && (
          <TouchCardSelect
            label="3. Interest Level"
            options={INTEREST_LEVELS}
            value={watch('interest_level')}
            onChange={(v) => setValue('interest_level', v as string)}
          />
        )}

        <TouchCardSelect
          label={selectedRoles.includes('opportunity') ? "4. Source" : "2. Source"}
          options={CONTACT_SOURCES}
          value={watch('source') || ''}
          onChange={(v) => setValue('source', v as string)}
        />
        
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
            onClick={() => navigate(`/contacts/new?mode=${tab.key}`, { replace: true })}
            className={cn(
              'flex-1 py-3 rounded-lg text-sm font-bold transition-all touch-target',
              mode === tab.key
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
        {mode === 'quick' && <QuickCaptureForm />}
        {mode === 'full' && <FullEntryForm />}
      </div>
    </div>
  )
}
