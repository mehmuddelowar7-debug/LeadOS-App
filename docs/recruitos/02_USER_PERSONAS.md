# 02 — User Personas

> These are not fictional archetypes. These are real people you work with every day. Every design decision should be filtered through their eyes.

---

## Persona 1: The Founder (YOU)

**Name:** Mehmud
**Role:** Founder, Marketing Lead, Strategy
**Devices:** MacBook (primary), iPhone (secondary)
**Tech Comfort:** Expert. Knows what good software feels like.

### A Typical Day
- Wakes up and checks the dashboard before anything else.
- Reviews yesterday's performance metrics.
- Checks which marketing campaigns are running and their CPL.
- Reviews the candidate pipeline — who moved, who dropped, who needs attention.
- Creates or reviews content for Instagram/Facebook.
- Sets targets and priorities for Field and Office BDAs.
- Reviews end-of-day summary.

### What They Need From RecruitOS
- **Dashboard:** Instant situational awareness. No loading. No noise.
- **Marketing:** Real attribution. Not just "source = instagram" — which campaign, which ad, which creative.
- **Pipeline health at a glance:** One number that tells you how today is going.
- **Reports that replace Excel:** Daily, weekly, monthly — downloadable in CSV.
- **Speed:** Never waiting more than 1 second for any action.

### Pain Points Today
- Switching between 4-5 different tools every morning.
- No idea which specific Instagram reel brought the best candidates.
- Has to compile Excel reports manually every week.
- Follow-ups get forgotten because they live in WhatsApp.

### What Would Make This Person Angry
- An app that takes more than 3 taps to do something common.
- Dashboard that requires scrolling to see the important stuff.
- Marketing data that's surface-level (just showing total leads, not CPL or conversion).
- Any enterprise feature they didn't ask for showing up in the UI.

---

## Persona 2: The Office BDA

**Name:** Riya (representative)
**Role:** Office BDA
**Devices:** Desktop/laptop, occasionally mobile
**Tech Comfort:** Medium. Comfortable with WhatsApp, Chrome, and basic apps.

### A Typical Day
- Arrives at the office. Opens the app. Sees who to call today.
- Goes through the follow-up queue — calls each lead, logs the outcome.
- Schedules interviews for interested candidates.
- Moves candidates to the next pipeline stage after confirmed attendance.
- Adds notes on every call — why they were interested, what their hesitation was.
- Sets reminders for leads who said "call me after 5 PM."
- End of day — marks tasks as done, checks tomorrow's follow-ups.

### What They Need From RecruitOS
- **Call queue:** "Here are the 12 people I need to call today, in order of priority."
- **One-click actions:** Call → Log outcome → Set follow-up. Three taps max.
- **Simple pipeline movement:** Drag or click to move candidate to next stage.
- **Interview scheduler:** Pick date, time, confirm. Done.
- **Notes that survive:** Can write notes on a call and find them 3 weeks later.

### Pain Points Today
- Using WhatsApp to track follow-ups — they get buried.
- No structured way to know who was contacted and what happened.
- Interview scheduling is done verbally, no record.
- Cannot see which candidates are close to the next stage vs. cold leads.

### What Would Make This Person Angry
- Having to navigate 5 screens to log a call.
- Not being able to find a contact's previous call history.
- The app crashing or loading slowly mid-call.
- Being shown marketing analytics or admin features they don't need.

---

## Persona 3: The Field BDA

**Name:** Kavya (representative)
**Role:** Field BDA
**Devices:** Android smartphone (mid-range)
**Tech Comfort:** Low-medium. Very comfortable with WhatsApp, not with forms.

### A Typical Day
- Wakes up, checks their assigned locations for the day.
- Travels to a market, PG, hostel, or event.
- Approaches girls and talks to them about the opportunity.
- Captures their details immediately on the spot — name, phone, where they're from.
- May visit 5-8 locations in a day.
- Connectivity varies: strong in markets, weak in some PGs, no signal underground.
- End of day — syncs all captured leads.

### What They Need From RecruitOS
- **Instant capture:** Open app → Big "Add Lead" button → Name, Phone, Area → Save. Under 10 seconds.
- **Works offline:** If they're capturing in a basement PG with no signal, it should still save locally.
- **Their leads:** Can see a list of leads they captured today.
- **Nothing else:** They should not see the Kanban, the marketing dashboard, or any management view.

### Pain Points Today
- Taking phone numbers on paper and entering them into WhatsApp at the end of the day — leads get lost.
- No easy way to note where they met someone ("Linking Road, near the watch shop").
- Cannot easily see how many leads they've captured today vs. their target.

### What Would Make This Person Angry
- A form with 20 fields. They are standing on a street talking to someone.
- The app requiring internet connection to save a lead.
- A complicated UI they have to navigate every time.

---

## Persona 4: The Candidate (Indirect User)

**Name:** Priya (representative)
**Role:** Candidate / Lead
**Devices:** Android smartphone
**Tech Comfort:** Basic. WhatsApp user.

> **Important note:** The candidate never directly uses RecruitOS. She is the *subject* of the system. However, every note, every interaction, every data point captured in RecruitOS must be accurate enough to reconstruct her exact journey when needed.

### Her Journey in the System
1. **Lead stage:** Field BDA captures her details at a market.
2. **Interview Scheduled:** Office BDA calls her. She agrees to an interview. Date and time are set.
3. **Selected:** She attends and is selected.
4. **Recharge:** She's asked to do a recharge/onboarding step.
5. **Joined:** She completes onboarding. Pipeline complete.

### What This Means for RecruitOS
- Every stage transition must be logged with a timestamp.
- Notes should allow free text — specific details about her situation (family support, travel distance, hesitations).
- Her source must be tracked — did she come from Instagram? A referral? A field visit?
- If she drops out, there must be a clear "Lost" marker with a reason.
- If she comes back 3 months later, her entire history should be immediately visible.

---

## Summary Matrix

| Dimension | Founder | Office BDA | Field BDA |
|---|---|---|---|
| Primary Device | MacBook | Desktop | Android |
| Connectivity | Always | Always | Sometimes |
| Most Used Screen | Dashboard | Kanban + Profile | Quick Capture |
| Key Metric | CPL, Joined | Interviews, Conversions | Leads Added Today |
| Biggest Need | Attribution | Structured follow-up | Speed + Offline |
| Biggest Fear | Missing ROI data | Losing a lead in the queue | App freezing on the field |
| Should See Marketing? | Yes | No | No |
| Should See Pipeline? | Yes (overview) | Yes (deep) | No |
