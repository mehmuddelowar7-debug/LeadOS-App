# LeadOS V1 Architecture

LeadOS is a "Local-First" mobile progressive web application (PWA) designed exclusively for field recruitment executives. It is engineered to perform seamlessly in offline environments (e.g., rural Indian field operations) and synchronize intelligently when network conditions recover.

## 1. Technology Stack
- **Frontend Framework:** React 18 + Vite
- **Styling:** Tailwind CSS + Framer Motion (for micro-interactions)
- **Routing:** React Router v6
- **Data Fetching & Caching:** TanStack Query (React Query)
- **Local Storage / Offline Sync:** IndexedDB (`idb-keyval`)
- **Backend / Database:** Supabase (PostgreSQL + PostgREST + Realtime)
- **Monitoring:** Sentry

## 2. Local-First Strategy
The defining characteristic of LeadOS is its Local-First architecture.

### Read Operations (Viewing Data)
When the app loads, TanStack Query fetches data from Supabase and immediately caches it in IndexedDB via `PersistQueryClientProvider`.
When the user goes offline, queries immediately read from IndexedDB, providing a 0ms load time and allowing full read access to previously loaded data.

### Write Operations (Mutations)
When a user performs an action (e.g., creating a lead, logging a call):
1. **Optimistic UI:** The UI updates instantly.
2. **Mutation Queue:** The mutation payload is pushed to an IndexedDB queue (`offlineSync.ts`).
3. **Background Sync:** The app listens to the `online` window event. When the network returns, the sync engine drains the queue, executing each mutation against Supabase.
4. **Idempotency:** All offline creations utilize `.upsert()` with client-generated UUIDs (v4) to prevent duplicate entries if the network flakes during a sync retry.
5. **Exponential Backoff:** Failed syncs retry at 1s, 2s, 4s, 8s, and 16s intervals before moving to a dead-letter state.

## 3. Database & Edge Compute
LeadOS relies on Supabase for data persistence and authentication.

- **Multi-tenant:** Data is strictly isolated via Row Level Security (RLS) using the `workspace_id` and `workspace_members` join table.
- **Performance:** For large operations (like the End-Day Roll-over), logic is shifted from the client to Edge Compute (Supabase Stored Procedures / RPCs) to prevent data corruption if the user closes the app mid-execution.
- **Search:** Client-side search uses a 300ms debounce, while backend search utilizes a PostgreSQL `GIN` index and `to_tsvector` for ultra-fast full-text search across 50k+ rows.

## 4. Multi-Device Responsive Architecture
LeadOS V1 is built to support Mobile, Tablet, and Desktop environments dynamically without multiple codebases.

### Adaptive Shell
- **Mobile (<768px):** Uses a `BottomNav` optimized for one-handed field operations.
- **Tablet (768px - 1023px):** Uses a collapsed `NavRail` on the left.
- **Desktop (1024px+):** Expands to a full `Sidebar` with text labels and global shortcuts.

### Master-Detail Pattern
To maximize screen real estate, lists (like Network and Priority Queue) are not stretched on larger screens. Instead, React Router's nested `<Outlet />` is used. Clicking an item opens the Detail view on the right-hand side of the screen, allowing users to rapidly process queues without ever clicking "Back".
