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
  
  return 'new'
}

/**
 * Normalizes common spreadsheet source terms to strict DB enums.
 */
export function mapSource(raw: string | undefined | null): string {
  if (!raw) return 'other'
  
  const normalized = raw.trim().toLowerCase()
  
  if (normalized.includes('instagram') || normalized.includes('ig')) return 'instagram'
  if (normalized.includes('facebook') || normalized.includes('fb')) return 'facebook'
  if (normalized.includes('direct') || normalized.includes('walk-in') || normalized.includes('walkin')) return 'walk_in'
  if (normalized.includes('agent') || normalized.includes('referral')) return 'referral'
  if (normalized.includes('whatsapp') || normalized.includes('wa')) return 'whatsapp'
  
  return 'other'
}
