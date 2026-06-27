import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Clock, Calendar, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import dayjs from 'dayjs'

interface CallLogSheetProps {
  open: boolean
  onClose: () => void
  leadId: string
  leadName: string
}

const OUTCOMES = [
  { id: 'interested', label: 'Interested', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
  { id: 'busy', label: 'Busy', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  { id: 'call_later', label: 'Call Later', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  { id: 'wrong_number', label: 'Wrong Number', color: 'bg-red-500/10 text-red-600 border-red-500/30' },
  { id: 'no_answer', label: 'No Answer', color: 'bg-gray-500/10 text-gray-600 border-gray-500/30' },
]

export function CallLogSheet({ open, onClose, leadId: _leadId, leadName }: CallLogSheetProps) {
  const [outcome, setOutcome] = useState<string>('interested')
  const [duration, setDuration] = useState<string>('2')
  const [notes, setNotes] = useState('')
  const [followupDate, setFollowupDate] = useState<string>(
    dayjs().add(1, 'day').format('YYYY-MM-DDTHH:mm')
  )

  const handleSave = () => {
    toast.success('Call logged successfully')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border rounded-t-3xl p-5 shadow-xl max-h-[90vh] overflow-y-auto pb-safe"
          >
            {/* Handle */}
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-5" />

            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">Log Call</h2>
                <p className="text-xs text-muted-foreground">with {leadName}</p>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Outcome */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Outcome</Label>
                <div className="flex flex-wrap gap-2">
                  {OUTCOMES.map(o => (
                    <button
                      key={o.id}
                      onClick={() => setOutcome(o.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                        outcome === o.id ? o.color : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent'
                      )}
                    >
                      {outcome === o.id && <Check className="inline h-3 w-3 mr-1" />}
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Duration (mins)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    className="pl-9 h-12 rounded-xl"
                  />
                </div>
              </div>

              {/* Follow-up */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Next Follow-up</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="datetime-local"
                    value={followupDate}
                    onChange={e => setFollowupDate(e.target.value)}
                    className="pl-9 h-12 rounded-xl"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Notes</Label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="What was discussed?"
                  className="w-full min-h-[100px] p-3 rounded-xl border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <Button onClick={handleSave} className="w-full h-12 rounded-xl font-semibold">
                <Save className="h-4 w-4 mr-2" /> Save Activity
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
