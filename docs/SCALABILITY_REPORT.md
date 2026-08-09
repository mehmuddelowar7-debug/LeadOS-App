# Scalability & Database Audit

## 1. N+1 Queries & Over-fetching
**Current State**:
- React Query hooks (`useContacts`, `useInterviews`, etc.) perform independent fetches, but they select deeply nested data correctly in a single pass (e.g. `opportunity:opportunities(status)`). There are no N+1 query patterns triggered from the frontend.

**Violations / Risks**:
- **Over-fetching**: `useContacts` fetches `id, name, phone, roles, labels, created_at, photo_url, whatsapp, opportunity:opportunities(status)` for ALL contacts in the workspace. While efficient currently, this payload will become unmanageably large as the database approaches 10,000+ candidates.

## 2. Missing Pagination
**Current State**:
- **Critical Risk**: The following hooks currently lack `.limit()` or pagination:
  - `useContacts` (Returns all candidates)
  - `useInterviews` (Returns all interviews)
  - `useFollowUps` (Returns all follow-ups)
  - `useRecentActivity` (Currently limits to 10 via parameter, which is correct).

**Recommendation**:
- **Action Required**: Migrate `useContacts`, `useInterviews`, and `useFollowUps` to utilize `useInfiniteQuery` or cursor-based pagination. The Intelligence Engine should only process active candidates, not historically completed ones unless explicitly requested.

## 3. Database Indexes
**Current State**:
- The database schema is extremely robust. As documented in `DATABASE_BASELINE_v0.5.md`:
  - Search indexes (`idx_contacts_search` GIN)
  - Hierarchy indexes (`workspace_id`)
  - Marketing lookup indexes (`idx_marketing_touchpoints_timestamp`)

**Recommendation**:
- **Action Required**: Before importing historical Meta Ads data, verify that a composite index exists on `(contact_id, status)` within `opportunities` to speed up the Dashboard queues (e.g. `recharge_pending`).

## 4. Query Invalidation Strategy
**Current State**:
- Mutations correctly invalidate specific query keys (`queryClient.invalidateQueries({ queryKey: ['contacts'] })`).

**Recommendation**:
- Safe for scale. No immediate action required.
