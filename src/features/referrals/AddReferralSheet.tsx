import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, IndianRupee, Save, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import { useContacts } from '@/hooks/useContacts'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/features/auth/AuthStore'
import { REFERRAL_STATUSES } from '@/types'
import type { Referral } from '@/types'
import { pushToMutationQueue } from '@/lib/offlineSync'

interface AddReferralSheetProps {
  open: boolean
  onClose: () => void
  existingReferral?: Referral
}

export function AddReferralSheet({ open, onClose, existingReferral }: AddReferralSheetProps) {
  const user = useAuthStore(state => state.user)
  const { data: contacts = [] } = useContacts()
  
  const [referrerId, setReferrerId] = useState<string>(existingReferral?.referrer_id || '')
  const [candidateId, setCandidateId] = useState<string>(existingReferral?.candidate_contact_id || '')
  const [commission, setCommission] = useState<string>(existingReferral?.commission_amount?.toString() || '3000')
  const [status, setStatus] = useState<string>(existingReferral?.status || 'pending')
  const [paidDate, setPaidDate] = useState<string>(existingReferral?.paid_date || dayjs().format('YYYY-MM-DD'))
  const [referralDate, setReferralDate] = useState<string>(existingReferral?.referral_date || dayjs().format('YYYY-MM-DD'))
  const [remarks, setRemarks] = useState<string>(existingReferral?.remarks || '')

  const [referrerSearchOpen, setReferrerSearchOpen] = useState(false)
  const [candidateSearchOpen, setCandidateSearchOpen] = useState(false)

  // Reset form when opened with a different existing referral or closed
  useEffect(() => {
    if (open) {
      setReferrerId(existingReferral?.referrer_id || '')
      setCandidateId(existingReferral?.candidate_contact_id || '')
      setCommission(existingReferral?.commission_amount?.toString() || '3000')
      setStatus(existingReferral?.status || 'pending')
      setPaidDate(existingReferral?.paid_date || dayjs().format('YYYY-MM-DD'))
      setReferralDate(existingReferral?.referral_date || dayjs().format('YYYY-MM-DD'))
      setRemarks(existingReferral?.remarks || '')
    }
  }, [open, existingReferral])

  const handleSave = async () => {
    if (!referrerId || !candidateId) {
      toast.error('Both referrer and candidate must be selected')
      return
    }

    const payload = {
      workspace_id: user?.user_metadata?.workspace_id || '00000000-0000-0000-0000-000000000000',
      referrer_id: referrerId,
      candidate_contact_id: candidateId,
      opportunity_id: null, // Temporary until we resolve strictly linking opportunities
      status: status,
      commission_amount: Number(commission),
      paid_date: status === 'paid' ? paidDate : null,
      referral_date: referralDate,
      remarks: remarks
    }

    try {
      if (existingReferral) {
        if (!navigator.onLine) {
          await pushToMutationQueue({ table: 'referrals', action: 'UPDATE', payload, matchField: 'id', matchValue: existingReferral.id })
        } else {
          const { error } = await supabase.from('referrals').update(payload).eq('id', existingReferral.id)
          if (error) throw error
        }
        toast.success('Referral updated')
      } else {
        const insertPayload = {
            ...payload,
            id: crypto.randomUUID()
        }
        if (!navigator.onLine) {
          await pushToMutationQueue({ table: 'referrals', action: 'INSERT', payload: insertPayload })
        } else {
          const { error } = await supabase.from('referrals').insert(insertPayload)
          if (error) throw error
        }
        toast.success('Referral added')
      }
      onClose()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const getContactName = (id: string) => contacts.find(c => c.id === id)?.name || 'Select Contact'

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border rounded-t-3xl p-5 shadow-xl max-h-[90vh] overflow-y-auto pb-safe"
          >
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-5" />

            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">{existingReferral ? 'Edit Referral' : 'Add Referral'}</h2>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5">
              
              {/* Referrer Selector (Mocked as simple button for now, should ideally open a contact search sheet) */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Referrer (Who referred?)</Label>
                <div 
                  className="w-full h-14 bg-muted/50 rounded-2xl flex items-center px-4 justify-between text-base font-medium cursor-pointer"
                  onClick={() => setReferrerSearchOpen(true)}
                >
                  <span className={referrerId ? 'text-foreground' : 'text-muted-foreground'}>
                    {referrerId ? getContactName(referrerId) : 'Select Referrer...'}
                  </span>
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              {/* Candidate Selector */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Candidate (Who was referred?)</Label>
                <div 
                  className="w-full h-14 bg-muted/50 rounded-2xl flex items-center px-4 justify-between text-base font-medium cursor-pointer"
                  onClick={() => setCandidateSearchOpen(true)}
                >
                  <span className={candidateId ? 'text-foreground' : 'text-muted-foreground'}>
                    {candidateId ? getContactName(candidateId) : 'Select Candidate...'}
                  </span>
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Commission Amount</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="number"
                      value={commission}
                      onChange={e => setCommission(e.target.value)}
                      className="pl-11 h-14 text-lg rounded-2xl bg-muted/50 border-transparent focus:bg-background"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Referral Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="date"
                      value={referralDate}
                      onChange={e => setReferralDate(e.target.value)}
                      className="pl-10 h-14 rounded-2xl bg-muted/50 border-transparent focus:bg-background"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Status</Label>
                <div className="flex gap-2">
                  {REFERRAL_STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={cn(
                        "flex-1 h-12 rounded-xl text-xs font-bold capitalize transition-colors border",
                        status === s 
                          ? s === 'approved' ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                          : s === 'paid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                          : s === 'rejected' ? 'bg-red-500/10 text-red-600 border-red-500/30'
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                          : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-accent'
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {status === 'paid' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Paid Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="date"
                      value={paidDate}
                      onChange={e => setPaidDate(e.target.value)}
                      className="pl-10 h-14 rounded-2xl bg-muted/50 border-transparent focus:bg-background"
                    />
                  </div>
                </motion.div>
              )}

              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Remarks</Label>
                <textarea
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Any notes..."
                  className="w-full min-h-[80px] p-4 rounded-2xl bg-muted/50 border-transparent focus:bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <Button onClick={handleSave} className="w-full h-14 rounded-2xl font-bold text-lg">
                <Save className="h-5 w-5 mr-2" /> Save Referral
              </Button>
            </div>
          </motion.div>

          {/* Simple Mock Contact Search Overlays */}
          {referrerSearchOpen && (
            <div className="fixed inset-0 bg-background z-[60] p-4 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <button onClick={() => setReferrerSearchOpen(false)} className="h-10 w-10 bg-muted rounded-full flex items-center justify-center"><X className="h-5 w-5" /></button>
                <h3 className="font-bold text-lg">Select Referrer</h3>
              </div>
              <div className="overflow-y-auto flex-1 space-y-2">
                {contacts.map(c => (
                  <div key={c.id} className="p-4 bg-muted rounded-xl cursor-pointer" onClick={() => { setReferrerId(c.id); setReferrerSearchOpen(false) }}>
                    <div className="font-bold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.phone}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {candidateSearchOpen && (
            <div className="fixed inset-0 bg-background z-[60] p-4 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <button onClick={() => setCandidateSearchOpen(false)} className="h-10 w-10 bg-muted rounded-full flex items-center justify-center"><X className="h-5 w-5" /></button>
                <h3 className="font-bold text-lg">Select Candidate</h3>
              </div>
              <div className="overflow-y-auto flex-1 space-y-2">
                {contacts.map(c => (
                  <div key={c.id} className="p-4 bg-muted rounded-xl cursor-pointer" onClick={() => { setCandidateId(c.id); setCandidateSearchOpen(false) }}>
                    <div className="font-bold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.phone}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  )
}
