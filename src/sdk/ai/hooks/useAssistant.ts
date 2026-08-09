import { useState, useCallback } from 'react'
import { EdgeFunctionAdapter } from '@/sdk/ai/providers/adapters/EdgeFunctionAdapter'
import { PromptBuilder } from '@/sdk/ai/prompts/promptBuilder'
import type { ContextSnapshot } from '../schemas/context'
import type { AssistantResponse } from '../providers/types'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  response?: AssistantResponse // The structured response envelope from the assistant
}

export function useAssistant(snapshot: ContextSnapshot) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const adapter = new EdgeFunctionAdapter()

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return

    const userMessageId = crypto.randomUUID()
    const userMessage: ChatMessage = { id: userMessageId, role: 'user', content: text }
    
    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    try {
      // 1. Build the prompt document using the Knowledge Engine's PromptBuilder
      const document = PromptBuilder.buildNaturalLanguageQAPrompt(snapshot, text)
      
      // 2. We keep memory intentionally tiny (last 5 turns only)
      // The assistant only needs the current snapshot and the recent dialogue.
      // For Sprint 11B, memory is not even strictly required, but we can pass it if we want.
      // We'll extract only the recent AI responses that were actual documents (if we stored them).
      // Since PromptDocument is the unit, we just pass the new one.
      
      // 3. Send to adapter
      const response = await adapter.send(document)

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.message,
        response, // The full typed envelope with actions and citations
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error: ${err.message || 'Failed to communicate with AI Assistant.'}`
      }])
    } finally {
      setIsTyping(false)
    }
  }, [snapshot, adapter])

  const clearChat = useCallback(() => setMessages([]), [])

  return {
    messages,
    isTyping,
    sendMessage,
    clearChat
  }
}
