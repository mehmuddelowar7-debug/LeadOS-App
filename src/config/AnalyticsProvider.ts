/**
 * AnalyticsProvider
 * A lightweight telemetry provider interface. 
 * Prevents vendor lock-in and isolates analytics logic from UI components.
 */

export interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
}

class AnalyticsProvider {
  private isInitialized = false

  init() {
    if (this.isInitialized) return
    // e.g., posthog.init(...)
    this.isInitialized = true
    console.log('[Analytics] Initialized')
  }

  identify(userId: string, traits?: Record<string, any>) {
    // e.g., posthog.identify(userId, traits)
    console.log(`[Analytics] Identify: ${userId}`, traits)
  }

  track(event: AnalyticsEvent) {
    // e.g., posthog.capture(event.name, event.properties)
    console.log(`[Analytics] Track: ${event.name}`, event.properties)
  }
}

export const analytics = new AnalyticsProvider()
