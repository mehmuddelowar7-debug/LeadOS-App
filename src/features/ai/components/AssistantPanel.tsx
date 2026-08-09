import React, { useState, useEffect, useRef } from 'react'
import { Send, Loader2, StopCircle, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import type { ContextSnapshot } from '@/sdk/ai/schemas/context'
import type { ConversationSession } from '@/sdk/ai/providers/types'

interface AssistantPanelProps {
  snapshot: ContextSnapshot | null
  session: ConversationSession | null
  streamedContent: string
  isGenerating: boolean
  error: string | null
  onSendMessage: (query: string) => void
  onStopGenerating: () => void
}

export const AssistantPanel: React.FC<AssistantPanelProps> = ({ 
  snapshot, 
  session, 
  streamedContent, 
  isGenerating, 
  error, 
  onSendMessage,
  onStopGenerating
}) => {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isContextStale = session && snapshot && session.contextRevision !== snapshot.context._metadata.cacheRevision

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.messages, streamedContent])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isGenerating) return
    onSendMessage(input)
    setInput('')
  }

  return (
    <div className="flex flex-col h-full bg-[var(--surface-base)] relative">
      
      {/* Context Mismatch Warning */}
      {isContextStale && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 p-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-600">
            <p className="font-semibold mb-1">RecruitOS data has changed.</p>
            <p className="opacity-80 mb-2">Continuing will use the updated context.</p>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {(!session || session.messages.length === 0) && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
            <SparklesIcon className="w-8 h-8 text-primary mb-4 opacity-50" />
            <p className="text-sm font-medium text-foreground">How can I help you today?</p>
            <p className="text-xs text-muted-foreground mt-2">Ask about candidates, marketing budgets, or daily operations.</p>
          </div>
        )}

        {session?.messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`
              max-w-[85%] rounded-2xl px-4 py-3 text-sm
              ${msg.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-[var(--surface-sunken)] text-foreground border border-[var(--border-subtle)]'
              }
            `}>
              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
            
            {/* Actions (if present) */}
            {msg.role === 'assistant' && msg.actions && msg.actions.length > 0 && (
              <div className="mt-3 space-y-2 w-[85%]">
                {msg.actions.map((action, idx) => (
                  <div key={idx} className="glass-card rounded-xl p-3 border border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-xs text-primary">{action.recommendedAction}</span>
                    </div>
                    <p className="text-[10px] text-foreground pl-6">{action.reason}</p>
                  </div>
                ))}
              </div>
            )}
            
            {/* Citations (if present) */}
            {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {msg.citations.map((cite, idx) => (
                  <span key={idx} className="text-[9px] px-2 py-0.5 rounded bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-muted-foreground uppercase font-bold" title={cite.fact}>
                    {cite.sources.join(', ')}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {/* Streaming Placeholder */}
        {isGenerating && streamedContent && (
          <div className="flex flex-col items-start">
            <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-[var(--surface-sunken)] text-foreground border border-[var(--border-subtle)]">
              <p className="leading-relaxed whitespace-pre-wrap">
                {streamedContent}
                <span className="inline-block w-1 h-3 ml-1 bg-primary animate-pulse" />
              </p>
            </div>
          </div>
        )}
        
        {isGenerating && !streamedContent && (
           <div className="flex flex-col items-start">
             <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-[var(--surface-sunken)] border border-[var(--border-subtle)] flex items-center gap-2">
               <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
               <span className="text-muted-foreground">Thinking...</span>
             </div>
           </div>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[var(--surface-sunken)] border-t border-[var(--border-subtle)]">
        
        {/* Stop Generating Button */}
        {isGenerating && (
          <div className="flex justify-center mb-3">
            <button 
              onClick={onStopGenerating}
              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface-base)] hover:bg-muted border border-[var(--border-subtle)] rounded-full text-xs font-semibold text-foreground transition-colors"
            >
              <StopCircle className="w-3.5 h-3.5 text-red-400" />
              Stop Generating
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={!snapshot ? "Building context..." : "Ask the Recruiter Assistant..."}
            disabled={!snapshot || isGenerating}
            className="w-full bg-[var(--surface-base)] border border-[var(--border-subtle)] rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
          />
          <button 
            type="submit"
            aria-label="Send message"
            disabled={!input.trim() || !snapshot || isGenerating}
            className="absolute right-2 p-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50 disabled:hover:bg-primary transition-colors"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>

        {/* Diagnostics Footer */}
        {session && session.messages.length > 0 && (
          <div className="mt-3 flex items-center justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {session.messages[session.messages.length - 1].latency || 0}ms
            </span>
            <span>{session.provider}</span>
            <span>Rev: {session.contextRevision}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/>
      <path d="M19 17v4"/>
      <path d="M3 5h4"/>
      <path d="M17 19h4"/>
    </svg>
  )
}
