import { useState, useCallback, useRef } from 'react'
import { EdgeFunctionAdapter } from '@/sdk/ai/providers/adapters/EdgeFunctionAdapter'
import { PromptBuilder } from '@/sdk/ai/prompts/promptBuilder'
import type { ContextSnapshot } from '@/sdk/ai/schemas/context'
import type { AssistantResponse } from '@/sdk/ai/providers/types'
import { useConversationStore } from './useConversationStore'

export function useStreamingAssistant(snapshot: ContextSnapshot | null) {
  const adapter = new EdgeFunctionAdapter()
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Expose real-time streamed message separately from the store so the UI can render it fast
  const [streamedContent, setStreamedContent] = useState<string>('')
  
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const store = useConversationStore()

  const stopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsGenerating(false)
    }
  }, [])

  const sendMessage = useCallback(async (question: string) => {
    if (!snapshot) return
    if (!question.trim()) return

    // 1. Create or get session
    let sessionId = store.activeSessionId
    if (!sessionId) {
      sessionId = store.createSession(
        question.slice(0, 30) + '...', 
        'MockProvider', // or get from adapter
        snapshot.context._metadata.cacheRevision
      )
    }

    // 2. Append User Message
    store.appendMessage(sessionId, {
      role: 'user',
      content: question,
      streamed: false
    })

    // 3. Prepare AI Request
    setIsGenerating(true)
    setError(null)
    setStreamedContent('')
    
    abortControllerRef.current = new AbortController()

    try {
      const document = PromptBuilder.buildNaturalLanguageQAPrompt(snapshot, question)
      
      // Bounded Memory: fetch last 5 messages from store to use as memory context if needed
      // (Implementation of memory array is omitted here, passing undefined for now as per v1)

      const startTime = performance.now()

      if (adapter.capabilities?.streaming && adapter.stream) {
        await adapter.stream(
          document,
          {
            onStart: () => {
              setStreamedContent('')
            },
            onToken: (token) => {
              setStreamedContent(prev => prev + token)
            },
            onComplete: (response: AssistantResponse) => {
              const latency = Math.round(performance.now() - startTime)
              store.appendMessage(sessionId!, {
                role: 'assistant',
                content: response.message,
                actions: response.actions,
                citations: response.citations,
                latency,
                streamed: true
              })
              setStreamedContent('')
              setIsGenerating(false)
            },
            onError: (err) => {
              setError(err.message)
              setIsGenerating(false)
            }
          },
          undefined, // no memory yet
          abortControllerRef.current.signal
        )
      } else {
        // Fallback to send()
        const response = await adapter.send<AssistantResponse>(document, undefined, abortControllerRef.current.signal)
        const latency = Math.round(performance.now() - startTime)
        
        store.appendMessage(sessionId, {
          role: 'assistant',
          content: response.message,
          actions: response.actions,
          citations: response.citations,
          latency,
          streamed: false
        })
        setIsGenerating(false)
      }

    } catch (err: any) {
      if (err.name === 'AbortError' || err.message === 'AbortError') {
        store.appendMessage(sessionId, {
          role: 'assistant',
          content: streamedContent + ' ... [Aborted]',
          streamed: true
        })
      } else {
        setError(err.message || 'Failed to get response')
      }
      setStreamedContent('')
      setIsGenerating(false)
    } finally {
      abortControllerRef.current = null
    }
  }, [snapshot, store, adapter, streamedContent])

  return {
    isGenerating,
    error,
    streamedContent,
    sendMessage,
    stopGenerating,
    
    // Pass store variables for convenience
    sessions: store.sessions,
    activeSessionId: store.activeSessionId,
    activeSession: store.activeSessionId ? store.sessions[store.activeSessionId] : null,
    setActiveSession: store.setActiveSession,
    clearAll: store.clearAll,
    deleteSession: store.deleteSession
  }
}
