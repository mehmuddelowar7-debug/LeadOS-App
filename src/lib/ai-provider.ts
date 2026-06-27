// =============================================================================
// LeadOS — AI Provider Interface (Decision #10)
// =============================================================================
// Pluggable architecture: supports OpenAI, Gemini, Anthropic, Local Browser AI.
// Default: Browser Web Speech API (no API key needed).
// =============================================================================

import type { LeadFormData } from '@/types'

// =============================================================================
// Provider Interface
// =============================================================================

export interface AIProviderConfig {
  name: string
  apiKey?: string
  model?: string
  baseUrl?: string
}

export interface VoiceTranscription {
  text: string
  confidence: number
  language: string
}

export interface LeadExtractionResult {
  fields: Partial<LeadFormData>
  confidence: number
  rawText: string
}

export interface WhatsAppMessageResult {
  message: string
  language: string
}

export interface FollowUpSuggestion {
  priority: 'high' | 'medium' | 'low'
  suggestedDate: string
  reason: string
}

export interface MeetingSummary {
  summary: string
  actionItems: string[]
  nextSteps: string[]
}

/**
 * AI Provider Interface — all AI providers must implement this.
 * This allows swapping between OpenAI, Gemini, Anthropic, or local AI
 * without changing any business logic.
 */
export interface AIProvider {
  readonly name: string

  /** Transcribe voice audio to text */
  transcribeVoice(audioBlob: Blob): Promise<VoiceTranscription>

  /** Extract structured lead data from natural language text */
  extractLeadFromText(text: string): Promise<LeadExtractionResult>

  /** Generate a WhatsApp message for a lead */
  generateWhatsAppMessage(context: {
    leadName: string
    status: string
    notes?: string
    language?: string
  }): Promise<WhatsAppMessageResult>

  /** Suggest optimal follow-up timing */
  suggestFollowUp(context: {
    leadName: string
    lastActivity: string
    interestLevel: string
    notes?: string
  }): Promise<FollowUpSuggestion>

  /** Summarize a meeting or call */
  summarizeMeeting(transcript: string): Promise<MeetingSummary>
}

// =============================================================================
// Browser Speech API Provider (Default — No API key needed)
// =============================================================================

export class BrowserSpeechProvider implements AIProvider {
  readonly name = 'Browser Speech API'

  async transcribeVoice(_audioBlob: Blob): Promise<VoiceTranscription> {
    // Browser speech recognition is handled inline via SpeechRecognition API
    // This method is for providers that accept audio blobs (like Whisper)
    throw new Error('Use the SpeechRecognition API directly for browser-based speech.')
  }

  async extractLeadFromText(text: string): Promise<LeadExtractionResult> {
    const fields: Partial<LeadFormData> = {}
    const lower = text.toLowerCase()

    // Origin detection
    const origins = [
      'assam', 'meghalaya', 'nagaland', 'tripura', 'mizoram',
      'manipur', 'arunachal pradesh', 'west bengal', 'nepal',
      'bihar', 'jharkhand'
    ]
    for (const origin of origins) {
      if (lower.includes(origin)) {
        fields.origin = origin.charAt(0).toUpperCase() + origin.slice(1)
        break
      }
    }

    // English level detection
    if (lower.includes('good english') || lower.includes('fluent english')) {
      fields.english_level = 'good'
    } else if (lower.includes('intermediate english')) {
      fields.english_level = 'intermediate'
    } else if (lower.includes('basic english')) {
      fields.english_level = 'basic'
    } else if (lower.includes('no english')) {
      fields.english_level = 'none'
    }

    // Interest detection
    if (lower.includes('very interested') || lower.includes('highly interested')) {
      fields.interest_level = 'very_interested'
    } else if (lower.includes('interested')) {
      fields.interest_level = 'interested'
    } else if (lower.includes('not interested')) {
      fields.interest_level = 'not_interested'
    }

    // Education detection
    if (lower.includes('graduate') || lower.includes('graduation')) {
      fields.education = 'graduate'
    } else if (lower.includes('12th') || lower.includes('twelve')) {
      fields.education = '12th'
    } else if (lower.includes('10th') || lower.includes('tenth')) {
      fields.education = '10th'
    }

    // Follow-up detection
    const dayMatch = lower.match(/call\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday|tomorrow|today)/i)
    if (dayMatch) {
      fields.notes = (fields.notes || '') + `Call ${dayMatch[1]}.`
    }

    // Parent support detection
    if (lower.includes('parents need') || lower.includes('parents want')) {
      fields.parents_support = 'need_discussion'
      const daysMatch = lower.match(/parents need\s+(\d+)\s+day/)
      if (daysMatch) {
        fields.notes = (fields.notes || '') + ` Parents need ${daysMatch[1]} days.`
      }
    } else if (lower.includes('parents support') || lower.includes('parents ok') || lower.includes('parents agree')) {
      fields.parents_support = 'yes'
    }

    // Name extraction (first capitalized word that's not a keyword)
    const nameMatch = text.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/)
    if (nameMatch) {
      const potentialName = nameMatch[1]
      const keywords = origins.map(o => o.toLowerCase())
      if (!keywords.includes(potentialName.toLowerCase())) {
        fields.name = potentialName
      }
    }

    // Set remaining text as notes
    fields.notes = (fields.notes || '') + `\n[Voice] ${text}`

    return {
      fields,
      confidence: Object.keys(fields).length > 2 ? 0.8 : 0.5,
      rawText: text,
    }
  }

  async generateWhatsAppMessage(context: {
    leadName: string
    status: string
    notes?: string
    language?: string
  }): Promise<WhatsAppMessageResult> {
    // Simple template-based message generation (no AI needed)
    const templates: Record<string, string> = {
      new: `Hi ${context.leadName}! 👋 Thank you for your interest. We'd love to discuss the opportunity with you. When would be a good time to connect?`,
      interested: `Hi ${context.leadName}! 🌟 Great to hear about your interest! Here are the next steps for registration. Let me know if you have any questions.`,
      registration: `Hi ${context.leadName}! 📋 Your registration is in progress. Please share the required documents at your earliest convenience.`,
      recharge_pending: `Hi ${context.leadName}! 💳 Just a gentle reminder about the pending recharge. Let me know if you need any help with it.`,
      training: `Hi ${context.leadName}! 📚 Your training session is scheduled. Looking forward to seeing you there!`,
      completed: `Hi ${context.leadName}! 🎉 Congratulations on completing your training! You're now ready to start.`,
    }

    return {
      message: templates[context.status] || `Hi ${context.leadName}! How are you doing? Let's connect soon.`,
      language: context.language || 'en',
    }
  }

  async suggestFollowUp(context: {
    leadName: string
    lastActivity: string
    interestLevel: string
  }): Promise<FollowUpSuggestion> {
    // Simple rule-based suggestions
    const now = new Date()
    let daysToAdd = 2
    let priority: 'high' | 'medium' | 'low' = 'medium'
    let reason = 'Regular follow-up'

    if (context.interestLevel === 'very_interested') {
      daysToAdd = 1
      priority = 'high'
      reason = 'High interest — follow up quickly'
    } else if (context.interestLevel === 'not_interested') {
      daysToAdd = 7
      priority = 'low'
      reason = 'Low interest — check back in a week'
    }

    const suggestedDate = new Date(now.getTime() + daysToAdd * 86400000).toISOString()

    return { priority, suggestedDate, reason }
  }

  async summarizeMeeting(_transcript: string): Promise<MeetingSummary> {
    return {
      summary: 'Meeting summary will be available when an AI provider is configured.',
      actionItems: [],
      nextSteps: ['Configure an AI provider (OpenAI, Gemini, or Anthropic) for full meeting summarization.'],
    }
  }
}

// =============================================================================
// Provider Factory
// =============================================================================

let currentProvider: AIProvider = new BrowserSpeechProvider()

export function getAIProvider(): AIProvider {
  return currentProvider
}

export function setAIProvider(provider: AIProvider): void {
  currentProvider = provider
}

// Future providers can be registered like:
// setAIProvider(new OpenAIProvider({ apiKey: '...' }))
// setAIProvider(new GeminiProvider({ apiKey: '...' }))
// setAIProvider(new AnthropicProvider({ apiKey: '...' }))
