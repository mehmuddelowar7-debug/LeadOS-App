import { useState } from 'react'
import { AssistantPanel } from './components/AssistantPanel'
import { useAIContextBuilder } from '../../sdk/ai'
import { Sparkles, Bot, Trash2 } from 'lucide-react'
import { useStreamingAssistant } from '../../sdk/ai/hooks/useStreamingAssistant'

export function GlobalAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const aiSnapshot = useAIContextBuilder('default', isOpen)
  
  const { 
    isGenerating, 
    error, 
    streamedContent, 
    sendMessage, 
    stopGenerating,
    activeSession,
    clearAll
  } = useStreamingAssistant(aiSnapshot)

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        aria-label="Open Recruiter Assistant"
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-40"
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-background border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
          <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-[var(--surface-sunken)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <h2 className="font-semibold">Recruiter Assistant</h2>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={clearAll}
                aria-label="Clear Memory"
                className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
                title="Clear Memory"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                aria-label="Close Assistant"
                className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:bg-muted rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          <AssistantPanel 
            snapshot={aiSnapshot} 
            session={activeSession}
            streamedContent={streamedContent}
            isGenerating={isGenerating}
            error={error}
            onSendMessage={sendMessage}
            onStopGenerating={stopGenerating}
          />
        </div>
      )}
    </>
  )
}
