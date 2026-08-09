# RecruitOS Architecture & Performance Baseline v1.0

> [!IMPORTANT]
> **This document represents the absolute, frozen baseline of RecruitOS upon completion of Sprint 7A.**
> No future sprint may alter the foundational rules, schema patterns, component structures, or constraints defined here without an explicit Architecture Decision Record (ADR) and a migration plan.

## 1. Directory Structure Rule
- `/src/engine` MUST remain pure TS logic. No React imports, no DOM manipulation, no async side-effects.
- `/src/features` MUST own their isolated domain views and local components.
- `/src/components` MUST remain globally generic UI elements (e.g., buttons, cards).
- `/src/hooks` MUST be domain-specific React Query adapters linking the UI to Supabase.

## 2. Intelligence Engine Rules
- AI and non-deterministic logic are strictly forbidden in candidate health/priority calculations.
- Rule evaluation MUST remain strictly in `O(N)` time complexity.
- Computed traits (`Health`, `Priority`, `Risk`, `NextAction`) MUST NOT be persisted to the database. They must be evaluated dynamically by `useCandidateIntelligence` on the client.

## 3. Database Schema Integrity
- `workspace_id` and Row Level Security (RLS) isolation MUST be applied to every new table.
- Marketing data MUST remain physically separated from Contact records via the junction pattern established in Sprint 5A (`marketing_attributions` and `marketing_touchpoints`).
- The `updated_at` trigger MUST be preserved on all core CRM entities.

## 4. Size & Complexity Constraints
- **Bundle Budget**: The core application bundle must not exceed **100KB (Gzipped)**. Current size: **52KB**.
- **Component Complexity**: React component files MUST NOT exceed **300 lines**. If they do, they must be deconstructed before the PR/Sprint is approved.
- **Dependency Budget**: Heavy chart libraries and massive global state managers (like Redux) are strictly forbidden. Continue using Recharts (if absolutely necessary), Zustand, and React Query.

## 5. Recorded Audits
All baseline reports and audits are saved in `/docs/` and must be referenced before major refactors:
- `PERFORMANCE_AUDIT.md`
- `ARCHITECTURE_AUDIT.md`
- `SCALABILITY_REPORT.md`
- `CODE_DUPLICATION_REPORT.md`
- `RULE_ENGINE_AUDIT.md`
- `PERFORMANCE_BASELINE.md`

## 6. Official ADR Registry
1. `ADR-001-Marketing-Architecture.md`
2. `ADR-002-Pipeline.md`
3. `ADR-003-Dashboard.md`
4. `ADR-004-Intelligence-Architecture.md`

---
*Frozen as of Sprint 7A. The foundation is locked. Do not proceed to external integrations without honoring these constraints.*
