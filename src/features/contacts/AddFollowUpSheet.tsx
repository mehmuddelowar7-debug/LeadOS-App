import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Calendar, Clock, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import { pushToMutationQueue } from '@/lib/offlineSync'
import { insertFollowUp, updateFollowUp, insertContactActivity } from './queries'
import { useAuthStore } from '@/features/auth/AuthStore'
import type { FollowUp, Priority } from '@/types'

interface AddFollowUpSheetProps {
  open: boolean
  onClose: () => void
  contactId: string
  existingFollowUp?: FollowUp
}

export function AddFollowUpSheet({ open, onClose, contactId, existingFollowUp }: AddFollowUpSheetProps) {
  const user = useAuthStore(state => state.user)
  
  const [date, setDate] = useState<string>(existingFollowUp?.follow_up_date || dayjs().format('YYYY-MM-DD'))
  const [time, setTime] = useState<string>(existingFollowUp?.follow_up_time?.substring(0, 5) || dayjs().add(1, 'hour').format('HH:mm'))
  const [reminder, setReminder] = useState<string>(existingFollowUp?.reminder || '')
  const [priority, setPriority] = useState<Priority>(existingFollowUp?.priority || 'medium')
  const [status, setStatus] = useState<'pending' | 'completed' | 'missed'>(existingFollowUp?.status || 'pending')

  const handleSave = async () => {
    if (!date) {
      toast.error('Date is required')
      return
    }

    const payload: any = {
      workspace_id: user?.user_metadata?.workspace_id || '00000000-0000-0000-0000-000000000000',
      contact_id: contactId,
      created_by: user?.id || '00000000-0000-0000-0000-000000000000',
      follow_up_date: date,
      follow_up_time: time || null,
      reminder,
      priority,
      status,
    }

    try {
      if (existingFollowUp) {
        if (!navigator.onLine) {
          await pushToMutationQueue({ table: 'follow_ups', action: 'UPDATE', payload, matchField: 'id', matchValue: existingFollowUp.id })
        } else {
          await updateFollowUp(existingFollowUp.id, payload)
        }
        
        toast.success('Follow-up updated')
      } else {
        const insertPayload = {
          ...payload,
          id: crypto.randomUUID()
        }
        if (!navigator.onLine) {
          await pushToMutationQueue({ table: 'follow_ups', action: 'INSERT', payload: insertPayload })
        } else {
          await insertFollowUp(insertPayload)
        }
        
        // Log activity
        const actPayload = {
          id: crypto.randomUUID(),
          contact_id: contactId,
          workspace_id: user?.user_metadata?.workspace_id || '00000000-0000-0000-0000-000000000000',
          created_by: user?.id || '00000000-0000-0000-0000-000000000000',
          activity_type: 'follow_up_set',
          content: `Follow-up set for ${date} ${time} - ${reminder}`,
          activity_date: dayjs().format('YYYY-MM-DD')
        }
        if (!navigator.onLine) {
          await pushToMutationQueue({ table: 'contact_activities', action: 'INSERT', payload: actPayload })
        } else {
          await insertContactActivity(actPayload)
        }

        toast.success('Follow-up scheduled')
      }
      onClose()
    } catch (error: any) {
      toast.error(error.message)
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
                <h2 className="text-lg font-bold text-foreground">{existingFollowUp ? 'Edit Follow-up' : 'Schedule Follow-up'}</h2>
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

              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Reminder Note</Label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-4 h-5 w-5 text-muted-foreground" />
                  <textarea
                    value={reminder}
                    onChange={e => setReminder(e.target.value)}
                    placeholder="What to discuss..."
                    className="w-full min-h-[80px] pl-10 pt-4 pr-4 pb-4 rounded-2xl bg-muted/50 border-transparent focus:bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Priority</Label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={cn(
                        "flex-1 h-12 rounded-xl text-xs font-bold capitalize transition-colors border",
                        priority === p 
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-accent'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {existingFollowUp && (
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Status</Label>
                  <div className="flex gap-2">
                    {(['pending', 'completed', 'missed'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={cn(
                          "flex-1 h-12 rounded-xl text-xs font-bold capitalize transition-colors border",
                          status === s 
                            ? 'bg-primary/10 text-primary border-primary/30'
                            : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-accent'
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={handleSave} className="w-full h-14 rounded-2xl font-bold text-lg">
                <Save className="h-5 w-5 mr-2" /> {existingFollowUp ? 'Update Follow-up' : 'Schedule Follow-up'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
