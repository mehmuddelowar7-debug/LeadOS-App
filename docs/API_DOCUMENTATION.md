# API & RPC Documentation

LeadOS heavily utilizes Supabase as a Backend-as-a-Service. Instead of a traditional REST API middleware, the frontend uses PostgREST directly and utilizes Database RPCs (Remote Procedure Calls) for complex transactions.

## 1. Remote Procedure Calls (RPCs)

### `rollover_end_day(p_user_id UUID, p_workspace_id UUID)`
**Purpose:** Executes the End-Day workflow safely.
- Scans all `opportunities` where `next_followup` is in the past.
- Shifts `next_followup` to `9:00 AM` of the following day.
- **Why RPC?** Doing this on the client side could result in partial updates if the user closes the app or loses internet midway.

### `calculate_opportunity_score(opportunity_row)`
**Purpose:** Immutable function automatically triggered on INSERT/UPDATE to compute a Readiness Score (0-100).
- Assigns weights to `interest_level`, `english_level`, `experience`, `education`, and `support` fields.

### `check_duplicate_contact(workspace, phone, whatsapp, name)`
**Purpose:** Fast duplicate detection utility before inserting a new contact.

## 2. Table-level API Endpoints (PostgREST)

Supabase auto-generates REST endpoints for every table. We enforce multi-tenant isolation via RLS, meaning these endpoints are safe to query directly from the client.

- `GET /rest/v1/contacts`: Returns contacts where `workspace_id` matches the user's workspace.
- `POST /rest/v1/sync_queue`: Used by the `offlineSync.ts` engine to upload queued mutations when the network returns.

## 3. Realtime Features
Supabase Realtime is enabled for the `contact_activities` table. When another recruiter in the same workspace logs a call on a shared contact, the activity timeline updates instantly.
