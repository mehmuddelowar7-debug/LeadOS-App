/**
 * Prompt Builder
 * Assembles PromptDocuments from ContextSnapshot.
 * RULE: Never import from providers/adapters/.
 */
import type { ContextSnapshot, PromptDocument, PromptType } from '../schemas/context'
import { ContextSerializer } from '../serializer/contextSerializer'

function createPromptDocument(
  snapshot: ContextSnapshot,
  promptType: PromptType,
  system: string,
  contextString: string,
  instructions: string
): PromptDocument {
  return {
    system,
    context: contextString,
    instructions,
    metadata: {
      version: 'v1',
      masked: snapshot.context._metadata.masked,
      generatedAt: new Date().toISOString(),
      promptType,
    }
  }
}

export const PromptBuilder = {
  buildDailyBriefPrompt(snapshot: ContextSnapshot): PromptDocument {
    return createPromptDocument(
      snapshot,
      'daily_brief',
      'You are the RecruitOS AI Operations Coach. Your goal is to provide a concise morning briefing for the recruiter. Explain today\'s operational priorities. Do not invent priorities. Only summarize priorities already present in OperationsContext. If something is unavailable, write: "Not available in RecruitOS". You must return your response strictly as a JSON object matching the DailyBriefResponse schema.',
      ContextSerializer.serializeDomain(snapshot, 'operations'),
      'Based on the provided operations context, generate the daily brief in the exact JSON format requested.'
    )
  },

  buildCandidateSummaryPrompt(snapshot: ContextSnapshot, candidateId: string): PromptDocument {
    const candidate = snapshot.context.candidates.index.byId.get(candidateId)
    const contextString = candidate ? JSON.stringify(candidate) : 'Candidate not found.'

    return createPromptDocument(
      snapshot,
      'candidate_summary',
      'You are the RecruitOS Candidate Analyst. Your goal is to summarize a candidate\'s status. You must return your response strictly as a JSON object matching the CandidateSummaryResponse schema (overview, timeline, risks, strengths, recommendedActions, citations, confidence). If the context does not contain information, say "Not available in RecruitOS" instead of inferring.',
      contextString,
      'Summarize this candidate\'s acquisition source, engagement history, current risk, and recommended next action in a structured format.'
    )
  },

  buildCampaignAnalysisPrompt(snapshot: ContextSnapshot): PromptDocument {
    return createPromptDocument(
      snapshot,
      'campaign_analysis',
      'You are the RecruitOS Marketing Analyst. Never invent metrics. Never estimate conversions. Only summarize MarketingContext. If data is missing say "Not available in RecruitOS". You must return your response strictly as a JSON object matching the MarketingAnalysisResponse schema.',
      ContextSerializer.serializeDomain(snapshot, 'marketing'),
      'Analyze the provided marketing campaigns and sources. Generate the marketing briefing in the exact JSON format requested.'
    )
  },

  buildOperationsCoachPrompt(snapshot: ContextSnapshot): PromptDocument {
    return createPromptDocument(
      snapshot,
      'operations_coach',
      'You are the RecruitOS Operations Coach. Never invent metrics. If data is missing say "Not available in RecruitOS".',
      ContextSerializer.serializeDomain(snapshot, 'operations'),
      'Review the operations SLA and queues. Identify the biggest bottleneck and recommend an immediate action.'
    )
  },

  buildSearchAnswerPrompt(snapshot: ContextSnapshot, query: string): PromptDocument {
    return createPromptDocument(
      snapshot,
      'search_answer',
      'You are the RecruitOS Search Assistant. Never invent metrics. If data is missing say "Not available in RecruitOS".',
      ContextSerializer.compact(snapshot),
      `Answer this search query using ONLY the provided context: "${query}"`
    )
  },

  buildNaturalLanguageQAPrompt(snapshot: ContextSnapshot, question: string): PromptDocument {
    return createPromptDocument(
      snapshot,
      'natural_language_qa',
      'You are the RecruitOS AI Recruiter Assistant. Never invent metrics. If data is missing say "Not available in RecruitOS". You must return your response strictly as a JSON object matching this schema:\n\n{\n  "message": "The conversational answer to the recruiter.",\n  "actions": [{ "recommendedAction": "Action Name", "candidateId": "optional ID", "reason": "Why" }],\n  "citations": [{ "fact": "The fact you are citing", "sources": ["name of source", "name of source 2"] }],\n  "confidence": "high" | "medium" | "low"\n}',
      ContextSerializer.compact(snapshot),
      `Answer the recruiter's question accurately using the provided context: "${question}"`
    )
  }
}
