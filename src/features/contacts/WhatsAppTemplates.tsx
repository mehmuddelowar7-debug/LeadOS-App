import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Contact } from '@/types'

interface WhatsAppSheetProps {
  open: boolean
  onClose: () => void
  lead: Contact
}

const TEMPLATES = [
  {
    id: 'initial',
    name: 'Initial Contact',
    content: (lead: Contact) => `Hi ${lead.name.split(' ')[0]}! 👋 Thank you for your interest. We'd love to discuss the opportunity with you. When would be a good time to connect?`
  },
  {
    id: 'followup',
    name: 'Follow-up',
    content: (lead: Contact) => `Hi ${lead.name.split(' ')[0]}, just checking in! Are you still interested in the opportunity? Let me know if you have any questions.`
  },
  {
    id: 'training',
    name: 'Training Reminder',
    content: (lead: Contact) => `Hi ${lead.name.split(' ')[0]}! 📚 Gentle reminder that your training session is scheduled for tomorrow. Looking forward to seeing you there!`
  },
  {
    id: 'documents',
    name: 'Documents Reminder',
    content: (lead: Contact) => `Hi ${lead.name.split(' ')[0]}! 📋 Please share the required documents (Aadhaar, PAN) at your earliest convenience to complete your registration.`
  },
  {
    id: 'congrats',
    name: 'Congratulations',
    content: (lead: Contact) => `Congratulations ${lead.name.split(' ')[0]}! 🎉 You have successfully completed your training and are now activated. Welcome to the team!`
  }
]

export function WhatsAppSheet({ open, onClose, lead }: WhatsAppSheetProps) {
  const handleSend = (templateContent: string) => {
    const encoded = encodeURIComponent(templateContent)
    const phone = lead.whatsapp || lead.phone
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank')
    toast.success('Opened WhatsApp')
    onClose()
  }

  const handleCopy = (templateContent: string) => {
    navigator.clipboard.writeText(templateContent)
    toast.success('Template copied to clipboard')
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
                <h2 className="text-lg font-bold text-foreground">WhatsApp Templates</h2>
                <p className="text-xs text-muted-foreground">for {lead.name}</p>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {TEMPLATES.map(template => {
                const text = template.content(lead)
                return (
                  <div key={template.id} className="glass-card rounded-2xl p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">{template.name}</h3>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-xl">
                      {text}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 h-9 rounded-xl text-xs gap-1.5"
                        onClick={() => handleCopy(text)}
                      >
                        <Copy className="h-3 w-3" /> Copy
                      </Button>
                      <Button
                        className="flex-1 h-9 rounded-xl text-xs gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white"
                        onClick={() => handleSend(text)}
                      >
                        <Send className="h-3 w-3" /> Send
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
