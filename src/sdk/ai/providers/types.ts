import type { PromptDocument } from '../schemas/context'

export interface AssistantAction {
  recommendedAction: string
  candidateId?:      string
  reason:            string
  evidenceChain?:    string[]
}

export interface AssistantCitation {
  fact:    string
  sources: string[]
}

export interface AssistantResponse {
  message:    string
  actions:    AssistantAction[]
  citations:  AssistantCitation[]
  confidence: 'high' | 'medium' | 'low'
  
  usage?: {
    promptTokens:     number
    completionTokens: number
    totalTokens:      number
  }
}

export interface ContextDiffNode {
  field: string
  oldValue: string
  newValue: string
}

export interface CandidateSummaryResponse {
  overview: string
  timeline: string[]
  risks: string[]
  strengths: string[]
  recommendedActions: AssistantAction[]
  citations: AssistantCitation[]
  confidence: 'high' | 'medium' | 'low'
  diff?: ContextDiffNode[]
}

export interface DailyBriefResponse {
  greeting: string
  headline: string
  metrics: {
    criticalCandidates: number
    overdueFollowUps: number
    interviewsToday: number
  }
  estimatedTimeSavings: string
  estimatedCompletionTime: string
  executionOrder: AssistantAction[]
  risks: string[]
  marketing: {
    continue: string[]
    reduce: string[]
  }
  confidence: 'high' | 'medium' | 'low'
}

export interface BudgetSuggestion {
  campaignOrSource: string
  currentSpend: string
  suggestedSpend: string
}

export interface CampaignComparison {
  name: string
  joinRate: string
  cpl: string
  recommendation: 'Increase' | 'Pause' | 'Maintain'
}

export interface MarketingAnalysisResponse {
  overview: string
  health: 'Healthy' | 'Warning' | 'Critical'
  yesterdayMetrics: {
    spend: string
    leads: number
    joined: number
    cpj: string
  }
  recommendations: AssistantAction[]
  risks: string[]
  budgetSuggestions: BudgetSuggestion[]
  savings: string
  campaignComparisons: CampaignComparison[]
  citations: AssistantCitation[]
  confidence: 'high' | 'medium' | 'low'
}

export interface StreamCallbacks {
  onStart(): void
  onToken(token: string): void
  onComplete(response: AssistantResponse): void
  onError(error: Error): void
}

export interface ProviderCapabilities {
  streaming: boolean
  jsonMode: boolean
  functionCalling: boolean
}

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: AssistantCitation[]
  actions?: AssistantAction[]
  timestamp: string
  latency?: number
  streamed?: boolean
}

export interface ConversationSession {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  provider: string
  contextRevision: string
  messages: ConversationMessage[]
}

export interface AssistantChunk {
  delta: string
  // Additional stream metadata can be added later
}

/**
 * Gate 3: Final Provider Contract
 * 
 * Every AI provider MUST implement this exact interface.
 * No provider should ever expose vendor-specific types beyond this interface.
 */
export interface AIProvider {
  capabilities?: ProviderCapabilities
  
  /**
   * Send a provider-agnostic PromptDocument to the underlying LLM.
   */
  send<T = AssistantResponse>(document: PromptDocument, memory?: PromptDocument[], signal?: AbortSignal): Promise<T>
  
  /**
   * Stream a provider-agnostic PromptDocument.
   */
  stream?(document: PromptDocument, callbacks: StreamCallbacks, memory?: PromptDocument[], signal?: AbortSignal): Promise<void>
}
