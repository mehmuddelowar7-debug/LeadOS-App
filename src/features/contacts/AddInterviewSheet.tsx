import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Calendar, Clock, MapPin, Building } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import { pushToMutationQueue } from '@/lib/offlineSync'
import { insertInterview, updateInterview, insertContactActivity } from './queries'
import { useAuthStore } from '@/features/auth/AuthStore'
import type { Interview } from '@/types'

interface AddInterviewSheetProps {
  open: boolean
  onClose: () => void
  contactId: string
  existingInterview?: Interview
}

const INTERVIEW_STATUSES = ['scheduled', 'attended', 'no_show', 'rescheduled', 'cancelled'] as const

export function AddInterviewSheet({ open, onClose, contactId, existingInterview }: AddInterviewSheetProps) {
  const user = useAuthStore(state => state.user)
  
  const [date, setDate] = useState<string>(existingInterview?.interview_date || dayjs().format('YYYY-MM-DD'))
  const [time, setTime] = useState<string>(existingInterview?.interview_time?.substring(0, 5) || dayjs().format('HH:mm'))
  const [location, setLocation] = useState<string>(existingInterview?.location || '')
  const [branch, setBranch] = useState<string>(existingInterview?.branch || '')
  const [status, setStatus] = useState<string>(existingInterview?.status || 'scheduled')
  const [notes, setNotes] = useState<string>(existingInterview?.notes || '')

  const handleSave = async () => {
    if (!date || !time) {
      toast.error('Date and time are required')
      return
    }

    const payload: any = {
      workspace_id: user?.user_metadata?.workspace_id || '00000000-0000-0000-0000-000000000000',
      contact_id: contactId,
      created_by: user?.id || '00000000-0000-0000-0000-000000000000',
      interview_date: date,
      interview_time: time,
      location,
      branch,
      status,
      notes,
    }

    try {
      if (existingInterview) {
        if (!navigator.onLine) {
          await pushToMutationQueue({ table: 'interviews', action: 'UPDATE', payload, matchField: 'id', matchValue: existingInterview.id })
        } else {
          await updateInterview(existingInterview.id, payload)
        }
        
        // Log activity if status changed
        if (existingInterview.status !== status) {
          await logActivity(`interview_${status}`, `Interview status changed to ${status}`)
        }
        
        toast.success('Interview updated')
      } else {
        const insertPayload = {
          ...payload,
          id: crypto.randomUUID()
        }
        if (!navigator.onLine) {
          await pushToMutationQueue({ table: 'interviews', action: 'INSERT', payload: insertPayload })
        } else {
          await insertInterview(insertPayload)
        }
        
        await logActivity('interview_scheduled', `Interview scheduled for ${date} at ${time}`)
        toast.success('Interview scheduled')
      }
      onClose()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const logActivity = async (type: string, content: string) => {
    const actPayload = {
      id: crypto.randomUUID(),
      contact_id: contactId,
      workspace_id: user?.user_metadata?.workspace_id || '00000000-0000-0000-0000-000000000000',
      created_by: user?.id || '00000000-0000-0000-0000-000000000000',
      activity_type: type,
      content,
      activity_date: dayjs().format('YYYY-MM-DD')
    }
    if (!navigator.onLine) {
      await pushToMutationQueue({ table: 'contact_activities', action: 'INSERT', payload: actPayload })
    } else {
      await insertContactActivity(actPayload)
    }
  }

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
                <h2 className="text-lg font-bold text-foreground">{existingInterview ? 'Edit Interview' : 'Schedule Interview'}</h2>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="pl-10 h-14 rounded-2xl bg-muted/50 border-transparent focus:bg-background"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="time"
                      value={time}
                      onChange={e => setTime(e.target.value)}
                      className="pl-10 h-14 rounded-2xl bg-muted/50 border-transparent focus:bg-background"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="Address or Link"
                      className="pl-10 h-14 rounded-2xl bg-muted/50 border-transparent focus:bg-background"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Branch</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      value={branch}
                      onChange={e => setBranch(e.target.value)}
                      placeholder="Branch name"
                      className="pl-10 h-14 rounded-2xl bg-muted/50 border-transparent focus:bg-background"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Status</Label>
                <div className="flex flex-wrap gap-2">
                  {INTERVIEW_STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={cn(
                        "flex-1 min-w-[30%] h-12 rounded-xl text-xs font-bold capitalize transition-colors border",
                        status === s 
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-accent'
                      )}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Notes</Label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any preparations..."
                  className="w-full min-h-[80px] p-4 rounded-2xl bg-muted/50 border-transparent focus:bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <Button onClick={handleSave} className="w-full h-14 rounded-2xl font-bold text-lg">
                <Save className="h-5 w-5 mr-2" /> {existingInterview ? 'Update Interview' : 'Schedule Interview'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
