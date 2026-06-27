import type { Opportunity, ContactActivity, Contact } from '@/types'

// ============================================================================
// Types
// ============================================================================

export type RiskFlag = {
  id: string
  label: string
  type: 'danger' | 'warning' | 'info'
  description: string
}

export type NextAction = {
  id: string
  label: string
  action: 'call' | 'whatsapp' | 'meeting' | 'system'
  priority: 'high' | 'medium' | 'low'
  description: string
}

// ============================================================================
// Risk Flags Engine
// ============================================================================

export function calculateRiskFlags(opportunity: Partial<Opportunity>): RiskFlag[] {
  const flags: RiskFlag[] = []

  // Family Concern
  if (opportunity.husband_support === 'no' || opportunity.parents_support === 'no') {
    flags.push({
      id: 'family_concern',
      label: 'Family Concern',
      type: 'danger',
      description: 'Opportunity lacks support from family, high risk of drop-off.'
    })
  } else if (opportunity.husband_support === 'need_discussion' || opportunity.parents_support === 'need_discussion') {
    flags.push({
      id: 'family_discussion',
      label: 'Family Needs Discussion',
      type: 'warning',
      description: 'Family needs convincing before proceeding.'
    })
  }

  // English Practice Needed
  if (opportunity.english_level === 'none' || opportunity.interview_ready === 'practice_needed') {
    flags.push({
      id: 'english_practice',
      label: 'English Practice Needed',
      type: 'warning',
      description: 'Opportunity needs language training before interviews.'
    })
  }

  // Recharge Objection
  if (opportunity.objections?.includes('Recharge')) {
    flags.push({
      id: 'recharge_objection',
      label: 'Recharge Objection',
      type: 'danger',
      description: 'Opportunity is hesitant about the recharge fee.'
    })
  }

  // Already Working
  if (opportunity.currently_working) {
    flags.push({
      id: 'already_working',
      label: 'Already Working',
      type: 'info',
      description: `Currently employed at ${opportunity.competitor || 'another company'}.`
    })
  }

  // Follow-up Overdue
  if (opportunity.next_followup && new Date(opportunity.next_followup) < new Date()) {
    flags.push({
      id: 'followup_overdue',
      label: 'Follow-up Overdue',
      type: 'danger',
      description: 'A scheduled follow-up was missed.'
    })
  }

  // Lost Contact
  // Real logic would look at ContactActivities. For now, mock based on status.
  if (opportunity.status === 'lost') {
    flags.push({
      id: 'lost_contact',
      label: 'Lost Contact',
      type: 'danger',
      description: 'Lead has been marked as lost or unresponsive.'
    })
  }

  return flags
}

// ============================================================================
// Next Best Action Engine
// ============================================================================

export function calculateNextAction(opportunity: Partial<Opportunity>, activities: ContactActivity[] = []): NextAction {
  const hasCalls = activities.length > 0
  const isOverdue = opportunity.next_followup && new Date(opportunity.next_followup) < new Date()

  // 1. New Lead
  if (opportunity.status === 'new') {
    if (!hasCalls) {
      return {
        id: 'call_new', label: 'Call Immediately', action: 'call', priority: 'high',
        description: 'Lead is brand new. Contact them immediately while intent is high.'
      }
    }
    return {
      id: 'followup_new', label: 'Follow up on first call', action: 'call', priority: 'medium',
      description: 'You tried calling once. Try again or send a WhatsApp.'
    }
  }

  // 2. Overdue Follow-ups take precedence
  if (isOverdue) {
    return {
      id: 'call_overdue', label: 'Complete Overdue Follow-up', action: 'call', priority: 'high',
      description: 'This follow-up is past its scheduled time.'
    }
  }

  // 3. Status-based rules
  switch (opportunity.status) {
    case 'interested':
      return {
        id: 'invite_registration', label: 'Invite for Registration', action: 'whatsapp', priority: 'high',
        description: 'Opportunity is interested. Send them office directions for registration.'
      }
    
    case 'registration':
      // Check if docs are missing (mock check for now)
      return {
        id: 'request_docs', label: 'Request Missing Documents', action: 'whatsapp', priority: 'high',
        description: 'Ensure opportunity brings Aadhaar and Pan card.'
      }
    
    case 'recharge_pending':
      return {
        id: 'remind_recharge', label: 'Remind About Recharge', action: 'call', priority: 'high',
        description: 'Opportunity needs to complete the security deposit.'
      }
    
    case 'recharge_completed':
      return {
        id: 'schedule_training', label: 'Schedule Training', action: 'system', priority: 'medium',
        description: 'Recharge is done. Allocate a training batch.'
      }
    
    case 'training':
      return {
        id: 'confirm_training', label: 'Confirm Training Arrival', action: 'call', priority: 'medium',
        description: 'Call to ensure opportunity arrives for training today.'
      }
      
    case 'completed':
      return {
        id: 'activate', label: 'Activate Opportunity', action: 'system', priority: 'high',
        description: 'Training is complete. Mark opportunity as activated for placement.'
      }

    case 'activated':
      return {
        id: 'check_in', label: 'Placement Check-in', action: 'call', priority: 'low',
        description: 'Opportunity is placed. Call to check how work is going.'
      }

    default:
      return {
        id: 'default', label: 'Review Lead', action: 'system', priority: 'low',
        description: 'Review lead details to determine next steps.'
      }
  }
}

// ============================================================================
// Relationship Maintenance Engine
// ============================================================================

export function calculateRelationshipReminders(contact: Partial<Contact>): NextAction[] {
  const reminders: NextAction[] = []

  // Check if contact has high value
  const isHighValue = (contact.total_successful_referrals && contact.total_successful_referrals > 0) || 
                      (contact.labels && contact.labels.includes('VIP'))

  if (isHighValue) {
    const lastInteraction = contact.last_interaction_date ? new Date(contact.last_interaction_date) : new Date(contact.created_at || new Date())
    const daysSinceInteraction = Math.floor((new Date().getTime() - lastInteraction.getTime()) / (1000 * 3600 * 24))

    if (daysSinceInteraction >= 30) {
      reminders.push({
        id: 'nurture_high_value',
        label: 'Check-in with Top Partner',
        action: 'call',
        priority: 'high',
        description: `No interaction for ${daysSinceInteraction} days. Call to maintain relationship.`
      })
    }
  }

  return reminders
}
