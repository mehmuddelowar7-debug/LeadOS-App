import { useState } from 'react'
import { Bug, X, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import * as Sentry from '@sentry/react'

interface BugReportSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BugReportSheet({ open, onOpenChange }: BugReportSheetProps) {
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!description.trim()) return

    setIsSubmitting(true)
    
    try {
      // Create a manual error event in Sentry to capture the feedback
      Sentry.captureMessage('User Bug Report: ' + description, 'info')
      
      // Optionally attach user feedback explicitly to the captured event
      Sentry.captureFeedback({

        name: 'LeadOS User',
        email: 'user@leados.app',
        message: description,
      })

      // Simulate network delay for UX
      await new Promise(r => setTimeout(r, 800))
      
      toast.success('Bug report submitted. Thank you!')
      setDescription('')
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to submit bug report. Please try again.')
    } finally {
      setIsSubmitting(false)
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
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t rounded-t-3xl shadow-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Bug className="h-5 w-5 text-red-500" />
                Report an Issue
              </h2>
              <button onClick={() => onOpenChange(false)} className="p-2 rounded-full hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Describe what went wrong. Your app logs and device information will be securely attached to help us fix it faster.
            </p>

            <textarea
              className="w-full h-32 p-3 rounded-xl border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-sm"
              placeholder="What were you trying to do when it failed?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Button
              className="w-full mt-4 h-12 rounded-xl text-md font-bold"
              onClick={handleSubmit}
              disabled={!description.trim() || isSubmitting}
            >
              {isSubmitting ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" /> Submit Report
                </>
              )}
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
