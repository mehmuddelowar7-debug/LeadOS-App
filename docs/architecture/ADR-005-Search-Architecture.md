# ADR-005: Search Architecture

## Context
RecruitOS relies heavily on fast navigation. Searching through tables or nested menus is too slow for an operational command center. We need a "Search Everywhere" feature (Global Command Palette).

## Decision
We will implement an entirely **client-side search engine**.
1. **No Database Queries**: `GlobalSearch` previously queried Supabase on keypress. This is removed.
2. **In-Memory Cache Indexing**: The search engine will build an in-memory index from the React Query cache (`useContacts`, `useInterviews`, `useFollowUps`). Since `useContacts` caches the active workspace contacts on boot, the data is already available locally.
3. **Pure Logic Engine**: The ranking and matching algorithms (`isFuzzyMatch`, `calculateRank`) live in `src/engine/search/` and are fully decoupled from React.
4. **Instantaneous Feedback**: Sub-10ms response times guaranteed because all data is pre-fetched and in-memory.

## Consequences
- **Positive**: Blazing fast search. Zero backend load for searches. Offline-capable search.
- **Negative**: Contacts that are not in the React Query cache (e.g., archived, or if we introduce pagination later) will not be searchable unless explicitly requested. We accept this trade-off for speed, as operational needs prioritize *active* entities.
