# AI Architecture Baseline v1.0

> **Status:** FROZEN  
> **Last Updated:** Sprint AI RC1  
> **Replaces:** AI_CONTEXT_BASELINE_v1.md (Merged into final spec)

This document represents the frozen architecture of the RecruitOS AI Layer (v1.0). All future AI features (including Sprint 11F Streaming) must adhere strictly to these contracts.

---

## 1. Architectural Philosophy

1. **Provider Independence:** The AI Engine must never directly leak LLM provider logic (e.g., Gemini, OpenAI) into React components. Providers exist solely behind the `AIProvider` interface.
2. **"Explain, Don't Invent":** Prompts must explicitly instruct the LLM to summarize existing context and forbid inventing metrics. If data is missing, the LLM must return: *"Not available in RecruitOS."*
3. **Read-Only / No Mutations:** The AI Engine is strictly a read-only advisor. It is barred from executing database writes or Supabase mutations.
4. **Zero Backend Drift:** Context is built dynamically from the React Query cache on the client, minimizing latency and eliminating duplicated backend aggregation endpoints.

---

## 2. Core Contracts

### A. AIProvider Interface
All AI providers (EdgeFunction, Mock, FakeGemini) must implement this contract:
```typescript
export interface AIProvider {
  send<T = AssistantResponse>(document: PromptDocument, memory?: PromptDocument[]): Promise<T>
  stream(document: PromptDocument, memory?: PromptDocument[]): AsyncIterable<AssistantChunk>
}
```

### B. PromptDocument
The normalized envelope sent to the adapter:
```typescript
export interface PromptDocument {
  system: string
  context: string
  instructions: string
  metadata: {
    version: 'v1'
    masked: boolean
    generatedAt: string
    promptType: string
  }
}
```

### C. ContextSnapshot
The unified application state output by `useAIContextBuilder`:
```typescript
export interface ContextSnapshot {
  context: {
    candidates: CandidateDomain
    marketing: MarketingDomain
    operations: OperationsDomain
    recruiter: RecruiterDomain
    workspace: WorkspaceDomain
    _metadata: { timestamp: string, masked: boolean, workspaceId: string }
  }
  revisions: { candidateRev: number, marketingRev: number, operationsRev: number, workspaceRev: number }
}
```

---

## 3. Supported Prompt Types & Responses

| Prompt Type | Response Schema | Usage |
| :--- | :--- | :--- |
| `candidate_summary` | `CandidateSummaryResponse` | CandidateProfileView (Sprint 11C) |
| `daily_brief` | `DailyBriefResponse` | OperationsCoachBriefing (Sprint 11E) |
| `campaign_analysis` | `MarketingAnalysisResponse` | MarketingAnalystBrief (Sprint 11D) |
| `search_answer` | `AssistantResponse` | GlobalAssistant (Sprint 11B) |
| `natural_language_qa` | `AssistantResponse` | GlobalAssistant (Sprint 11B) |

---

## 4. Latency Benchmarks (Local Mock)

| Operation | Baseline Target | Measured (Mock/RC1) |
| :--- | :--- | :--- |
| Context Builder (500 records) | < 20 ms | ~1.62 ms |
| Serializer (operations domain) | < 5 ms | < 1 ms |
| Prompt Gen | < 2 ms | < 1 ms |
| Provider Adapter (Mock) | < 100 ms | < 5 ms |
| **Total Render Latency** | **< 500 ms** | **~250 ms** |

---

## 5. Security & Privacy
- **PII Masking:** Enforced via `masked: true` in the `ContextBuilder`. Emails, phone numbers, and exact financial details are deterministically masked before serialization.
- **Role-Based Scope:** The Context Builder strictly builds from the current user's authenticated React Query cache, ensuring the AI cannot analyze data the user lacks permission to see.

---

> **Note to Developers:** Sprint 11F (Streaming & Memory) will introduce iterative `stream()` calls and `memory` arrays to the `AIProvider`. It must **not** modify `PromptDocument` or `ContextSnapshot`.
