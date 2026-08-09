# Code Duplication & Maintainability Audit

## 1. Duplicate Types
**Current State**:
- All major domain entities (`Contact`, `Opportunity`, `Interview`) are successfully centralized in `src/types/index.ts`.
- The Intelligence Engine successfully maintains its own decoupled `CandidateData` interface in `src/engine/intelligence/types/`.

**Violations**:
- `ContactProfileView.tsx` and `PipelineCard.tsx` both manually map `opportunity` properties into `CandidateData` inline.

**Recommendation**:
- **Action Required**: Create a centralized transformer function (e.g., `mapSupabaseToCandidateData`) to eliminate this duplication and prevent TS errors when the schema evolves.

## 2. Duplicate Business Logic
**Current State**:
- With the successful migration to the Candidate Intelligence Engine (Sprint 6B), duplicate rules for determining "stale", "cold", and "recharge pending" candidates have been largely eliminated from the view components.

**Recommendation**:
- The codebase is exceptionally clean in this regard.

## 3. Component Duplication
**Current State**:
- Forms such as `AddFollowUpSheet`, `AddInterviewSheet`, and `EndDaySheet` share similar internal structures but operate on different schemas. 
- The generic `StatusBadge` and `ScoreBadge` components are correctly reused everywhere.

**Recommendation**:
- **Action Required**: Consider extracting a shared generic `ActionSheetForm` wrapper to reduce boilerplate in the feature-specific sheet components.
