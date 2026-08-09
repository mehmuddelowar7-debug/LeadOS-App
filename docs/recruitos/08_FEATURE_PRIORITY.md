# 08 — Feature Priority

> Every feature in RecruitOS is classified by priority: P0 (must ship), P1 (should ship), P2 (nice to have), and LATER (explicitly deferred). Nothing ships out of priority order.

---

## Priority Framework

| Level | Meaning | Ship Condition |
|---|---|---|
| **P0** | App is broken or unusable without this | Block everything. Fix/build immediately. |
| **P1** | Core workflow depends on this | Must be in V1 release. |
| **P2** | Improves the experience significantly | V1.5 — after core is stable. |
| **LATER** | Good idea. Not now. | V2 or beyond. |
| **NEVER** | Contradicts the product philosophy | Do not build. Ever. |

---

## P0 — Foundation (Must Exist for V1 to Function)

These are the features without which RecruitOS cannot replace the founder's existing tools.

| Feature | Current State | Action |
|---|---|---|
| Authentication (Login/Logout) | ✅ Working | No changes |
| Add Lead (Quick Capture) | ✅ Working | Minor UX improvements |
| View Candidate List | ✅ Working | Update filters to pipeline stages |
| View Candidate Profile | ✅ Working | Remap pipeline stages |
| Add Follow-up Reminder | ✅ Working | Chain to Call Log |
| Schedule Interview | ✅ Working | Minor polish |
| Log Call Outcome | ✅ Working | Chain to Follow-up |
| Dashboard with Work Queue | ✅ Working | Update labels, link to Kanban |
| End Day Summary | ✅ Working | Keep as-is |
| Offline Capture (for Field BDA) | ✅ Working | Keep as-is |
| Pipeline Stage Navigation (per candidate) | ✅ Working | Remap to 5 stages |
| **Pipeline Stage Enum Migration** | ❌ Missing | Migrate DB enum to 5 stages |
| Global Search | ✅ Working | Keep as-is |
| Kanban Board (/pipeline) | ❌ Missing | Build new |
| Kanban → Candidate Profile (side panel) | ❌ Missing | Build new |
| Navigation update (add Pipeline, remove Referrals) | ⚠️ Needs update | Update navItems.ts |

---

## P1 — Core V1 Features (Ship Before V1 is "Done")

| Feature | Current State | Action |
|---|---|---|
| Marketing Dashboard (/marketing) | ❌ Missing | Build new |
| Add Campaign (manual entry form) | ❌ Missing | Build new |
| Campaign metrics: Spend, Reach, Leads, CPL | ❌ Missing | Build new |
| Campaign attribution on candidate (source = campaign) | ❌ Missing | Add `campaign_id` to contacts |
| Pipeline funnel chart (conversion %) in Analytics | ❌ Missing | Add to Analytics view |
| Source breakdown chart (where leads come from) | ❌ Missing | Add to Analytics view |
| Candidate cards show pipeline stage | ⚠️ Shows role | Update |
| Daily targets relabeled to pipeline stages | ⚠️ Shows old labels | Update DashboardView |
| CSV export with pipeline stage data | ⚠️ Partial | Update export query |
| Duplicate detection (phone) | ✅ Working | Keep as-is |
| Bulk action: Move selected candidates to stage | ⚠️ Scaffolded | Implement |
| Sidebar / BottomNav updated to new routes | ⚠️ Old routes | Update |
| "Candidates" replaces "Network" as section title | ⚠️ Says "Network" | Update |

---

## P2 — Meaningful Improvements (V1.5)

| Feature | Notes |
|---|---|
| Kanban drag-and-drop on desktop | V1 uses click-to-advance. Drag-and-drop is a UX enhancement. |
| Days-in-stage indicator on Kanban cards | Shows "Day 3 in Interview Scheduled" — turns red if too long |
| Follow-up auto-creation on Interview No-Show | When an interview is marked "No Show", prompt to set a follow-up |
| Interview attendance tracking (Attended/No Show) | Exists in schema. Surface in UI more prominently. |
| Campaign-level attribution in candidate profile | Show which campaign brought this candidate |
| Filter Kanban by source (Instagram, Walk-in, etc.) | Useful for the Marketing view |
| CSV import from Google Sheets | Common operational request. Low complexity. |
| Time-series chart (leads per day, last 30 days) | Add to Analytics view |
| Keyboard shortcuts for Kanban navigation | Arrow keys + Enter to open profile |
| Re-engage a "Lost" candidate | Dedicated "Re-engage" button to start a new opportunity |
| Profile photo upload | Optional. Nice to have. Supabase storage already configured. |
| Notes with pinning | Pin the most important note to the top of the profile |

---

## LATER — V2 Features

| Feature | Why Deferred |
|---|---|
| Meta Ads API integration | V1 uses manual entry. API integration requires OAuth, webhook handling, and a mapping layer. Complex. Build after manual flow is validated. |
| Role-based dashboards (Field BDA vs Office BDA auto-detect) | V1 everyone sees the same UI. Role-based views add complexity. |
| Team performance reports | V1 is for one operator. Multi-user analytics is V3 territory. |
| Pipeline automation (auto-advance stage on interview attended) | Risky in V1. Stage transitions should always be human-confirmed. |
| Notification system (push/email) | PWA notifications are scaffolded. Full implementation is V2. |
| Referral network as a featured section | Currently hidden. Resurface with proper UX in V2. |
| Campaign creative testing (which reel performs best) | Requires creative tracking table and tagging system. V2. |
| WhatsApp API integration | Explicitly deferred. V2+. |
| Google Forms → Auto-import leads | V2. Requires webhook/form handler. |
| Google Sheets import | V1.5 or V2. |
| Mobile app (React Native or Capacitor) | V3. PWA is sufficient for V1. |
| Multiple workspaces in the UI | Schema supports it. UI doesn't need it yet. V3. |

---

## NEVER — Explicitly Forbidden

The following features must never be built into RecruitOS without an explicit Product Bible amendment:

| Feature | Reason |
|---|---|
| Document uploads / OCR | Explicitly excluded. Adds complexity, no daily value. |
| Payroll / Salary management | Not a recruitment OS. Wrong product. |
| Attendance tracking | Wrong product. |
| AI chatbot / AI assistant | Adds complexity. The app should be fast, not clever. |
| Payment gateway | Wrong product. |
| WhatsApp API automation in V1 | Explicitly deferred. |
| Job posting board | This is an internal tool, not a job board. |
| Applicant portal (candidate self-service) | Too complex for V1. Candidates are managed by the team. |
| Email marketing | Wrong product. |
| Zapier / automation workflows | V2+ at earliest. |

---

## Feature vs. Reality Sanity Check

> Some features the founder listed are already built but have UX problems. Before building anything new, verify if the existing version already satisfies 70%+ of the need.

| Requested Feature | Already Exists? | Gap |
|---|---|---|
| Follow-up Reminders | ✅ Yes | Needs chaining from Call Log |
| Candidate Notes | ✅ Yes | Needs better visibility in UI |
| Kanban | ❌ No | Build |
| Activity Timeline | ✅ Yes | Already excellent |
| Search | ✅ Yes | Works well |
| Filters | ✅ Partial | Need pipeline-stage filters |
| Lead Sources | ✅ Partial | Exists but no campaign attribution |
| Marketing Dashboard | ❌ No | Build |
| Meta Ads Analytics | ❌ No | V1: manual entry, V2: API |
| Campaign Analytics | ❌ No | Build |
| CSV Export | ✅ Yes | Works. Needs pipeline stage data. |
| Daily Summary | ✅ Yes | End Day sheet is excellent |
| Duplicate Detection | ✅ Yes | Works |
| Reports | ✅ Partial | Needs funnel visualization |
