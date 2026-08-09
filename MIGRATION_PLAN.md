# Migration Plan

## Principle
**Never destroy working code without a verified replacement.**

## Step 1: Schema Migration
- Create a new migration file (e.g., `simplify_schema.sql`).
- Do **not** drop tables immediately. Instead, migrate data if necessary (e.g., moving `contact_services` into `contacts.custom_fields`).
- Once data is safe, drop unused tables (`contact_documents`, `sync_queue`, etc.).

## Step 2: UI Migration
- Introduce the new Kanban Board alongside the old list view.
- Test the Kanban Board thoroughly.
- Once verified, deprecate and remove the old list view.
- Update `App.tsx` and routing to point to the new, simpler views.

## Step 3: Backend Logic Migration
- Disable complex triggers (like the auto-scoring) if they are no longer needed.
- Replace heavy RPCs like `get_dashboard_metrics` with simpler queries or edge functions.

## Step 4: Marketing Module Introduction
- Build the Marketing module completely isolated from the CRM logic initially to ensure it doesn't break anything.
- Gradually link the `contacts` table to the `campaigns` table.
