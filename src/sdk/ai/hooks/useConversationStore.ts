import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ConversationSession, ConversationMessage } from '../../../sdk/ai/providers/types'

interface ConversationState {
  sessions: Record<string, ConversationSession>
  activeSessionId: string | null
  
  createSession: (title: string, provider: string, contextRevision: string) => string
  setActiveSession: (id: string) => void
  appendMessage: (sessionId: string, message: Omit<ConversationMessage, 'id' | 'timestamp'>) => void
  updateMessage: (sessionId: string, messageId: string, updates: Partial<ConversationMessage>) => void
  renameSession: (id: string, title: string) => void
  deleteSession: (id: string) => void
  clearAll: () => void
}

const generateId = () => Math.random().toString(36).substring(2, 15)

export const useConversationStore = create<ConversationState>()(
  persist(
    (set) => ({
      sessions: {},
      activeSessionId: null,

      createSession: (title, provider, contextRevision) => {
        const id = generateId()
        const now = new Date().toISOString()
        const newSession: ConversationSession = {
          id,
          title,
          provider,
          contextRevision,
          createdAt: now,
          updatedAt: now,
          messages: []
        }
        set((state) => ({
          sessions: { ...state.sessions, [id]: newSession },
          activeSessionId: id
        }))
        return id
      },

      setActiveSession: (id) => set({ activeSessionId: id }),

      appendMessage: (sessionId, message) => {
        set((state) => {
          const session = state.sessions[sessionId]
          if (!session) return state

          const newMessage: ConversationMessage = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            ...message
          }

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                updatedAt: new Date().toISOString(),
                messages: [...session.messages, newMessage]
              }
            }
          }
        })
      },

      updateMessage: (sessionId, messageId, updates) => {
        set((state) => {
          const session = state.sessions[sessionId]
          if (!session) return state

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                updatedAt: new Date().toISOString(),
                messages: session.messages.map(msg => 
                  msg.id === messageId ? { ...msg, ...updates } : msg
                )
              }
            }
          }
        })
      },

      renameSession: (id, title) => {
        set((state) => {
          const session = state.sessions[id]
          if (!session) return state
          return {
            sessions: {
              ...state.sessions,
              [id]: { ...session, title, updatedAt: new Date().toISOString() }
            }
          }
        })
      },

      deleteSession: (id) => {
        set((state) => {
          const { [id]: _, ...rest } = state.sessions
          return {
            sessions: rest,
            activeSessionId: state.activeSessionId === id ? null : state.activeSessionId
          }
        })
      },

      clearAll: () => set({ sessions: {}, activeSessionId: null })
    }),
    {
      name: 'ai-conversation-storage'
    }
  )
)
