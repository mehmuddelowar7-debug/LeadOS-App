import React from 'react'
import type { ChatMessage as ChatMessageType } from '../../../sdk/ai/hooks/useAssistant'
import { Bot, User, CheckCircle, FileText } from 'lucide-react'

interface ChatMessageProps {
  message: ChatMessageType
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 p-4 ${isUser ? '' : 'bg-[var(--surface-sunken)] border-y border-[var(--border-subtle)]'}`}>
      <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${isUser ? 'bg-[var(--color-primary)] text-white' : 'bg-slate-700 text-emerald-400'}`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col gap-3 pt-1">
        <div className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
          {message.content}
        </div>

        {/* Render Structured Actions if available */}
        {message.response?.actions && message.response.actions.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Suggested Actions</div>
            {message.response.actions.map((action: any, idx: number) => (
              <div key={idx} className="flex flex-col gap-1.5 p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-base)]">
                <div className="flex items-center gap-2 font-medium text-sm text-[var(--color-primary)]">
                  <CheckCircle className="w-4 h-4" />
                  {action.recommendedAction}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  {action.reason}
                  {action.candidateId && <span className="ml-1 opacity-70">(Candidate: {action.candidateId})</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Render Citations if available */}
        {message.response?.citations && message.response.citations.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-2 border-t border-[var(--border-subtle)] pt-3">
            <div className="text-xs font-medium text-[var(--text-tertiary)] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Sources Used
            </div>
            {message.response.citations.map((cite: any, idx: number) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <span className="text-[var(--text-secondary)]">• {cite.fact}</span>
                <div className="flex gap-1 flex-wrap">
                  {cite.sources.map((src: string) => (
                    <span key={src} className="px-1.5 py-0.5 rounded-md bg-[var(--surface-hover)] text-[var(--text-tertiary)] text-[10px]">
                      {src}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
