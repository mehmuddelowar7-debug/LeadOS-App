/**
 * Feature Flags
 *
 * Controls which optional capabilities are active at build time.
 * Set in .env — changes require a dev server restart.
 *
 * VITE_ENABLE_AI=false  → AI panels hidden, no AI network calls made (default)
 * VITE_ENABLE_AI=true   → Full AI experience: briefing, assistant, summaries
 *
 * The CRM (pipeline, contacts, marketing, search, automation) is always
 * fully functional regardless of AI flag state.
 */

export const FEATURES = {
  /**
   * When false:
   *  - OperationsCoachBriefing is NOT rendered (no "AI Unavailable" message)
   *  - GlobalAssistant FAB is NOT rendered
   *  - useAIContextBuilder is NOT called
   *  - EdgeFunctionAdapter is NOT instantiated
   *  - Zero AI network requests are made
   *  - The Operations Center shows a clean deterministic summary instead
   *
   * When true:
   *  - Full AI experience restored without any CRM code changes
   */
  AI_ENABLED: import.meta.env.VITE_ENABLE_AI === 'true',
} as const
