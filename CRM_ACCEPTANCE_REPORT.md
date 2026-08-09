# RecruitOS v1.0 — CRM Acceptance Report

**Status:** IN PROGRESS — Pending real-data validation  
**Standard:** Every row must be tested against the live Supabase database before v1.0 is declared.  
**Principle:** AI offline must not affect any row marked CRM.

---

> [!IMPORTANT]
> This report is the gate for v1.0. No new features are built until every row below is marked **Pass** with evidence.

---

## How to use this report

For each feature row, a tester must:
1. Open the live app connected to real Supabase data
2. Perform the listed actions
3. Verify the expected result
4. Mark the status and add any notes

**Pass criteria:** Action completed, result matches expectation, zero console errors, no reload required.

---

## Core CRM Features

| Feature | Action | Expected Result | Real DB | Realtime | Mobile 320px | Desktop 1280px | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| **Dashboard** | Open `/` | Renders in <3s, no spinner | ⬜ | N/A | ⬜ | ⬜ | ⬜ Pending | |
| **Dashboard counts** | Add candidate → check dashboard | Queue count increases without refresh | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Pending | |
| **Dashboard persist** | Add candidate → refresh page | Count still present after reload | ⬜ | N/A | ⬜ | ⬜ | ⬜ Pending | |
| **Pipeline view** | Open `/pipeline` | All stages render, candidates listed | ⬜ | N/A | ⬜ | ⬜ | ⬜ Pending | |
| **Add candidate** | Fill form → submit | Candidate appears in pipeline | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Pending | |
| **Drag stage** | Drag candidate card to new stage | Stage updates in DB, persists on refresh | ⬜ | N/A | ⬜ | ⬜ | ⬜ Pending | |
| **Candidate profile** | Click candidate | Profile opens, all fields shown | ⬜ | N/A | ⬜ | ⬜ | ⬜ Pending | |
| **Edit candidate** | Edit field → save | Field updates in DB | ⬜ | N/A | ⬜ | ⬜ | ⬜ Pending | |
| **Follow-up: create** | Add follow-up on profile | Appears in dashboard queue | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Pending | |
| **Follow-up: complete** | Mark follow-up done | Removed from queue | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Pending | |
| **Interview: schedule** | Schedule interview | Timeline updates on profile | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Pending | |
| **Interview: today** | Interview date = today | Appears in Operations Center | ⬜ | N/A | ⬜ | ⬜ | ⬜ Pending | |
| **Candidate timeline** | View profile timeline | Interviews + follow-ups listed | ⬜ | N/A | ⬜ | ⬜ | ⬜ Pending | |
| **Recharge workflow** | Move to recharge_pending stage | Appears in Recharge queue | ⬜ | N/A | ⬜ | ⬜ | ⬜ Pending | |
| **Marketing: home** | Open `/marketing` | Loads without error | ⬜ | N/A | ⬜ | ⬜ | ⬜ Pending | |
| **Marketing: import** | Import a lead | Lead appears in contacts | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Pending | |
| **Marketing: attribution** | View imported lead profile | Source attribution is set | ⬜ | N/A | ⬜ | ⬜ | ⬜ Pending | |
| **Search: by name** | Ctrl+K → type name | Candidate found | N/A | N/A | ⬜ | ⬜ | ⬜ Pending | |
| **Search: by phone** | Ctrl+K → type phone number | Candidate found | N/A | N/A | ⬜ | ⬜ | ⬜ Pending | |
| **Search: command** | Ctrl+K → type "add" | Command shown and executable | N/A | N/A | ⬜ | ⬜ | ⬜ Pending | |
| **Search: keyboard** | ↑↓ arrow keys, Enter, Esc | Full keyboard navigation works | N/A | N/A | N/A | ⬜ | ⬜ Pending | |
| **Automation** | Open dashboard | Suggestions appear (or empty state) | ⬜ | N/A | ⬜ | ⬜ | ⬜ Pending | |
| **Automation: execute** | Click Execute on a suggestion | Action is performed | ⬜ | N/A | ⬜ | ⬜ | ⬜ Pending | |
| **Automation: dismiss** | Click Dismiss | Suggestion removed from session | N/A | N/A | ⬜ | ⬜ | ⬜ Pending | |

---

## Realtime

| Scenario | Steps | Expected | Status | Notes |
|---|---|---|---|---|
| **Cross-browser insert** | Browser A: add candidate. Browser B: watch dashboard. | Candidate appears in Browser B within 3s — no refresh | ⬜ Pending | |
| **Cross-browser stage update** | Browser A: drag to new stage. Browser B: watch pipeline. | Stage updates in Browser B | ⬜ Pending | |
| **Cross-browser follow-up** | Browser A: add follow-up. Browser B: watch queue. | Queue count increases in Browser B | ⬜ Pending | |

---

## Responsive Breakpoints

| Screen | Size | Dashboard | Pipeline | Profile | Marketing | Status |
|---|---|---|---|---|---|---|
| Mobile S | 320×568 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Pending |
| Mobile M | 390×844 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Pending |
| Tablet | 768×1024 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Pending |
| Desktop | 1280×800 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Pending |
| Wide | 1920×1080 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Pending |

---

## AI Layer (Optional — CRM must work if all AI rows fail)

| Scenario | Steps | Expected | Status | Notes |
|---|---|---|---|---|
| **AI offline** | Disconnect Gemini (wrong key / no key) | Dashboard renders fully. Briefing shows local data fallback with "AI Unavailable" + Retry button. Zero red errors. | ⬜ Pending | |
| **AI online** | Set valid GEMINI_API_KEY | Full AI briefing appears. Execution order shown. "Start My Day" works. | ⬜ Pending | |
| **AI → CRM parity** | Test both states back-to-back | CRM behaviour is identical. Only the briefing widget changes. | ⬜ Pending | |
| **AI Retry** | Click Retry AI after offline → bring Gemini back online | Brief loads on retry without page refresh | ⬜ Pending | |

---

## Console Error Audit

All screens must be navigated with DevTools Console open. Zero `console.error` calls allowed for known-good configurations.

| Screen | console.error | console.warn (acceptable) | Status |
|---|---|---|---|
| Dashboard `/` | ⬜ | ⬜ | ⬜ Pending |
| Pipeline `/pipeline` | ⬜ | ⬜ | ⬜ Pending |
| Candidate Profile | ⬜ | ⬜ | ⬜ Pending |
| Marketing `/marketing` | ⬜ | ⬜ | ⬜ Pending |
| Analytics `/analytics` | ⬜ | ⬜ | ⬜ Pending |
| Profile Settings | ⬜ | ⬜ | ⬜ Pending |

---

## Deployment Checklist

### Track 1 — CRM Deployment (Required for v1.0)

- [ ] `supabase login`
- [ ] `supabase link --project-ref osnxdtsrayulwndbvgjl`
- [ ] `supabase db push --linked` (applies `interviews`, `follow_ups`, `referral_date` migration)
- [ ] Verify `interviews` table exists: `SELECT COUNT(*) FROM interviews;`
- [ ] Verify `follow_ups` table exists: `SELECT COUNT(*) FROM follow_ups;`
- [ ] Verify RLS is active on both tables
- [ ] Seed at least 3 real candidates for validation
- [ ] Deploy `webhook-gateway` Edge Function

### Track 2 — AI Deployment (Optional, does not block v1.0)

- [ ] `supabase functions deploy ai-proxy`
- [ ] Set `GEMINI_API_KEY` secret in Supabase Dashboard → Edge Functions → Secrets
- [ ] Test: `supabase functions invoke ai-proxy --body '{"document":{"system":"test","messages":[{"role":"user","content":"hello"}]}}'`
- [ ] Verify response is JSON, not 404 or 503

---

## v1.0 Sign-off

> All CRM rows must be **Pass** before signing off. AI rows are optional but should be documented.

| Reviewer | Date | Status |
|---|---|---|
| | | ⬜ Not signed |
