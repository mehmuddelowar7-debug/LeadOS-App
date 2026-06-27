// =============================================================================
// LeadOS — TypeScript Types & Zod Schemas
// =============================================================================

import { z } from 'zod'

// =============================================================================
// ENUMS
// =============================================================================

export const OPPORTUNITY_STATUSES = [
  'new', 'interested', 'registration', 'recharge_pending',
  'recharge_completed', 'training', 'completed', 'activated', 'consulting', 'lost'
] as const
export type OpportunityStatus = typeof OPPORTUNITY_STATUSES[number]

export const CONTACT_ROLES = [
  'opportunity', 'referral_partner', 'uc_partner', 'friend', 'business_contact', 'influencer', 'other'
] as const
export type ContactRole = typeof CONTACT_ROLES[number]

export const REFERRAL_STATUSES = ['pending', 'successful', 'rejected'] as const
export type ReferralStatus = typeof REFERRAL_STATUSES[number]

export const REWARD_STATUSES = ['pending', 'paid'] as const
export type RewardStatus = typeof REWARD_STATUSES[number]

export const OPPORTUNITY_STATUS_LABELS: Record<OpportunityStatus, string> = {
  new: 'New Lead',
  interested: 'Interested',
  registration: 'Registration',
  recharge_pending: 'Recharge Pending',
  recharge_completed: 'Recharge Done',
  training: 'Training',
  completed: 'Completed',
  activated: 'Activated',
  consulting: 'Consulting',
  lost: 'Lost',
}

export const OPPORTUNITY_STATUS_COLORS: Record<OpportunityStatus, string> = {
  new: 'hsl(210, 100%, 56%)',
  interested: 'hsl(142, 71%, 45%)',
  registration: 'hsl(262, 83%, 58%)',
  recharge_pending: 'hsl(38, 92%, 50%)',
  recharge_completed: 'hsl(142, 76%, 36%)',
  training: 'hsl(199, 89%, 48%)',
  completed: 'hsl(160, 84%, 39%)',
  activated: 'hsl(142, 71%, 45%)',
  consulting: 'hsl(280, 71%, 45%)',
  lost: 'hsl(0, 84%, 60%)',
}

export const PRIORITIES = ['high', 'medium', 'low'] as const
export type Priority = typeof PRIORITIES[number]

export const GENDERS = ['female', 'male', 'other'] as const
export type Gender = typeof GENDERS[number]

export const ENGLISH_LEVELS = ['none', 'basic', 'intermediate', 'good'] as const
export type EnglishLevel = typeof ENGLISH_LEVELS[number]

export const INTERVIEW_READY_OPTIONS = ['yes', 'no', 'practice_needed'] as const
export type InterviewReady = typeof INTERVIEW_READY_OPTIONS[number]

export const EDUCATION_LEVELS = ['below_10', '10th', '12th', 'graduate', 'other'] as const
export type Education = typeof EDUCATION_LEVELS[number]

export const EXPERIENCE_LEVELS = ['fresher', '0-1', '1-3', '3-5', '5+'] as const
export type Experience = typeof EXPERIENCE_LEVELS[number]

export const SUPPORT_OPTIONS = ['yes', 'no', 'need_discussion', 'na'] as const
export type SupportStatus = typeof SUPPORT_OPTIONS[number]

export const INTEREST_LEVELS = ['very_interested', 'interested', 'maybe', 'not_interested'] as const
export type InterestLevel = typeof INTEREST_LEVELS[number]

export const CONTACT_SOURCES = ['walk_in', 'referral', 'instagram', 'facebook', 'whatsapp', 'friend', 'other'] as const
export type ContactSource = typeof CONTACT_SOURCES[number]

export const CALL_OUTCOMES = ['interested', 'busy', 'no_answer', 'call_later', 'wrong_number'] as const
export type CallOutcome = typeof CALL_OUTCOMES[number]

export const DOC_TYPES = ['aadhaar', 'pan', 'bank', 'photo'] as const
export type DocType = typeof DOC_TYPES[number]

export const DOC_STATUSES = ['available', 'pending', 'not_available'] as const
export type DocStatus = typeof DOC_STATUSES[number]

export const ACTIVITY_TYPES = [
  'created', 'called', 'whatsapp_sent', 'visited', 'note_added',
  'status_changed', 'registered', 'recharged', 'training_started',
  'training_completed', 'activated', 'document_updated', 'follow_up_set',
  'referral_received', 'reward_paid'
] as const
export type ActivityType = typeof ACTIVITY_TYPES[number]

export const GAMIFICATION_LEVELS = ['bronze', 'silver', 'gold', 'diamond'] as const
export type GamificationLevel = typeof GAMIFICATION_LEVELS[number]

export const ORIGINS = [
  'Assam', 'Meghalaya', 'Nagaland', 'Tripura', 'Mizoram',
  'Manipur', 'Arunachal Pradesh', 'West Bengal', 'Nepal', 'Bihar',
  'Jharkhand', 'Other'
] as const

export const SERVICES = [
  'Hair', 'Facial', 'Waxing', 'Threading', 'Pedicure',
  'Manicure', 'Spa', 'Massage', 'Bridal', 'Nail', 'Skin', 'Other'
] as const

export const OBJECTION_TAGS = [
  'Recharge', 'Parents', 'English', 'Training', 'Location',
  'Timing', 'Marriage', 'Salary', 'Fear', 'Other'
] as const

export const INCENTIVE_CATEGORIES = [
  'walk_in', 'referral', 'experienced_referral', 'training_completed'
] as const
export type IncentiveCategory = typeof INCENTIVE_CATEGORIES[number]

export const COMPETITORS = [
  'Urban Company', 'GetLook', 'Snabbit', 'Yes Madam', 'Other'
] as const
export type Competitor = typeof COMPETITORS[number]

// =============================================================================
// INTERFACES
// =============================================================================

export interface OpportunityType {
  id: string
  workspace_id: string
  name: string
  opportunity_type_type: string // e.g., 'beautician', 'insta_help'
  description: string | null
  is_active: boolean
  incentive_amount: number
  eligibility_rules: Record<string, unknown>
  status: string
  color: string | null
  icon: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  name: string
  slug: string
  logo_url: string | null
  config: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  daily_target: number
  created_at: string
}

export interface Contact {
  id: string
  workspace_id: string
  created_by: string
  updated_by: string | null

  name: string
  phone: string
  whatsapp: string | null
  age: number | null
  gender: Gender | null
  photo_url: string | null
  
  roles: ContactRole[]
  labels: string[]

  origin: string | null
  native_language: string | null
  current_area: string | null
  location_lat: number | null
  location_lng: number | null

  source: ContactSource

  notes: string | null
  custom_fields: Record<string, unknown>

  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string

  // Contact Health
  last_interaction_date: string | null
  total_referrals: number
  total_successful_referrals: number
  lifetime_referral_rewards: number

  // Relations
  opportunity?: Opportunity
  referrals_given?: Referral[]
  services?: ContactService[]
  documents?: ContactDocument[]
  activities?: ContactActivity[]
}

export interface Opportunity {
  id: string
  workspace_id: string
  contact_id: string

  opportunity_type_id: string | null 

  status: OpportunityStatus
  priority: Priority
  score: number
  score_label: 'hot' | 'warm' | 'cold'

  education: Education | null
  english_level: EnglishLevel
  interview_ready: InterviewReady
  experience: Experience | null

  parents_support: SupportStatus
  husband_support: SupportStatus

  has_android: boolean | null
  has_internet: boolean | null
  has_smartphone: boolean | null

  interest_level: InterestLevel
  objections: string[]

  competitor: string | null
  currently_working: boolean | null
  previous_company: string | null
  reason_for_switching: string | null
  expected_income: number | null
  notice_period: string | null

  next_followup: string | null
  reminder_time: string | null

  created_at: string
  updated_at: string

  opportunity_type?: OpportunityType
}

export interface Referral {
  id: string
  workspace_id: string
  referrer_id: string
  opportunity_id: string

  status: ReferralStatus
  reward_amount: number
  reward_status: RewardStatus
  payment_date: string | null

  created_at: string
  updated_at: string
}

export interface ContactService {
  id: string
  contact_id: string
  service_name: string
}

export interface ContactDocument {
  id: string
  contact_id: string
  doc_type: DocType
  status: DocStatus
  file_url: string | null
  created_at: string
  updated_at: string
}

export interface ContactActivity {
  id: string
  contact_id: string
  workspace_id: string
  activity_type: ActivityType
  content: string | null
  metadata: Record<string, unknown>
  created_by: string
  created_at: string
}


export interface Incentive {
  id: string
  workspace_id: string
  user_id: string
  contact_id: string | null
  category: IncentiveCategory
  amount: number
  earned_at: string
  created_at: string
}

export interface UserProfile {
  id: string
  display_name: string | null
  avatar_url: string | null
  phone: string | null
  level: GamificationLevel
  total_points: number
  current_streak: number
  longest_streak: number
  badges: string[]
  created_at: string
  updated_at: string
}

// =============================================================================
// ZOD SCHEMAS
// =============================================================================

// Walk-in Mode — 10 second entry (Decision #9)
export const walkInSchema = z.object({
  opportunity_type_id: z.string().min(1, 'OpportunityType is required'),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Valid phone required'),
  origin: z.string().optional(),
  current_area: z.string().optional(),
  interest_level: z.enum(['very_interested', 'interested', 'maybe', 'not_interested']).default('interested'),
  source: z.enum(['walk_in', 'referral', 'instagram', 'facebook', 'whatsapp', 'friend', 'other']).default('walk_in'),
})

export type WalkInFormData = z.infer<typeof walkInSchema>

// Full Lead Entry Schema
export const leadFormSchema = z.object({
  opportunity_type_id: z.string().min(1, 'OpportunityType is required'),

  // Personal
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Valid phone required'),
  whatsapp: z.string().optional(),
  age: z.number().min(14).max(80).optional(),
  gender: z.enum(['female', 'male', 'other']).optional(),

  // Location
  origin: z.string().optional(),
  native_language: z.string().optional(),
  current_area: z.string().optional(),
  education: z.enum(['below_10', '10th', '12th', 'graduate', 'other']).optional(),

  // English
  english_level: z.enum(['none', 'basic', 'intermediate', 'good']).default('none'),
  interview_ready: z.enum(['yes', 'no', 'practice_needed']).default('no'),

  // Experience
  experience: z.enum(['fresher', '0-1', '1-3', '3-5', '5+']).optional(),
  services: z.array(z.string()).default([]),

  // Competitor Tracking
  competitor: z.string().optional(),
  currently_working: z.boolean().optional(),
  previous_company: z.string().optional(),
  reason_for_switching: z.string().optional(),
  expected_income: z.number().optional(),
  notice_period: z.string().optional(),

  // Dynamic Fields
  custom_fields: z.record(z.string(), z.unknown()).default({}),

  // Documents
  documents: z.record(z.enum(['aadhaar', 'pan', 'bank', 'photo']), z.enum(['available', 'pending', 'not_available'])).optional(),

  // Family
  parents_support: z.enum(['yes', 'no', 'need_discussion', 'na']).default('na'),
  husband_support: z.enum(['yes', 'no', 'need_discussion', 'na']).default('na'),

  // Phone
  has_android: z.boolean().optional(),
  has_internet: z.boolean().optional(),
  has_smartphone: z.boolean().optional(),

  // Source
  source: z.enum(['walk_in', 'referral', 'instagram', 'facebook', 'whatsapp', 'friend', 'other']).default('walk_in'),
  referral_name: z.string().optional(),
  referral_phone: z.string().optional(),
  referral_reward: z.number().default(0),

  // Interest
  interest_level: z.enum(['very_interested', 'interested', 'maybe', 'not_interested']).default('maybe'),
  objections: z.array(z.string()).default([]),

  // Follow-up
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  next_followup: z.string().optional(),
  reminder_time: z.string().optional(),

  // Notes
  notes: z.string().optional(),
})

export type LeadFormData = z.infer<typeof leadFormSchema>



// =============================================================================
// LEAD SCORING (Decision #8 — Client-side mirror of DB function)
// =============================================================================

export function calculateOpportunityScore(opportunity: Partial<Opportunity>): number {
  let score = 0

  // Interest (30 points)
  switch (opportunity.interest_level) {
    case 'very_interested': score += 30; break
    case 'interested': score += 20; break
    case 'maybe': score += 10; break
  }

  // Skills (30 points total: English 15, Exp 15)
  switch (opportunity.english_level) {
    case 'good': score += 15; break
    case 'intermediate': score += 10; break
    case 'basic': score += 5; break
  }
  switch (opportunity.experience) {
    case '5+': score += 15; break
    case '3-5': score += 12; break
    case '1-3': score += 9; break
    case '0-1': score += 5; break
  }

  // Readiness (20 points: Smartphone 10, Docs 10)
  if (opportunity.has_smartphone) score += 10
  
  if (opportunity.education && opportunity.education !== 'below_10') {
    score += 10 
  }

  // Support (10 points)
  if (opportunity.parents_support === 'yes') score += 5
  if (opportunity.husband_support === 'yes' || opportunity.husband_support === 'na') score += 5

  return Math.min(score, 100)
}

export function getProbabilityLabel(score: number): 'High' | 'Medium' | 'Low' {
  if (score >= 75) return 'High'
  if (score >= 40) return 'Medium'
  return 'Low'
}
