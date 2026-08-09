# Architecture & Component Audit

## 1. Component Size & Complexity
**Rule Check**: "Every component under 300 lines."

**Violations**:
The following files currently exceed the 300-line threshold and require deconstruction:
1. `src/features/dashboard/EndDaySheet.tsx` (582 lines) - Heavy form logic and multiple tabs.
2. `src/types/index.ts` (520 lines) - Acceptable for a type definition file, but should be split into domain-specific types (e.g., `contact.types.ts`, `pipeline.types.ts`).
3. `src/features/contacts/ContactProfileView.tsx` (505 lines) - Even after extracting `ContactTimeline` and `InfoRow`, the main wrapper remains large due to extensive tab logic and embedded UI.
4. `src/features/contacts/ContactsView.tsx` (435 lines) - List virtualization and swipe-to-action logic is embedded in the same file.
5. `src/features/contacts/ContactEntryView.tsx` (435 lines) - Massive form with complex validation.
6. `src/features/referrals/AddReferralSheet.tsx` (330 lines) - Form state and UI combined.
7. `src/features/dashboard/DashboardView.tsx` (309 lines) - Just over the limit, primarily due to inline JSX for cards.

**Recommendation**:
- **Action Required**: Initiate a "Component Deconstruction" phase prior to any new feature development to bring all `tsx` files under 300 lines. 

## 2. Single Responsibility Principle (Hooks)
**Current State**:
- Hooks like `useContacts`, `useInterviews`, and `usePipeline` successfully isolate data fetching.
- `useCandidateIntelligence` successfully isolates business rules from UI.

**Violations**:
- `useDashboardMetrics` currently fetches a monolithic RPC `get_dashboard_metrics` which combines leads, calls, interviews, and referrals. While performant, it couples multiple domains together.

## 3. Directory Structure Strictness
**Current State**:
- `/engine` contains pure logic.
- `/features` contains domain-specific React views.
- `/components` contains generic UI.

**Recommendation**:
- Architecture is **10/10** in theory, but requires strict adherence. 
- **Action Required**: Enforce linting rules to prevent `/engine` from importing from `/features` or `/components`.
