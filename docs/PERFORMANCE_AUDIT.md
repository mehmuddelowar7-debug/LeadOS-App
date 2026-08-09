# Performance Audit

## 1. Bundle Analysis & Code Splitting
**Current State**: 
- Total Application Size (Gzipped): **~52KB**
- Lighthouse Estimate: **>95** (Based on <100KB core bundle size and zero heavy external libraries like chart.js).

**Routing Architecture**:
- *Lazy Loaded Routes*: `AnalyticsView`, `ProfileView`
- *Statically Imported Routes*: `DashboardView`, `ContactsLayout`, `PipelineLayout`, `MarketingLayout`, `SetupScreen`.

**Recommendation**:
The primary routes (`Dashboard`, `Pipeline`, `Contacts`, `Marketing`) are statically imported in `App.tsx`. As the application grows, this will degrade initial load times.
- **Action Required**: Migrate all primary feature layouts to `React.lazy()` with `Suspense` boundaries in `App.tsx`.

## 2. Memoization & Re-renders
**Current State**:
- Extensive use of `useMemo` exists inside `DashboardView.tsx` and `ContactProfileView.tsx`.
- Introduction of `useCandidateIntelligence` successfully migrated some heavy `useMemo` loops out of the render cycle.
- `PipelineCard` is correctly wrapped in `React.memo` with a custom comparison function to prevent list churn.

**Recommendation**:
- **Action Required**: Several smaller components (e.g., `WorkQueueCard`, `PipelineHealthRibbon`) are not wrapped in `React.memo`, which may cause unnecessary repaints when parent state (like active tabs) changes.
- **Action Required**: Move remaining inline data filtering out of `ContactProfileView` into pure selectors.

## 3. Prop Drilling
**Current State**:
- Most data is fetched at the view level (e.g., `useContacts`) and passed down 1-2 levels.
- Global state (Auth, Theme, Search) uses Zustand and avoids prop drilling entirely.

**Recommendation**:
- The application remains well within the "No prop drilling beyond two levels" rule. No immediate action required.
