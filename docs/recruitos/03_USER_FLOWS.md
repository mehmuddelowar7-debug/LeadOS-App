# 03 — User Flows

> These are the exact sequences of actions each user takes to accomplish their core jobs. Every screen and interaction must support these flows. If a flow requires more than the steps described here, the design has failed.

---

## Flow 1: Field BDA Captures a Lead (Critical Path)

**Goal:** Capture a candidate's information in under 30 seconds.
**Device:** Mobile (Android)
**Connectivity:** May be offline.

```
Field BDA opens the app
  ↓
Sees Quick Capture button immediately (no navigation needed)
  ↓
Taps it
  ↓
Full-screen capture form appears
  ↓
Types: Name
  ↓
Types: Phone number
  ↓
Selects: Area / Location (from a short dropdown or text)
  ↓
(Optional) Selects source: Walk-in / Referral / Instagram / Facebook
  ↓
Taps "Save"
  ↓
Confirmation toast: "Lead saved ✓"
  ↓
Form resets instantly for next capture
```

**Non-negotiables for this flow:**
- Zero required logins mid-flow (must already be logged in).
- If offline: lead is saved locally. Syncs on reconnect.
- No more than 3 required fields (Name, Phone, Area). Everything else optional.
- The "Save" button must always be visible without scrolling.
- After save, the form resets in under 200ms. The BDA should be able to capture 10 leads without leaving the form.

**Duplicate detection:** If the phone number already exists, show a warning banner (not a blocking modal). Let the BDA choose: update existing or continue.

---

## Flow 2: Office BDA Processes the Daily Call Queue

**Goal:** Call every lead in today's queue, log the outcome, and set the next step.
**Device:** Desktop
**Connectivity:** Online.

```
Office BDA opens app
  ↓
Dashboard shows Work Queue: "8 Follow-ups Today"
  ↓
Clicks on Work Queue card
  ↓
Enters the Follow-up Queue (sorted by priority: overdue first, then today)
  ↓
Opens first lead → Contact Profile opens (on desktop: as side panel)
  ↓
Clicks "Call" button → Phone dialer opens
  ↓
After call ends → "Log Call" sheet appears
  ↓
Selects outcome: Interested / Busy / No Answer / Call Later / Wrong Number
  ↓
(If interested) Types a quick note
  ↓
(If interested) Clicks "Schedule Interview" or sets a follow-up date
  ↓
Saves
  ↓
Returns to queue → Next lead loads
```

**Non-negotiables:**
- After logging a call, the next lead should appear automatically (queue flow, like a to-do list).
- If they select "Call Later" → ask for a date/time → auto-creates follow-up.
- Interview scheduling must be completable in under 4 taps.

---

## Flow 3: Moving a Candidate Through the Pipeline

**Goal:** Update a candidate's stage after a key event (interview attended, recharge done, etc.)
**Device:** Desktop or mobile.

```
Office BDA or Founder opens Pipeline / Kanban view
  ↓
Sees candidate card in the current stage column
  ↓
Option A (Kanban): Drags card to next column
Option B (Profile): Opens profile → Clicks pipeline stage button → Confirms
  ↓
System asks for any additional info (e.g., Interview date for "Interview Scheduled", notes for "Selected")
  ↓
Stage updated
  ↓
Activity timeline logs the change with timestamp and who moved it
  ↓
Follow-up reminder auto-set (if configured) for the new stage
```

**Non-negotiables:**
- Both drag-and-drop (desktop) and click-to-advance (mobile) must work.
- Every stage transition auto-logs to the activity timeline. No manual logging needed.
- If a candidate is moved backward (e.g., from Selected back to Interview Scheduled), a reason must be provided.

---

## Flow 4: Scheduling an Interview

**Goal:** Set an interview date/time for a candidate and track attendance.
**Device:** Desktop or mobile.

```
Office BDA is on a call with a candidate
  ↓
Opens candidate profile (already open in side panel on desktop)
  ↓
Clicks "Schedule Interview"
  ↓
Date picker appears (defaults to tomorrow)
  ↓
Time picker (defaults to 10:00 AM)
  ↓
Location field (branch name or address)
  ↓
Saves
  ↓
Interview appears in Dashboard under "Interviews Today"
  ↓
Candidate moves to "Interview Scheduled" stage in pipeline
  ↓
[On interview day] Office BDA marks attendance: Attended / No-Show / Rescheduled
  ↓
If Attended → candidate advances to "Selected" (or stays if not yet selected)
If No-Show → follow-up created automatically
```

---

## Flow 5: Adding a Follow-up Reminder

**Goal:** Ensure no lead is forgotten.
**Device:** Desktop or mobile.

```
After a call where the candidate says "call me after 5 PM" or "call me next week"
  ↓
Office BDA opens candidate profile
  ↓
Clicks "Set Follow-up"
  ↓
Picks date and time
  ↓
Types optional note: "Said she needs to speak to her husband first"
  ↓
Saves
  ↓
Follow-up appears on the dashboard on the chosen date
  ↓
Notification shown (if PWA notifications enabled)
```

---

## Flow 6: Founder Reviews Daily Marketing Performance

**Goal:** Understand where today's leads came from and which campaigns are performing.
**Device:** Desktop.

```
Founder opens Marketing section
  ↓
Sees all active campaigns (Instagram, Facebook, Meta Ads)
  ↓
Each campaign shows: Spend, Reach, Leads Generated, CPL
  ↓
Clicks into a campaign → sees individual ad performance
  ↓
Checks conversion: Leads → Interviews → Selected → Joined from this campaign
  ↓
Compares campaigns to identify top performers
  ↓
Manually updates campaign data (V1: manual entry; V2: Meta API sync)
```

---

## Flow 7: Adding Notes to a Candidate

**Goal:** Record relevant qualitative information about a candidate.
**Device:** Any.

```
Opens candidate profile
  ↓
Scrolls to Notes section or clicks "Add Note"
  ↓
Text area appears (autofocused)
  ↓
Types note: "Very interested. Parents are supportive. Works near Brigade Road. Best time to call: 11 AM."
  ↓
Saves
  ↓
Note appears in activity timeline with timestamp
```

---

## Flow 8: Searching for a Candidate

**Goal:** Find any candidate instantly, regardless of which screen you're on.
**Device:** Desktop or mobile.

```
Press ⌘K (desktop) or tap Search icon (mobile)
  ↓
Global search modal appears with instant focus
  ↓
Type name, phone, or area
  ↓
Results appear within 200ms (from local cache)
  ↓
Click result → navigate directly to candidate profile
```

**Non-negotiables:**
- Search works against: name, phone, current_area, origin.
- Results load from local React Query cache first — no network round-trip.
- On mobile, search is always visible at the top of the Contacts screen.

---

## Flow 9: Founder Generates a Weekly Report

**Goal:** Get a structured summary of the week's performance.

```
Founder opens Analytics / Reports section
  ↓
Selects time period: This Week / Last Week / This Month / Custom
  ↓
Sees summary: Leads added, Interviews held, Candidates selected, Recharges, Joins
  ↓
Sees conversion rates between each stage
  ↓
Optionally clicks "Export CSV"
  ↓
CSV downloads with full candidate data for the period
```

---

## Flow 10: End of Day Summary

**Goal:** Close out the day with a clear record of what happened.

```
Founder or Office BDA clicks "End Day" on the Dashboard
  ↓
End Day sheet appears
  ↓
Shows today's counts: Leads, Calls, Interviews, Recharges
  ↓
Shows pending items that roll over to tomorrow
  ↓
Option to add any notes for the day
  ↓
Confirms "End Day"
  ↓
Daily snapshot is saved
  ↓
Tomorrow's follow-up queue is prepared
```

---

## Flow 11: Duplicate Lead Detected

**Goal:** Prevent duplicate contacts from polluting the database.

```
Field BDA enters a phone number that already exists
  ↓
System shows banner: "⚠️ This number already exists — [Name], added [X days ago]"
  ↓
BDA sees three options:
  A. "Update existing" — navigate to existing contact
  B. "Continue anyway" — save as new (if they believe it's a different person)
  C. "Cancel" — go back
```

> **Designer note:** This is a warning, not a blocker. Field BDAs are on the street and may be capturing a referral from the same phone. Trust the user.

---

## Flow 12: Candidate Returns After Dropping Out

**Goal:** Re-engage a previously lost candidate without losing their history.

```
Office BDA gets a call from someone who previously dropped out
  ↓
Searches by phone → Finds existing contact with "Lost" status
  ↓
Sees full history: when they dropped, why, all previous calls
  ↓
Clicks "Re-engage" → Creates a new Opportunity (not overwriting the old one)
  ↓
New pipeline starts fresh: "Lead"
  ↓
Old history remains visible in the activity timeline
```

> **Why this matters:** This is exactly why Contacts and Opportunities are kept separate. History is sacred.
