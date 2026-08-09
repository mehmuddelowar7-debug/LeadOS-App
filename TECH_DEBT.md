# Technical Debt Report

## 1. Schema Complexity
- The `opportunities` table and scoring logic is heavily reliant on PL/pgSQL triggers (`calculate_opportunity_score`, `auto_score_opportunity`). For a simple system, this makes debugging harder.
- The `sync_queue` table and offline sync logic adds immense complexity to the frontend.

## 2. Frontend Bloat
- The application uses multiple state management solutions and heavy contexts (e.g., `NetworkProvider`, custom chunk reload logic in `App.tsx`) which slows down the initial boot.
- The lazy loading strategy in `App.tsx` is aggressively splitting routes, which is good for massive apps but causes "ChunkLoadError" issues (as seen in the custom error screen).

## 3. UI Inconsistencies
- Using standard Shadcn UI components can lead to a "generic" feel if not heavily themed. It needs strict design tokens to achieve the "Apple" aesthetic.

## 4. API & Routing
- Some files like `endDayEngine.ts` suggest batch processing happening on the client or edge, which could be fragile.
