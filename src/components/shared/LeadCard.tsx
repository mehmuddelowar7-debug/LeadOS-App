import { motion } from 'framer-motion'
import { Phone, MessageCircle, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatusBadge, ScoreBadge } from './StatusBadge'
import type { Contact, Opportunity } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

interface LeadCardProps {
  lead: Contact & Partial<Opportunity>
  onClick?: () => void
  className?: string
}

export function LeadCard({ lead, onClick, className }: LeadCardProps) {
  const initials = lead.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'glass-card rounded-2xl p-4 cursor-pointer transition-shadow hover:shadow-md active:shadow-sm',
        className
      )}
    >
      {/* Top Row: Avatar + Info + Score */}
      <div className="flex items-start gap-3">
        <Avatar className="h-11 w-11 ring-2 ring-border">
          <AvatarImage src={lead.photo_url ?? undefined} alt={lead.name} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground truncate">{lead.name}</h3>
            <ScoreBadge score={lead.score ?? 0} />
          </div>

          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
            {lead.origin && <span>{lead.origin}</span>}
            {lead.origin && lead.current_area && <span>·</span>}
            {lead.current_area && <span>{lead.current_area}</span>}
          </div>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <StatusBadge status={lead.status ?? 'new'} />
            {lead.experience && lead.experience !== 'fresher' && (
              <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                {lead.experience}yr exp
              </span>
            )}
            {lead.english_level !== 'none' && (
              <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full capitalize">
                {lead.english_level} EN
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Follow-up + Actions */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
        <div className="text-[11px] text-muted-foreground">
          {lead.next_followup ? (
            <span className={cn(
              dayjs(lead.next_followup).isBefore(dayjs()) && 'text-destructive font-medium'
            )}>
              Follow-up {dayjs(lead.next_followup).fromNow()}
            </span>
          ) : (
            <span>No follow-up set</span>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); window.open(`tel:${lead.phone}`) }}
            className="touch-target flex items-center justify-center h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
          >
            <Phone className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${lead.whatsapp || lead.phone}`) }}
            className="touch-target flex items-center justify-center h-8 w-8 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" />
          </button>
          {lead.location_lat && lead.location_lng && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${lead.location_lat},${lead.location_lng}`)
              }}
              className="touch-target flex items-center justify-center h-8 w-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors"
            >
              <MapPin className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
