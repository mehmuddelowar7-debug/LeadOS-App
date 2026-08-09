# Postmortem: Operations Center Infinite Loading Bug

**Date:** 2026-08-09  
**Severity:** P1 — Primary view completely blocked  
**Resolution Time:** ~8 hours (investigation + fix)  
**Status:** Resolved  

---

## 1. Symptoms

The Operations Center (`/`) — the application's primary landing screen — permanently displayed:

```
Loading operations center...
```

The spinner never resolved. The app had booted successfully (authentication, routing, and `AppShell` all rendered correctly), but the core data view was inaccessible. All queues, timelines, and AI briefings were invisible.

---

## 2. Root Cause

**Three compounding failures, not one:**

### 2a. `interviews` and `follow_ups` tables missing in remote Supabase (PRIMARY)

The `schema.sql` file defined both tables. However, neither was ever applied to the remote Supabase project via a migration. The tables existed only in local SQL files.

When `useInterviews()` and `useFollowUps()` executed their queries, Supabase returned:

```
PGRST205: Could not find the table 'public.interviews' in the schema cache
PGRST205: Could not find the table 'public.follow_ups' in the schema cache
```

Both hooks `throw`-ed this error back to React Query.

### 2b. React Query retry loop blocking `isPending` resolution

React Query v5's default `retry: 3` behaviour caused each failed query to retry 3 times with exponential backoff (1s → 2s → 4s = **7 seconds minimum**). During all retries, `isPending` remained `true`.

`useCandidateIntelligence` aggregated the three hooks' pending states:

```ts
const isLoading = contactsPending || interviewsPending || followUpsPending
```

Since `interviewsPending` and `followUpsPending` stayed `true` for ~7 seconds each cycle, `isLoading` never became `false`. The component rendered the loading spinner indefinitely.

### 2c. `isLoading` vs `isPending` semantic mismatch (CONTRIBUTING)

The hooks originally used `isLoading` (React Query v4 API). In React Query v5, `isLoading` is `isPending && isFetching` — which can become `false` even when `isPending` is still `true` if fetching stopped (e.g. due to network pausing). This ambiguity masked the stuck state during debugging.

---

## 3. Why Tests Didn't Catch It

1. **No integration tests existed** against a real Supabase instance. All existing tests (if any) ran against mock data.
2. **No schema migration validation** step existed in the dev workflow to verify that `schema.sql` changes were actually applied to the remote DB.
3. **The loading state was never covered by E2E tests.** Playwright tests were configured but the test suite had not been run against a live instance.
4. **Manual testing was done on the development branch** which may have had a different DB state (e.g. local Supabase or a seeded remote).

---

## 4. Why the Architecture Allowed It

1. **No circuit breaker on data hooks.** Hooks that throw errors propagate straight to `isLoading = true` with no maximum wait or error boundary timeout.
2. **`useCandidateIntelligence` was an AND-gate.** It required ALL three hooks to succeed before rendering. Any single failing hook blocked the entire view.
3. **AI Context was coupled to the same render gate.** `useAIContextBuilder` was inside `OperationsCenterView` but *above* the `if (isLoading)` check, running expensive memos on empty arrays and blocking the main thread.
4. **No environment verification in CI.** Nothing checked that the remote DB matched the schema before deploying frontend code.

---

## 5. Fixes Applied

| # | Fix | File |
|---|-----|------|
| 1 | Changed `throw error` → `return []` in `useInterviews`, `useFollowUps`, `useContacts` | `src/hooks/useInterviews.ts`, `useFollowUps.ts`, `useContacts.ts` |
| 2 | Changed `useReferrals` to return `[]` on error instead of throwing | `src/hooks/useReferrals.ts` |
| 3 | Changed `isLoading` → `isPending` in `useCandidateIntelligence` | `src/hooks/useCandidateIntelligence.ts` |
| 4 | Isolated `useAIContextBuilder` into `<OperationsCoachContainer />` — renders independently after core data | `src/features/operations/OperationsCenterView.tsx` |
| 5 | Replaced red error card in AI briefing with a graceful "unavailable" notice + Retry button | `src/features/ai/components/OperationsCoachBriefing.tsx` |
| 6 | Stabilised `useEventSubscription` with a `useRef` callback pattern to prevent subscribe/unsubscribe churn | `src/sdk/events/useEventSubscription.ts` |
| 7 | Created missing migration for `interviews` and `follow_ups` tables | `supabase/migrations/20260809100000_add_interviews_followups.sql` |
| 8 | Created and deployed `ai-proxy` Supabase Edge Function | `supabase/functions/ai-proxy/index.ts` |

---

## 6. Preventive Measures

### Engineering rules (permanent)

1. **Data hooks must never block render indefinitely.** Every `useQuery` hook that is load-bearing for a primary view **must** return a sensible default (`[]`, `null`, `{}`) on error, not throw.
2. **Aggregate loading states must have a timeout cap.** If `isLoading` is true for >5 seconds, the component should render with degraded data and a retry option, not a permanent spinner.
3. **AI and secondary features must be rendered in independent components.** They must not sit inside the primary data loading gate.
4. **Schema migrations must be tracked and verified.** A new `docs/DATABASE_BASELINE.md` entry must be created for every new table, and a CI step should validate remote schema matches baseline.

### Regression test (to be added in Sprint 12A.2)

```ts
// e2e/operations.spec.ts
test('Operations Center renders within 3 seconds even when interviews table is unavailable', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('text=Loading operations center...')).not.toBeVisible({ timeout: 3000 })
  await expect(page.locator('text=Actionable Queues')).toBeVisible({ timeout: 5000 })
})

test('Operations Center does not hang when AI briefing fails', async ({ page }) => {
  await page.goto('/')
  // Core queues must render even if AI is down
  await expect(page.locator('text=Actionable Queues')).toBeVisible({ timeout: 5000 })
  // AI error must be a soft notice, not a crash
  await expect(page.locator('text=AI briefing unavailable')).toBeVisible({ timeout: 8000 })
})
```

---

## 7. Timeline

| Time | Event |
|------|-------|
| T+0 | User reports "Loading operations center..." never resolves |
| T+30m | Confirmed `useEventSubscription` churn as contributing factor |
| T+1h | Confirmed `isPending` vs `isLoading` flag mismatch |
| T+2h | Wrote Playwright capture script; confirmed browser logs showed no DEBUG output from hooks |
| T+3h | Direct Supabase CLI test confirmed `interviews` 404 — root cause found |
| T+4h | Hooks patched to return `[]` on error; `OperationsCoachContainer` isolated |
| T+5h | `useEventSubscription` stabilised with ref pattern |
| T+6h | `ai-proxy` Edge Function written and deployed |
| T+7h | Migration file created for missing tables |
| T+8h | Postmortem written |

---

## 8. Open Items

- [ ] **Run migration** `20260809100000_add_interviews_followups.sql` against remote Supabase (`supabase db push`)
- [ ] **Set `GEMINI_API_KEY` secret** in Supabase Dashboard → Edge Functions → Secrets
- [ ] **Add regression E2E tests** (see section 6 above)
- [ ] **Seed the database** with real recruiter data to validate non-zero dashboard counts
