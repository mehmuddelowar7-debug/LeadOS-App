import type { EventType, EventPayload } from './types'

type EventCallback<T extends EventType> = (payload: EventPayload[T]) => void

class GlobalEventBus {
  private listeners: Map<EventType, Set<EventCallback<any>>> = new Map()

  /**
   * Subscribe to an event
   */
  subscribe<T extends EventType>(event: T, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    
    const callbacks = this.listeners.get(event)!
    callbacks.add(callback)

    // Return unsubscribe function
    return () => {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  /**
   * Dispatch an event to all subscribers
   */
  dispatch<T extends EventType>(event: T, payload: EventPayload[T]): void {
    const callbacks = this.listeners.get(event)
    
    // Log the event (useful for analytics or debugging)
    const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV
    if (isDev) {
      console.log(`[EventBus] ${event}`, payload)
    }

    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(payload)
        } catch (err) {
          console.error(`[EventBus] Error in callback for ${event}:`, err)
        }
      })
    }
  }
}

// Export singleton instance
export const eventBus = new GlobalEventBus()
