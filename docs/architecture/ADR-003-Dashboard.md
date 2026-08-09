# ADR-003: Dashboard Architecture (Command Center)

## Status
Accepted

## Context
Standard CRMs clutter the dashboard with historical pie charts and generalized analytics. RecruitOS demands an operational mindset, focusing exclusively on answering "What should I do right now?" 

## Decision
We architected Dashboard 2.0 as a highly-optimized, frontend-heavy "Daily Command Center". 
- It aggregates data from multiple React Query hooks (`useContacts`, `useFollowUps`, `useInterviews`, `useRecentActivity`) to present immediate priorities (Overdue, Pendings, Interviews).
- Advanced logical groupings, such as the "At Risk Today" smart alerts, are computed purely in memory using `useMemo` to ensure zero database drift and lightning-fast renders.
- The UI avoids bulky chart libraries, instead utilizing CSS grids, ASCII progress bars (`██████░░`), and vertical timelines.

## Consequences
- **Positive**: Sub 1-second load times. 0ms rendering when navigating back from other tabs. Complete elimination of heavy analytical rendering on the operational screen.
- **Negative**: Complex frontend aggregation logic within `DashboardView.tsx` which must be carefully memoized to prevent infinite loops or performance bottlenecks as candidate volume grows.
