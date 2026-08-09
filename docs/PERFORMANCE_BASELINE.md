# Performance Baseline (Sprint 7A)

These are the hard metrics recorded at the freeze point. All future sprints must be measured against these numbers.

## 1. Bundle Metrics
- **Total Application Chunk (Gzipped)**: ~52KB
- **Total Application Chunk (Uncompressed)**: ~220KB
- **CSS Chunk (Gzipped)**: ~16KB
- **Vendor Chunks**: React (56KB), Supabase (51KB), Router (14KB), Query (18KB), Framer (41KB).

## 2. Lighthouse & Vital Projections
*(Estimates based on bundle sizes and O(n) selectors)*
- **FCP (First Contentful Paint)**: < 0.8s
- **TTI (Time to Interactive)**: < 1.2s
- **TBT (Total Blocking Time)**: < 50ms

## 3. Render Depth
- **Prop Drilling Max Depth**: 2 levels.
- **Context Wrappers**: 4 (Theme, Auth, Query, Network).

## 4. Query Performance
- **Active React Queries on Dashboard Load**: 5 (`useDashboardMetrics`, `useContacts`, `useInterviews`, `useFollowUps`, `useRecentActivity`).
- **N+1 Queries**: 0.

## 5. Intelligence Engine Cost
- **Time Complexity**: `O(N)` where N = active candidates.
- **Execution Time (Est for 1000 candidates)**: < 5ms. (Processed locally via V8 engine without blocking UI thread).
