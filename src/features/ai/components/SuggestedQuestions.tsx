import React from 'react'
import { MessageSquarePlus } from 'lucide-react'

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void
}

const QUESTIONS = [
  "Who should I call first?",
  "Summarize today's work.",
  "Show critical candidates.",
  "Why is Instagram weak?",
  "Which recharge is overdue?",
  "What should I do next?"
]

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({ onSelect }) => {
  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="text-sm font-medium text-[var(--text-secondary)] mb-1">Suggested Questions</div>
      <div className="flex flex-wrap gap-2">
        {QUESTIONS.map(q => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            className="flex items-center gap-2 text-left text-sm px-3 py-2 bg-[var(--surface-sunken)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] rounded-lg transition-colors text-[var(--text-primary)]"
          >
            <MessageSquarePlus className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}
