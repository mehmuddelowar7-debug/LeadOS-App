import * as React from 'react'
import { eventBus } from './EventBus'
import type { EventType, EventPayload } from './types'

/**
 * React hook to safely subscribe to Global Event Bus events.
 * Automatically handles unsubscribing on component unmount.
 */
export function useEventSubscription<T extends EventType>(
  event: T,
  callback: (payload: EventPayload[T]) => void
) {
  // Use a ref to store the latest callback without triggering re-subscriptions
  const savedCallback = React.useRef(callback)

  React.useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  React.useEffect(() => {
    // We only subscribe once per event type
    const unsubscribe = eventBus.subscribe(event, (payload) => {
      if (savedCallback.current) {
        savedCallback.current(payload)
      }
    })
    
    return () => {
      unsubscribe()
    }
  }, [event])
}
