import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import type { ContactProfileData } from '@/hooks/useContactProfile'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact: ContactProfileData
}

export function ContactEditSheet({ open, onOpenChange, contact }: Props) {
  const queryClient = useQueryClient()
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState<any>({
    name: contact.name || '',
    phone: contact.phone || '',
    whatsapp: contact.whatsapp || '',
    source: contact.source || '',
    current_area: contact.current_area || '',
    city: contact.custom_fields?.city || '',
    state: contact.custom_fields?.state || '',
    education: contact.opportunity?.education || '',
    english_level: contact.opportunity?.english_level || 'none',
    experience: contact.opportunity?.experience || '',
    current_salary: (contact.opportunity as any)?.current_salary || '',
    expected_salary: (contact.opportunity as any)?.expected_salary || '',
  })

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Name and Phone are required')
      return
    }

    setIsSaving(true)
    try {
      const contactUpdate = supabase
        .from('contacts')
        .update({
          name: form.name.trim(),
          phone: form.phone.trim(),
          whatsapp: form.whatsapp.trim() || null,
          source: form.source.trim() || 'walk_in',
          current_area: form.current_area.trim() || null,
          custom_fields: {
            ...contact.custom_fields,
            city: String(form.city).trim() || undefined,
            state: String(form.state).trim() || undefined,
          }
        })
        .eq('id', contact.id)

      const oppUpdate = contact.opportunity ? supabase
        .from('opportunities')
        .update({
          education: form.education.trim() || null,
          english_level: form.english_level || 'none',
          experience: form.experience.trim() || null,
          current_salary: form.current_salary ? Number(form.current_salary) : null,
          expected_salary: form.expected_salary ? Number(form.expected_salary) : null,
        })
        .eq('id', contact.opportunity.id) : Promise.resolve({ error: null })

      const [contactRes, oppRes] = await Promise.all([contactUpdate, oppUpdate])

      if (contactRes.error) throw contactRes.error
      if (oppRes.error) throw oppRes.error

      toast.success('Profile updated successfully')
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['contact-profile', contact.id] })
      onOpenChange(false)
    } catch (err: any) {
      toast.error('Failed to update: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[2.5rem] p-0 overflow-hidden flex flex-col h-[85vh]">
        <SheetHeader className="p-6 pb-4 border-b shrink-0 text-left">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold">Edit Profile</SheetTitle>
            <Button onClick={handleSave} disabled={isSaving} size="sm" className="rounded-xl px-6 h-9 font-bold bg-primary text-primary-foreground hover:bg-primary/90">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </SheetHeader>
        
        <div className="p-6 pt-4 space-y-5 overflow-y-auto">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
            <Input 
              value={form.name} 
              onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))}
              placeholder="Candidate Name"
              className="h-12 bg-muted/50 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone</label>
              <Input 
                value={form.phone} 
                onChange={e => setForm((f: any) => ({ ...f, phone: e.target.value }))}
                placeholder="e.g. 94771234567"
                className="h-12 bg-muted/50 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">WhatsApp</label>
              <Input 
                value={form.whatsapp} 
                onChange={e => setForm((f: any) => ({ ...f, whatsapp: e.target.value }))}
                placeholder="e.g. 94771234567"
                className="h-12 bg-muted/50 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Area / Location</label>
            <Input 
              value={form.current_area} 
              onChange={e => setForm((f: any) => ({ ...f, current_area: e.target.value }))}
              placeholder="e.g. Colombo 04"
              className="h-12 bg-muted/50 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">City</label>
              <Input 
                value={form.city} 
                onChange={e => setForm((f: any) => ({ ...f, city: e.target.value }))}
                placeholder="e.g. Colombo"
                className="h-12 bg-muted/50 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">State/Province</label>
              <Input 
                value={form.state} 
                onChange={e => setForm((f: any) => ({ ...f, state: e.target.value }))}
                placeholder="e.g. Western Province"
                className="h-12 bg-muted/50 rounded-xl"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Source</label>
            <select 
              value={form.source}
              onChange={e => setForm((f: any) => ({ ...f, source: e.target.value }))}
              className="flex h-12 w-full rounded-xl border border-input bg-muted/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="walk_in">Walk-in</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="referral">Referral</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">English Level</label>
            <select 
              value={form.english_level}
              onChange={e => setForm((f: any) => ({ ...f, english_level: e.target.value }))}
              className="flex h-12 w-full rounded-xl border border-input bg-muted/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="none">None</option>
              <option value="basic">Basic</option>
              <option value="intermediate">Intermediate</option>
              <option value="good">Good</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Current Salary</label>
              <Input 
                value={form.current_salary} 
                onChange={e => setForm((f: any) => ({ ...f, current_salary: e.target.value }))}
                type="number"
                placeholder="e.g. 35000"
                className="h-12 bg-muted/50 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Expected Salary</label>
              <Input 
                value={form.expected_salary} 
                onChange={e => setForm((f: any) => ({ ...f, expected_salary: e.target.value }))}
                type="number"
                placeholder="e.g. 45000"
                className="h-12 bg-muted/50 rounded-xl"
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
