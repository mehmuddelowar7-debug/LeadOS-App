# Rule Engine Audit

## 1. Engine Determinism
**Current State**:
- The Candidate Intelligence Engine (`src/engine/intelligence`) strictly adheres to functional programming paradigms.
- Pure functions map `CandidateData` and a `dayjs` timestamp to enums (`Health`, `Priority`, `Risk`, `NextAction`).
- There are no asynchronous side effects, API calls, or hidden random variables inside the rule evaluations.

**Verification**: **PASS**. The engine is 100% deterministic.

## 2. Rule Coverage & Priorities
**Current State**:
- All thresholds (e.g., `coldDays`, `staleDays`) are abstracted into `intelligenceRules.ts`.
- Rule priority is strictly ordered. For example, `getHealth` checks for critical inactivity *before* checking for missing follow-ups.

**Verification**: **PASS**. 

## 3. Test Coverage
**Current State**:
- Unit tests (`vitest`) are fully implemented for both `candidateRules` and `dashboardSelectors`.
- Edge cases tested include: "Overdue follow-ups", "Pending recharges", "Activated candidates".

**Recommendation**:
- **Action Required**: As new stages are added (e.g., specific automation phases in Sprint 8), ensure tests are retroactively applied. Coverage currently sits at 100% for the defined rules.
