# 01 — RecruitOS Product Bible

> This document is the founding constitution of RecruitOS. Every feature decision, design choice, and technical trade-off must be measured against what is written here. If something contradicts this document, the document wins — unless the document is explicitly amended by the founder.

---

## 1. What RecruitOS Is

RecruitOS is a **Recruitment Operating System** built for one primary user: a solo recruitment operator who wears multiple hats — field coordination, office operations, and performance marketing.

It is **not** a CRM.
It is **not** an ATS.
It is **not** enterprise software.

It is a personal command center. Think of it as the intersection of:

- **Linear** (clean, fast, keyboard-first workflow)
- **Notion** (flexible enough to replace notes and sheets)
- **Attio** (relationship-intelligence, not just contact records)
- **Apple Notes** (you actually open it every single day)

The test is simple: **Would you open it before opening WhatsApp?** If yes, it succeeded.

---

## 2. The Problem It Solves

Today, the founder manages recruitment across:

| Tool | What it's used for |
|---|---|
| Google Sheets | Tracking candidate progress |
| WhatsApp | Follow-up reminders and notes |
| Meta Ads Manager | Tracking ad spend and leads |
| Paper/Notes App | Daily follow-up lists |
| Instagram DMs | Inbound marketing leads |
| Excel | End-of-week reports |

Every one of these should be **obsolete** after RecruitOS is live.

---

## 3. The Single Most Important Concept

> Everything in RecruitOS revolves around one pipeline. This pipeline is non-negotiable.

```
Lead
  ↓
Interview Scheduled
  ↓
Selected
  ↓
Recharge
  ↓
Joined
```

Every screen, every report, every alert, every badge, every metric should answer one of these questions:

1. **How many people are in each stage right now?**
2. **What do I need to do to move them to the next stage?**
3. **Why are people dropping out between stages?**
4. **Which marketing channel is sending the best candidates?**

There are no other questions.

---

## 4. What RecruitOS Replaces (The Replacement Doctrine)

| Current Tool | RecruitOS Module |
|---|---|
| Google Sheets candidate tracker | Pipeline / Kanban |
| WhatsApp follow-up notes | Follow-up Reminders + Notes |
| Meta Ads dashboard | Marketing Analytics |
| Paper visit logs | Field Capture (Quick Add) |
| Excel weekly report | Daily Summary + Reports |
| Facebook Ads Manager | Marketing Attribution |
| Sticky notes for interviews | Interview Scheduler |

**The doctrine:** If a feature doesn't replace something the founder currently does manually, it should not exist.

---

## 5. The Three Modes of Operation

RecruitOS has three operational modes, each mapping to a real-world job:

### Mode 1: Field Mode (Field BDA)
- Goal: Capture a lead in under 30 seconds.
- Device: Mobile phone, likely outdoors.
- Connectivity: May be offline.
- UI: Full-screen form, large tap targets, minimal fields.
- Key Action: Name + Phone + Location → Saved. Done.

### Mode 2: Office Mode (Office BDA)
- Goal: Process the pipeline — call, schedule, follow up, move.
- Device: Desktop or laptop, seated, focused.
- Connectivity: Online.
- UI: Kanban view, side-by-side contact profile, keyboard shortcuts.
- Key Action: Open Kanban → See who to call → Call → Log outcome → Set follow-up.

### Mode 3: Marketing Mode (Marketing / Founder)
- Goal: See ROI, understand what's working, kill what isn't.
- Device: Desktop, anytime.
- Connectivity: Online.
- UI: Campaign dashboard, funnel charts, CPL breakdown.
- Key Action: Open Marketing → See campaigns → Check CPL → Check interview rate → Decide budget.

---

## 6. Core Product Principles

### P1 — Speed is a Feature
Every interaction should be faster than the alternative. If adding a lead takes 15 seconds in RecruitOS but 10 seconds in WhatsApp, we have failed. Target: under 10 seconds for any common action.

### P2 — One Screen, One Job
Every page must have a single, clear purpose. The dashboard shows what to do today. The Kanban shows where everyone is. The profile shows one candidate. Never combine two purposes on one screen.

### P3 — Mobile First, Desktop Elevated
Field BDAs live on mobile. Build for mobile first. Office BDAs and the founder work on desktop. When on desktop, give them power tools (keyboard shortcuts, split view, bulk actions). Both experiences must be premium.

### P4 — The Pipeline Is Sacred
Never add a pipeline stage. Never rename an existing stage without a documented founder decision. Never let a candidate appear in two stages simultaneously. The pipeline is the spine of everything.

### P5 — Offline-Capable for Field Users
Field BDAs visit markets, PGs, hostels, events. Connectivity is unreliable. Any action a Field BDA needs to perform must work offline and sync when reconnected.

### P6 — Marketing Is Independent
The marketing module never interferes with the recruitment pipeline UI. It lives in its own section. A Field BDA should never see an ad spend number. A Marketing view should always show campaign ROI, never field visit logs.

### P7 — Respect the Founder's Time
If a feature will save the founder 30 seconds per day, build it. If it takes 30 seconds away, kill it. This is a tool for productivity, not feature showcasing.

### P8 — No Enterprise Bloat
No document uploads. No attendance. No payroll. No AI chatbots. No payment gateways. No OCR. No WhatsApp API (V1). This list is permanent unless explicitly amended by the founder.

---

## 7. The Competitive Positioning

| Product | How RecruitOS Is Different |
|---|---|
| Salesforce | Not built for enterprise. No modules, no training. One person, one pipeline. |
| Zoho Recruit | Not a generic ATS. No job postings, no applicant tracking. Just your pipeline. |
| HubSpot | Not a CRM. No deals, no pipelines for sales. Recruitment-specific pipeline only. |
| Greenhouse | Not for large HR teams. Designed for one operator with a team of 2-3. |
| Notion | Notion has no pipeline logic, no mobile-first capture, no analytics. |
| Google Sheets | No real-time sync, no notifications, no mobile UX, no attribution. |

---

## 8. Version Philosophy

### V1 — Replace the spreadsheet
Core pipeline works. Daily workflow is fully in the app. Marketing module is basic.

### V2 — Replace Meta Ads dashboard
Deep marketing attribution. Campaign-level ROI. Conversion funnel from ad to join.

### V3 — Team-ready
Multi-user workflows. Role-based dashboards. Team performance reports.

---

## 9. Non-Negotiable Constraints

1. **The pipeline has exactly 5 stages.** Always. Forever.
2. **Contacts and Opportunities are always separate.** A candidate may return. History must be preserved.
3. **Offline sync stays.** Field users need it. Simplify it, never remove it.
4. **Multi-tenant schema stays.** Single workspace by default. Future-proof.
5. **Dark mode is the default.** Light mode exists but is secondary.
6. **Geist Variable is the font.** Already set up. Do not change.
7. **No working code is deleted without an explicit founder decision in `17_FOUNDER_DECISIONS.md`.**

---

## 10. The Daily Life This Software Enables

**6:00 AM** — Founder wakes up. Opens RecruitOS Dashboard. Sees: 3 follow-ups due today. 2 interviews scheduled. 1 recharge pending. Knows exactly what the day looks like.

**9:00 AM** — Field BDA opens the app on their phone. Sees their assigned locations. Captures 8 leads throughout the day. App works even when the signal drops.

**11:00 AM** — Office BDA opens the Kanban. Sees 15 leads in the pipeline. Calls 5. Moves 2 to "Interview Scheduled". Sets follow-ups for 3 more.

**6:00 PM** — Founder opens Marketing Dashboard. Sees that the Instagram Reel from yesterday brought 14 inbound leads at ₹85 CPL. The Facebook campaign is at ₹210 CPL. Decision: pause Facebook, boost Instagram.

**9:00 PM** — Daily Summary auto-generates. 8 leads added. 3 interviews scheduled. 1 joined. End Day report ready.

This is the software we are building.
