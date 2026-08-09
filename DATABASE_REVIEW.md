# Database Schema Review

## Overall Assessment
The current schema is robust but designed for a generic, multi-tenant enterprise CRM. It is too bloated for RecruitOS. We need to strip it down to optimize for speed, simplicity, and your exact pipeline.

## 1. What to Keep (With Modifications)
- `workspaces` & `workspace_members`: Keep for future-proofing, but default to a single workspace for now.
- `contacts`: The core table. Needs to be simplified.
- `opportunities` -> Rename or repurpose conceptually to `pipeline_entries`. This is where the Lead -> Joined status lives.
- `interviews`: Keep.
- `follow_ups`: Keep.
- `contact_activities`: Keep as the unified `Timeline`.

## 2. What Should Be Removed
- **Gamification:** `gamification_level`, `badges`, `total_points`, `current_streak`. (Remove from `user_profiles`).
- **Incentives Table:** Overly complex for V1. Remove until payroll/commission tracking is strictly needed.
- **Contact Documents:** You explicitly stated "NO document uploads". Remove this table.
- **Sync Queue:** Custom offline sync (`sync_queue`) should be removed in favor of standard React Query caching or simplified local-first architecture to avoid technical debt.

## 3. What Should Be Merged
- `contact_services` should just be an array field or JSONB in `contacts`.
- Opportunity scoring logic (`calculate_opportunity_score`) is overkill. Let the user manually judge or use simple labels (Hot, Warm, Cold).

## 4. What Should Be Normalized
- **Marketing Sources:** Create a `campaigns` table to link leads directly to specific marketing efforts, rather than just a generic `source` enum.

## 5. What Should Become JSON
- **Marketing Data:** Ad spend, reach, and raw analytics from Meta/FB should be stored as JSONB to allow flexible integration later without rigid schema changes.
- **Candidate Metadata:** Objections, tech readiness, and support status can be moved to a JSONB `metadata` column in the pipeline table to reduce column bloat.

## 6. Missing Indexes
- Index on `status` in the pipeline for fast Kanban rendering.
- Index on `campaign_id` (once created) for marketing ROI queries.

## 7. Wrong/Unnecessary Relations
- The strict 1:1 between `contacts` and `opportunities` is okay, but it might be easier to just merge them into a single `candidates` table if a contact will only ever have one pipeline journey. However, keeping them separate is safer for re-engagement.
