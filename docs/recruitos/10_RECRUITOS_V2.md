# 10 — RecruitOS V2 Vision

> V2 is the version that replaces Meta Ads dashboard entirely and introduces true marketing intelligence. The pipeline becomes smarter, the team can collaborate more effectively, and automation handles the routine.

---

## V2 Entry Criteria

V2 development begins only when:
1. V1 has been used daily for at least 4 weeks.
2. The 5-stage pipeline is fully operational and validated.
3. The founder is no longer opening any external tool for candidate tracking.
4. Marketing manual entry is confirmed working and the data model is validated.

---

## V2 Theme: Marketing Intelligence + Team Efficiency

---

## V2 Feature Set

### 1. Meta Ads API Integration (Replaces Manual Entry)

**What it does:** Pulls campaign data automatically from the Meta Ads API — spend, reach, impressions, clicks, leads from lead forms.

**Technical approach:**
- OAuth flow with Meta Business Manager.
- Webhook or scheduled sync (every 6 hours).
- Stores raw API response in `campaigns.raw_data JSONB`.
- Frontend merges API data with internal pipeline data.

**Why deferred to V2:** Requires Meta App review, OAuth implementation, rate limiting, and field-mapping. The manual entry flow must be validated first so we know what data is actually useful.

---

### 2. Creative-Level Tracking

**What it does:** Track individual ad creatives (specific Reels, static images) within a campaign.

**New table: `campaign_creatives`**
```sql
CREATE TABLE campaign_creatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  name TEXT NOT NULL,            -- "Kitchen Reel V3"
  creative_type TEXT,            -- 'reel' | 'static' | 'story' | 'carousel'
  spend DECIMAL(10,2) DEFAULT 0,
  reach INT DEFAULT 0,
  leads INT DEFAULT 0,
  external_id TEXT,              -- Meta creative ID
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Frontend:** Add "Creatives" sub-section inside Campaign Detail.

---

### 3. Full Attribution Chain

**What it does:** Every candidate is linked to the exact Campaign + Creative that generated them.

**Data model update:**
```sql
ALTER TABLE contacts ADD COLUMN creative_id UUID REFERENCES campaign_creatives(id);
```

**UI:** In candidate profile, show:
```
Lead Source: Instagram → Campaign "Reel #24" → Creative "Kitchen Reel V3"
```

**Marketing view:** Show best-performing creatives ranked by "Lead to Join" conversion.

---

### 4. Kanban Drag-and-Drop

**What it does:** Office BDA can drag candidate cards between Kanban columns on desktop.

**Technical:** Use `@dnd-kit/core` (lighter than react-beautiful-dnd, maintained).

**Why deferred to V2:** Click-to-advance works functionally. Drag-and-drop is a UX enhancement that requires careful implementation to avoid bugs with the offline sync queue.

---

### 5. Pipeline Automation Rules (Simple)

**What it does:** When a candidate reaches a certain stage, automatically create a follow-up.

**Examples:**
- "When Interview Scheduled → automatically create follow-up for interview day - 1 day (reminder to confirm attendance)."
- "When Interview No-Show → automatically create follow-up for next day."
- "When Selected → automatically create follow-up for Recharge step in 2 days."

**Technical:** Supabase Edge Functions or PostgreSQL triggers. Rules stored as JSONB in workspace config.

---

### 6. Team Performance Dashboard

**What it does:** Shows each BDA's performance — leads added, calls made, interviews scheduled.

**Data already available:** `workspace_members`, `contact_activities`, `contacts.created_by`.

**New view:** `/analytics/team`
```
[ Table: Name | Leads | Calls | Interviews | Joined | Target % ]
```

---

### 7. Google Forms Auto-Import

**What it does:** Inbound leads from Meta lead forms or Google Forms are automatically imported as contacts in the pipeline.

**Technical:**
- Webhook endpoint (Supabase Edge Function).
- Meta lead form webhook (set up in Meta Events Manager).
- Maps form fields to contact fields.
- Auto-attributes to the campaign.

---

### 8. Role-Based Dashboards

**What it does:** When a Field BDA logs in, they see only Quick Capture and their leads for today. When an Office BDA logs in, they see the full pipeline. When the founder logs in, they see everything including marketing.

**Implementation:**
- Role detected from `workspace_members.role`.
- `role` field extended: `field_bda`, `office_bda`, `marketing`, `owner`.
- Dashboard component switches layout based on role.

---

### 9. Improved Follow-up System

**V2 follow-up features:**
- **Recurring follow-ups:** "Follow up every Monday until she confirms."
- **Follow-up templates:** Pre-written notes for common scenarios.
- **Bulk follow-up assignment:** "Set a follow-up for all candidates who haven't been called in 7 days."
- **Smart sorting:** Priority score based on how long they've been in a stage.

---

### 10. Notification System (PWA Push)

**What it does:** Browser/phone notifications for:
- Follow-up reminders when they're due.
- Interview day reminders.
- New lead captured by Field BDA (for manager).

**Technical:** PWA push notifications via web-push API. Service worker already scaffolded (vite-plugin-pwa is installed).

---

### 11. CSV Import from Google Sheets

**What it does:** Upload a CSV of candidates (with name, phone, area) and import them bulk into the Lead stage.

**V2 implementation:**
- File input (CSV only).
- Preview table before import.
- Duplicate detection run before insert.
- Map columns (name, phone, area — required; source, campaign — optional).

---

### 12. Data Quality Engine (Expanded)

**V1 data quality:** Already partially built (`useDataQuality.ts` exists).

**V2 additions:**
- "Candidates stale in Interview Scheduled for > 7 days."
- "Candidates with no follow-up scheduled."
- "Leads added today with no call attempt."
- Weekly data quality report email (stretch goal).

---

## V2 Non-Goals

Even in V2, these remain excluded:
- AI chatbot or AI suggestions.
- WhatsApp automation.
- Document uploads.
- Payroll.
- Attendance.
- Public job portal.
