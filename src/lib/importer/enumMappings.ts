import type { OpportunityStatus } from '@/types'

/**
 * Normalizes common spreadsheet status terms to strict DB enums.
 */
export function mapPipelineStage(raw: string | undefined | null): OpportunityStatus {
  if (!raw) return 'new'
  
  const normalized = raw.trim().toLowerCase()
  
  if (normalized.includes('screening done') || normalized.includes('interested')) return 'interested'
  if (normalized.includes('selected') || normalized.includes('registration')) return 'registration'
  if (normalized.includes('recharge pending')) return 'recharge_pending'
  if (normalized.includes('recharge completed')) return 'recharge_completed'
  if (normalized.includes('training')) return 'training'
  if (normalized.includes('completed')) return 'completed'
  if (normalized.includes('activated') || normalized.includes('joined')) return 'activated'
  if (normalized.includes('consulting')) return 'consulting'
  if (normalized.includes('reject') || normalized.includes('lost')) return 'lost'
  
  // Custom states added for connection mappings
  if (normalized === 'dnp' || normalized.includes('do not proceed')) return 'lost'
  
  return 'new'
}

/**
 * Normalizes connection status
 */
export function mapConnectionStatus(raw: string | undefined | null): string {
  if (!raw) return 'not_connected'
  
  const normalized = raw.trim().toLowerCase()
  if (normalized.includes('connected') && !normalized.includes('not')) return 'connected'
  if (normalized.includes('not connected')) return 'not_connected'
  if (normalized.includes('hung up') || normalized.includes('cut')) return 'hung_up'
  if (normalized.includes('switch') || normalized.includes('switched off')) return 'switch_off'
  if (normalized === 'dnp' || normalized.includes('do not proceed')) return 'do_not_proceed'
  if (normalized.includes('call later') || normalized.includes('busy')) return 'call_later'
  if (normalized.includes('no incoming') || normalized.includes('invalid')) return 'no_incoming'
  
  return 'not_connected'
}

/**
 * Normalizes candidate category (NE?)
 */
export function mapCandidateCategory(raw: string | undefined | null): string {
  if (!raw) return 'other'
  
  const normalized = raw.trim().toLowerCase()
  if (normalized.includes('ne') && normalized.includes('fresher')) return 'ne_fresher'
  if (normalized.includes('ne') && (normalized.includes('exp') || normalized.includes('experienced'))) return 'ne_experienced'
  
  return 'other'
}

/**
 * Normalizes common spreadsheet source terms to strict DB enums.
 */
export function mapSource(raw: string | undefined | null): string {
  if (!raw) return 'other'
  
  const normalized = raw.trim().toLowerCase()
  
  if (normalized.includes('instagram') || normalized.includes('ig')) return 'instagram'
  if (normalized.includes('facebook') || normalized.includes('fb')) return 'facebook'
  if (normalized.includes('direct') || normalized.includes('walk-in') || normalized.includes('walkin') || normalized === 'own') return 'walk_in'
  if (normalized.includes('agent') || normalized.includes('referral') || normalized.includes('partner')) return 'referral'
  if (normalized.includes('whatsapp') || normalized.includes('wa')) return 'whatsapp'
  if (normalized.includes('google')) return 'google'
  
  return 'other'
}
