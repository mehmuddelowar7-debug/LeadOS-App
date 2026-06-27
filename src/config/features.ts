/**
 * LeadOS Feature Flags
 * Use this file to toggle major business modules on and off without altering core logic.
 * In a true production environment, these flags can be hydrated from a backend (e.g., LaunchDarkly, Supabase Edge Config).
 */

export const FEATURES = {
  // Modules
  ENABLE_REFERRAL_NETWORK: true,
  ENABLE_OPPORTUNITIES: true,
  ENABLE_INCENTIVE_PAYOUTS: false, // Locked for V1

  // Beta Features
  ENABLE_AI_ASSISTANT: false, // V2 Roadmap
  ENABLE_VOICE_CAPTURE: false, // V2 Roadmap
  ENABLE_MAPS_INTEGRATION: false, // V2 Roadmap

  // Operational
  ENABLE_CRASH_REPORTING: import.meta.env.PROD, // Only enable in PROD
  ENABLE_OFFLINE_SYNC: true,
  ENABLE_PWA_INSTALL: true,
}

export type FeatureFlag = keyof typeof FEATURES

export function useFeatureFlag(flag: FeatureFlag): boolean {
  return FEATURES[flag]
}
