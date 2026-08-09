# RecruitOS Deployment Guide

Two independent tracks. **Track 1 (CRM) makes the product usable. Track 2 (AI) makes it smarter.**  
Track 2 never blocks Track 1.

---

## Track 1 — CRM Deployment

Everything a recruiter needs to work a full day.

### Prerequisites
```bash
cd /Users/mehmuddelowar/Documents/LeadOS
npx supabase login           # one-time, opens browser
npx supabase link --project-ref osnxdtsrayulwndbvgjl
# Enter your DB password when prompted (Supabase Dashboard → Project Settings → Database)
```

### 1. Apply migrations
```bash
npx supabase db push --linked
```

This applies in order:
- `20260626000000_dashboard_rpc.sql` — Dashboard metrics RPC
- `20260808000000_fix_dashboard_metrics.sql` — Metrics fix
- `20260809000000_marketing_foundation.sql` — Marketing tables
- `20260809100000_add_interviews_followups.sql` — ✅ interviews + follow_ups + referral_date

### 2. Verify tables exist
Run in Supabase SQL Editor:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('contacts', 'opportunities', 'interviews', 'follow_ups', 'referrals', 'workspaces');
```
Expected: 6 rows returned.

### 3. Deploy Webhook Gateway
```bash
npx supabase functions deploy webhook-gateway
```

### 4. Verify CRM is operational

Open the app → login → check:
- Dashboard loads (no spinner)
- Pipeline opens
- Add candidate form works
- Contacts list shows (empty state is fine if no data)

**CRM is now production-ready.** Proceed to Track 2 at any time — it does not affect this.

---

## Track 2 — AI Deployment

Optional. Deploy after Track 1 is verified.

### 1. Deploy ai-proxy
```bash
npx supabase functions deploy ai-proxy
```

### 2. Set Gemini API key

Go to: **Supabase Dashboard → [your project] → Edge Functions → Manage Secrets**

Add:
```
Name:  GEMINI_API_KEY
Value: <your key from https://aistudio.google.com/apikey>
```

### 3. Verify ai-proxy is live
```bash
npx supabase functions invoke ai-proxy \
  --body '{"document":{"system":"You are a helpful assistant.","messages":[{"role":"user","content":"Reply with: OK"}]}}'
```

Expected response: `{"content":"OK","role":"assistant"}` or similar JSON.  
If you see `503` → GEMINI_API_KEY secret is not set.  
If you see `404` → Function was not deployed (re-run step 1).

### 4. Test AI degradation

Temporarily remove the GEMINI_API_KEY secret → refresh the app → verify:
- Dashboard still loads
- Briefing shows "AI Unavailable" + local mission data
- Zero red error cards
- Retry button is visible

Restore the key → click Retry → full AI brief appears.

---

## Environment Variables

### Frontend (`.env`)
```env
VITE_SUPABASE_URL=https://osnxdtsrayulwndbvgjl.supabase.co
VITE_SUPABASE_ANON_KEY=<your anon key>
VITE_GEMINI_API_KEY=          # Optional: only for local dev direct calls
VITE_SENTRY_DSN=              # Optional: error monitoring
```

### Edge Functions (Supabase Secrets)
```
GEMINI_API_KEY=<your Gemini key>   # Required for ai-proxy
```

---

## Rollback

### CRM rollback
If a migration breaks something, revert manually in the Supabase SQL Editor.  
Supabase does not support automatic down-migrations.

### AI rollback
Simply remove the `GEMINI_API_KEY` secret. The app automatically falls back to the local data brief. No CRM functionality is affected.

---

## Track Independence

```
Track 1 (CRM)          Track 2 (AI)
─────────────          ────────────
contacts ──────────┐   ai-proxy ───────→ Gemini
opportunities      │   (optional)
interviews    ─────┼──→ RecruitOS
follow_ups         │   (always works)
realtime ──────────┘
webhook-gateway
```

A recruiter can use RecruitOS for an entire workday if Track 2 is completely offline.
