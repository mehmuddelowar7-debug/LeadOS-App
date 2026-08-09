# ADR-006: AI Knowledge Engine Architecture (Revised v2)

**Status:** Accepted  
**Date:** August 2026  
**Author:** Principal AI Architect  
**Sprint:** 11A  
**Revision:** 2 (incorporates 10 architectural refinements from review)  
**Referenced by:** ROADMAP_v2.md (v1.1), AI_CONTEXT_BASELINE_v1.md

---

## Context

RecruitOS v1.0 is a stable production platform with rich, live business state distributed across six engine systems. Sprints 11B–11F require AI features that need complete, structured awareness of all six domains simultaneously.

The original ADR-006 was approved at 9.8/10, but required 10 targeted refinements before implementation could begin. This revision incorporates all of them. The original decisions (versioned context, read-only, pure builders, provider independence, useMemo, PII masking) remain frozen.

---

## The 10 Refinements (Incorporated)

### Refinement 1 — Modular Context Composition
**Problem:** Building one giant `RecruitOSContext` on every render means a single interview change forces rebuilding candidates, marketing, operations, workspace, and recruiter simultaneously.

**Solution:** Each domain builds its own independent context. `RecruitOSContext` is composed only from these already-built domain contexts.

```
buildCandidateContext()    ← rebuilds only when contacts/interviews/followUps change
buildMarketingContext()    ← rebuilds only when campaigns/sources change
buildOperationsContext()   ← rebuilds only when queues/automations change
buildWorkspaceContext()    ← rebuilds only when aggregate metrics change
buildRecruiterContext()    ← rebuilds only when today's tasks change

        ↓ compose (useMemo, only when any domain changes)

buildRecruitOSContext()    ← assembles domains + metadata
```

### Refinement 2 — PromptDocument instead of raw strings
**Problem:** Returning raw strings from the Prompt Builder means AI providers must reparse and re-structure the prompt, and there is no standard envelope for system vs. context vs. instructions.

**Solution:** Prompt Builder returns `PromptDocument`. Each adapter converts `PromptDocument` → provider-specific API call.

```typescript
interface PromptDocument {
  system:       string        // Role and constraints for the AI
  context:      string        // Serialized RecruitOS business context
  instructions: string        // Specific task instructions
  metadata: {
    version:     'v1'
    masked:      boolean       // Whether PII was masked
    generatedAt: string
    promptType:  PromptType
  }
}
```

### Refinement 3 — Context Metadata
Every `RecruitOSContext` snapshot carries a `_metadata` block for debugging, observability, and cache validation.

```typescript
interface ContextMetadata {
  contextVersion: 'v1'
  generatedAt:    string
  buildDurationMs: number
  candidateCount:  number
  marketingCount:  number
  workspaceId:     string
  cacheRevision:   number     // Increments on each rebuild
  masked:          boolean
}
```

### Refinement 4 — Domain Builder Diagnostics
Every domain builder exposes a `diagnostics` result alongside its context. This is invaluable when AI gives unexpected answers.

```typescript
interface BuilderDiagnostics {
  domain:          string
  durationMs:      number
  processed:       number
  warnings:        string[]
  skipped:         string[]
  errors:          string[]
}
```

### Refinement 5 — Serializer Layer
Context → Serializer → Compact representation → Prompt Builder. The serializer is a separate module with multiple output modes.

```
RecruitOSContext
       ↓
   Serializer
   ├── compact()   ← Token-optimized for AI API calls
   ├── verbose()   ← Full detail for debugging
   ├── debug()     ← Context + diagnostics
   ├── toJSON()    ← Raw JSON
   └── toMarkdown()← Human-readable report
```

### Refinement 6 — ContextSnapshot for Streaming
The context builder returns a `ContextSnapshot` wrapper instead of a raw context object. This future-proofs for streaming and incremental AI responses.

```typescript
interface ContextSnapshot {
  id:         string          // Unique snapshot ID
  context:    RecruitOSContext
  diagnostics: BuilderDiagnostics[]
  serial:     number          // Monotonically increasing
  createdAt:  string
}
```

### Refinement 7 — graph/ Module
Relationship resolution is extracted from builders into a dedicated `graph/` module. Builders build nodes. Graph modules resolve edges.

```
builders/    ← Build flat domain objects
graph/       ← Resolve relationships between domains
  candidateGraph.ts   ← Links candidates → interviews → followUps → touchpoints
  marketingGraph.ts   ← Links campaigns → sources → attributions
  workspaceGraph.ts   ← Links workspace → KPIs → pipeline health
```

### Refinement 8 — Provenance on Every Node
Every knowledge node carries `_sources` — an array of cache domains that contributed to that node. When the AI draws a conclusion, you can trace exactly where the data came from.

```typescript
interface CandidateKnowledge {
  id:         string
  health:     'Healthy' | 'Warning' | 'Critical' | 'Completed'
  priority:   'P0' | 'P1' | 'P2' | 'P3'
  nextAction: string
  // ...
  _sources: Array<'contacts' | 'interviews' | 'followups' | 'marketing' | 'automation'>
}
```

### Refinement 9 — CandidateIndex instead of raw arrays
The candidates domain exposes a structured index, not a flat array. This is significantly faster for AI selectors and prompt builders that need to filter by priority or stage.

```typescript
interface CandidateContext {
  index: CandidateIndex
}

interface CandidateIndex {
  all:        CandidateKnowledge[]
  byId:       Map<string, CandidateKnowledge>
  byPriority: { P0: CandidateKnowledge[], P1: CandidateKnowledge[], P2: CandidateKnowledge[], P3: CandidateKnowledge[] }
  byRisk:     { Low: CandidateKnowledge[], Medium: CandidateKnowledge[], High: CandidateKnowledge[], Critical: CandidateKnowledge[] }
  byStage:    Map<string, CandidateKnowledge[]>
  byHealth:   { Healthy: CandidateKnowledge[], Warning: CandidateKnowledge[], Critical: CandidateKnowledge[], Completed: CandidateKnowledge[] }
}
```

### Refinement 10 — Frozen Context Schema
`AI_CONTEXT_BASELINE_v1.md` is created as an immutable document. Every schema evolution requires ADR-007 and produces `RecruitOSContext v2`. Silent schema changes are forbidden.

---

## Final Architecture

### Layer Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                      React Query Cache                            │
│  contacts │ interviews │ followUps │ campaigns │ sources          │
└──────────────────────────────┬───────────────────────────────────┘
                               │ read-only
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                 Existing Engines (FROZEN — Unchanged)             │
│   CandidateIntelligence │ AutomationEngine │ MarketingEngine       │
└──────────────────────────────┬───────────────────────────────────┘
                               │ selectors only
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│              AI Knowledge Engine  src/engine/ai/                  │
│                                                                   │
│  ┌─────────────────┐    ┌──────────────────┐                     │
│  │    builders/    │    │     graph/        │                     │
│  │  buildCandidate │───▶│  candidateGraph   │                     │
│  │  buildMarketing │    │  marketingGraph   │                     │
│  │  buildOperations│    │  workspaceGraph   │                     │
│  │  buildWorkspace │    └────────┬─────────┘                     │
│  │  buildRecruiter │            │                                 │
│  └────────┬────────┘            │ resolved relationships          │
│           │                     ▼                                 │
│           └──────▶  RecruitOSContext v1  (ContextSnapshot)       │
│                              │                                    │
│              ┌───────────────┼───────────────┐                   │
│              ▼               ▼               ▼                   │
│        serializer/      prompts/         hooks/                  │
│        compact()     PromptDocument   useAIContext.ts            │
│        verbose()                                                  │
│        debug()                                                    │
└──────────────────────────────┬───────────────────────────────────┘
                               │ ContextSnapshot + PromptDocument
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│              providers/adapters/  (Sprint 11B — EMPTY NOW)        │
│     OpenAIAdapter │ GeminiAdapter │ ClaudeAdapter │ LocalAdapter   │
│     Provider changes. ContextSnapshot schema does NOT change.     │
└──────────────────────────────────────────────────────────────────┘
```

---

## Final Folder Structure

```
src/engine/ai/
├── schemas/
│   └── context.ts              # RecruitOSContext v1 — all TypeScript interfaces
├── builders/
│   ├── candidateBuilder.ts     # buildCandidateContext() → CandidateContext + diagnostics
│   ├── marketingBuilder.ts     # buildMarketingContext() → MarketingContext + diagnostics
│   ├── operationsBuilder.ts    # buildOperationsContext() → OperationsContext + diagnostics
│   ├── recruiterBuilder.ts     # buildRecruiterContext() → RecruiterContext + diagnostics
│   ├── workspaceBuilder.ts     # buildWorkspaceContext() → WorkspaceContext + diagnostics
│   └── contextBuilder.ts       # buildRecruitOSContext() — composes all domains
├── graph/
│   ├── candidateGraph.ts       # Resolve: candidate → interviews → followUps → touchpoints
│   ├── marketingGraph.ts       # Resolve: campaigns → sources → attributions
│   └── workspaceGraph.ts       # Resolve: workspace → KPIs → pipeline health
├── serializer/
│   └── contextSerializer.ts    # compact() | verbose() | debug() | toJSON() | toMarkdown()
├── prompts/
│   └── promptBuilder.ts        # All 6 PromptDocument template functions
├── providers/
│   └── adapters/               # EMPTY — populated in Sprint 11B
├── hooks/
│   └── useAIContext.ts         # Memoized React hook; zero new useQuery() calls
├── tests/
│   ├── contextBuilder.test.ts
│   ├── promptBuilder.test.ts
│   ├── benchmarks/
│   │   └── contextBuild.bench.ts
│   └── fixtures/
│       └── mockContext.ts
├── docs/
│   └── CONTEXT_SCHEMA.md       # Human-readable schema documentation
└── index.ts                    # Public API surface
```

---

## Performance Strategy

| Constraint | Solution |
|---|---|
| < 20ms build time | 5 independent domain `useMemo` slices — only changed domains recompute |
| No O(n²) joins | `Map<id, T[]>` indexes built once in `graph/` before iteration |
| Zero extra network calls | All inputs consumed from existing hooks |
| Streaming-ready | `ContextSnapshot` wrapper enables incremental AI responses |

---

## Security Model

- **Zero API calls from Knowledge Engine.** Providers are in `providers/adapters/` and activated only in Sprint 11B.
- **PII masking is default-on** in the serializer. Phone numbers, names are masked unless `maskPII: false` is explicitly passed.
- **RLS-scoped context.** Context is built from React Query data already filtered by Supabase RLS. No cross-workspace leakage.
- **Read-only contract.** The Knowledge Engine has no write path anywhere in `src/engine/ai/`.

---

## Rollback

Delete `src/engine/ai/`. Zero other files are affected. RecruitOS v1.0 operates unchanged.

---

## Success Criteria

- [ ] Context build < 20ms at 500 candidates (verified in `benchmarks/`)
- [ ] Zero new `useQuery()` calls in `src/engine/ai/`
- [ ] Every `RecruitOSContext v1` field traces to an existing cache source
- [ ] All 6 `PromptDocument` types producible from a single context object
- [ ] `_sources` provenance present on all `CandidateKnowledge` nodes
- [ ] `CandidateIndex.byId`, `.byPriority`, `.byRisk`, `.byStage` all populated correctly
- [ ] Serializer produces valid output in all 5 modes (compact, verbose, debug, JSON, markdown)
- [ ] Unit test coverage ≥ 90% for builders and prompt modules
- [ ] Swapping AI provider in Sprint 11B requires zero changes to `src/engine/ai/` outside `providers/adapters/`
- [ ] `AI_CONTEXT_BASELINE_v1.md` committed and frozen
