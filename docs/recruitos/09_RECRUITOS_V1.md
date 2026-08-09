# 09 — RecruitOS V1 Specification

> V1 is the version that replaces your Google Sheets and WhatsApp notes. Every candidate is tracked. Every follow-up is scheduled. The pipeline is visual. Daily reporting works. Marketing tracking is manual but functional.

---

## V1 Success Criteria

V1 is complete when the founder can honestly say:

1. ✅ I don't need a spreadsheet to know where any candidate is.
2. ✅ I don't need WhatsApp to remember who to follow up with.
3. ✅ I can see how many leads each pipeline stage has, right now.
4. ✅ I can add a lead in under 30 seconds from my phone.
5. ✅ I know which Instagram post or Facebook campaign is generating the most leads.
6. ✅ I can download a report at the end of the week without making an Excel file.

---

## V1 Scope

### Included in V1
- ✅ Authentication (login, session, logout)
- ✅ Dashboard with work queue and daily targets
- ✅ Quick Capture (optimized, 3-field form, offline)
- ✅ Candidate List (with pipeline-stage filters)
- ✅ Candidate Profile (with 5-stage pipeline bar)
- ✅ Activity Timeline (full history per candidate)
- ✅ Call Logging
- ✅ Interview Scheduling
- ✅ Follow-up Reminders
- ✅ Notes per candidate
- ✅ Kanban Board (all 5 stages, click-to-advance)
- ✅ Global Search
- ✅ Marketing Dashboard (manual campaign entry)
- ✅ Marketing Attribution (campaign_id on contact)
- ✅ Analytics: Pipeline funnel + Source breakdown + CSV export
- ✅ Daily Summary (End Day flow)
- ✅ Offline sync for Field BDA
- ✅ Dark mode (default)
- ✅ PWA (installable, works offline)

### Excluded from V1
- ❌ Meta Ads API integration (V2)
- ❌ Drag-and-drop in Kanban (V2)
- ❌ Role-based dashboards (V2)
- ❌ Team analytics (V3)
- ❌ WhatsApp API (V2+)
- ❌ Document uploads (Never in V1)

---

## V1 Screen-by-Screen Specification

---

### 1. Dashboard

**Route:** `/`
**Primary user:** Founder, Office BDA
**Purpose:** Know what to do today without clicking anything.

**Layout:**
```
[ Header: Good morning, [Name] — [Date] ]
[ Search icon (top right) ]

[ Section: Today's Targets ]
  [ Leads: 3/10 | Calls: 12/20 | Interviews: 2/5 | Joins: 0/1 ]
  [ Progress bars under each ]

[ Section: Work Queue ]
  [ 🔴 2 Overdue Follow-ups → tap → Candidates filtered by overdue ]
  [ 🔵 5 Follow-ups Today → tap → Candidates filtered by today ]
  [ 🟣 3 Interviews Today → tap → Candidates filtered by interview ]
  [ 🟠 1 Missed Interview → tap → Candidate profile ]
  [ 🟢 2 Recharge Pending → tap → Kanban "Recharge" column ]
  [ ✅ Queue clear → "You're all caught up!" ]

[ FAB: + QUICK CAPTURE (full-width on mobile, round on desktop) ]
[ Button: End Day ]
```

**Target labels (V1 — updated from current):**
| Metric | V1 Label |
|---|---|
| leads | Leads |
| calls | Calls |
| interviews | Interviews |
| walkins | ~~Walk-ins~~ → Interviews (same metric, renamed) |
| recharges | Recharges |
| ~~trainings~~ | Removed from targets |
| ~~activations~~ | Joins |

> **Challenge to the founder:** "Walk-ins" and "Interviews" currently track the same thing (visits/scheduling). Consolidate into "Interviews" only. Remove "Trainings" as a target metric since it's not a 5-stage stage.

---

### 2. Kanban Pipeline

**Route:** `/pipeline`
**Primary user:** Founder, Office BDA
**Purpose:** See the entire pipeline at a glance. Move candidates.

**Layout (Desktop):**
```
[ Header: Pipeline | Filter: All / Me / [BDA Name] ]
[ Source filter: All / Instagram / Facebook / Walk-in ]

[ ── Lead (12) ── ] [ ── Interview Scheduled (8) ── ] [ ── Selected (4) ── ] [ ── Recharge (3) ── ] [ ── Joined (1) ── ]
[ Card: Ayesha ]    [ Card: Fatima ]                  [ Card: Nadia ]        [ Card: Ruksana ]       [ Card: Zara ]
[ Card: Meena ]     [ Card: ...    ]                  ...
...

[ + Add Lead ] (in Lead column only)
```

**Layout (Mobile):**
```
[ Horizontal tab bar: Lead | Interview | Selected | Recharge | Joined ]
[                   Active column: shows cards ]
[ Tap card → navigate to full profile ]
```

**Candidate Card:**
```
[ ● Stage color dot ] [ Name (bold, truncated) ]
[ Phone (muted) ]
[ Source icon ] [ Days in stage: "Day 3" ]
```

**Stage advancement (V1 — click, not drag):**
```
Tap card → Profile opens
In profile → Pipeline bar → Tap next stage → Confirmation prompt → Stage updated
```

---

### 3. Candidates (List View)

**Route:** `/contacts`
**Purpose:** Find any candidate. Browse the pipeline by stage.

**Filter chips (V1 — updated):**
- All Candidates (N)
- Lead (N)
- Interview Scheduled (N)
- Selected (N)
- Recharge (N)
- Joined (N)
- Lost (N)

**Card format:**
```
[ Name (bold) ]
[ Phone ]
[ Stage badge: "Interview Scheduled" in violet ]
[ Source icon ]
```

---

### 4. Candidate Profile

**Route:** `/contacts/:id`
**Purpose:** Everything about one person.

**Header:**
```
[ Avatar ] [ Name ] [ Phone ] [ WhatsApp ]
[ Pipeline bar: Lead → Interview Scheduled → Selected → Recharge → Joined ]
```

**Tabs:**
- **Profile:** Personal details, source, campaign attribution.
- **Timeline (was History):** Activity log with timestamps.
- **Actions (was Operations):** Schedule interview, set follow-up, add note, change status.

**Key actions (always visible, not buried in tabs):**
```
[ 📞 Call ] [ 💬 WhatsApp ] [ 📅 Interview ] [ ⏰ Follow-up ]
```

**Pipeline Bar (5 stages):**
```
[ Lead ] → [ Interview Scheduled ] → [ Selected ] → [ Recharge ] → [ Joined ]
     ↑ current stage highlighted in primary color
```

**Moving forward:** Tap next stage button. System asks for relevant info (date for Interview, notes for Recharge/Join).

**Moving backward:** Allowed. System asks for a reason.

**Marking as Lost:**
```
[ Mark as Lost ] → asks: "Why is this candidate lost?"
  Options: Not interested / No response / Wrong number / Competitor / Family objection / Other
```

---

### 5. Quick Capture Form

**Route:** `/capture`
**Purpose:** Add a lead in under 30 seconds.

**Form (V1):**
```
[ Full-screen ]
[ Required: Name * ]
[ Required: Phone * (with duplicate check on blur) ]
[ Optional: Area / Location ]
[ Optional: Source (tap cards: Walk-in / Instagram / Facebook / Referral / Other) ]
[ Source defaults to: Walk-in ]
[ Optional: Campaign (dropdown, shows active campaigns) ]

[ Save button — STICKY, always visible ]
```

**After save:**
```
[ Toast: "Lead saved ✓" ]
[ Form resets immediately ]
[ Optional: "View Profile" link in the toast ]
```

**Offline behavior:**
```
[ No banner, no warning in normal state ]
[ Save works as normal — stored locally ]
[ Small indicator at top: "Offline — changes will sync" ]
```

---

### 6. Marketing Dashboard

**Route:** `/marketing`
**Purpose:** Understand which channels and campaigns are generating leads and ROI.

**Layout:**
```
[ Header: Marketing | + New Campaign ]

[ Summary bar ]
  [ Total Spend: ₹12,400 | Total Leads: 156 | Blended CPL: ₹79 ]

[ Platform tabs: All | Instagram | Facebook | Organic ]

[ Campaign List ]
  [ Campaign Card: "Reel #24 — Kitchen" ]
    [ Platform: 🟣 Instagram ]
    [ Spend: ₹2,000 | Reach: 15K | Leads: 24 | CPL: ₹83 ]
    [ Funnel: 24 Leads → 8 Interviews → 4 Selected → 2 Joined ]
  ...
```

**Add Campaign Sheet:**
```
[ Campaign Name (text) ]
[ Platform (tap cards: Instagram / Facebook / Meta Ads / Organic / Other) ]
[ Spend (₹ input) ]
[ Reach (number input) ]
[ Leads from form (number input) ]
[ Start Date ]
[ Active toggle ]
[ Save ]
```

**V1 note:** All data is manually entered by the founder. CPL is computed automatically (Spend / Leads).

---

### 7. Analytics / Reports

**Route:** `/analytics`
**Purpose:** Historical performance and CSV export.

**Layout:**
```
[ Header: Analytics ]

[ Section: Pipeline Funnel ]
  [ Lead: 156 → Interview: 48 (31%) → Selected: 22 (46%) → Recharge: 15 (68%) → Joined: 12 (80%) ]
  [ Visual funnel chart ]

[ Section: Source Breakdown ]
  [ Bar chart: Walk-in 40% | Instagram 35% | Facebook 15% | Other 10% ]

[ Section: Leads Over Time ]
  [ Line chart: last 30 days ]

[ Section: Export Reports ]
  [ Today's Report → CSV ]
  [ Weekly Report → CSV ]
  [ Monthly Report → CSV ]
  [ Referral Ledger → CSV ]
```

---

### 8. Profile / Settings

**Route:** `/profile`
**Purpose:** Account settings and preferences.

**Layout:**
```
[ Avatar ]
[ Name, Phone ]

[ Daily Targets → Opens TargetSettingsSheet ]
[ Theme: Dark / Light toggle ]
[ Report a Bug ]
[ Sign Out ]
```

---

## V1 Non-Negotiables (Again, For Clarity)

1. **The pipeline has 5 stages.** Exactly. Always.
2. **Offline works for Quick Capture.** Field BDA never sees an error.
3. **Every stage transition is logged** to the activity timeline automatically.
4. **Marketing is isolated.** Field BDAs and Office BDAs do not see the Marketing section.
5. **The app loads in under 2 seconds** on a standard 4G connection (React Query cache + IndexedDB).
