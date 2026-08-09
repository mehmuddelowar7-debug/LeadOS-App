# 11 — RecruitOS V3 Vision

> V3 is the version where RecruitOS becomes a team product. Multiple users with defined roles, comprehensive team analytics, and the foundation for eventually opening to other recruiters.

---

## V3 Theme: Multi-User, Multi-Workspace, Team Intelligence

V3 is built only after V2 is stable and the founder has validated that the system is genuinely being used as a daily operating system, not just as a experiment.

---

## V3 Feature Set

### 1. Full Role-Based Access Control

**Roles:**
| Role | Access |
|---|---|
| `owner` | Everything. Can modify workspace settings, manage members, see all data. |
| `manager` | Sees all team data, can assign leads, can view all analytics. Cannot modify workspace. |
| `office_bda` | Sees pipeline, manages their assigned leads, logs calls, schedules interviews. Cannot see marketing. |
| `field_bda` | Only sees Quick Capture and today's assigned leads. Cannot see pipeline, analytics, or marketing. |
| `marketing` | Only sees Marketing Dashboard and can add campaigns. Cannot see individual candidates. |

**Implementation:**
- `workspace_members.role` extended with new values.
- Supabase RLS policies updated per role.
- Frontend routing gates per role.
- Navigation adapts to role automatically.

---

### 2. Lead Assignment

**What it does:** Manager or owner assigns specific leads (or a location/source) to a Field BDA.

**Data model:**
```sql
ALTER TABLE contacts ADD COLUMN assigned_to UUID REFERENCES auth.users(id);
ALTER TABLE contacts ADD COLUMN assigned_location TEXT; -- The location this BDA covers
```

**UI:**
- Manager can drag a lead to a BDA's "inbox" in a team view.
- BDA sees only their assigned leads.
- "Unassigned" leads visible to manager and owner.

---

### 3. Team Performance Leaderboard

**What it does:** A visible, motivating display of each team member's weekly performance.

```
[ This Week ]
[ 🥇 Riya    : 24 Leads | 8 Interviews | 3 Joined ]
[ 🥈 Preethi : 18 Leads | 6 Interviews | 2 Joined ]
[ 🥉 Kavya   : 12 Leads | 4 Interviews | 1 Joined ]
```

**Data source:** Already computable from `contacts.created_by`, `contact_activities`, `interviews`.

---

### 4. Manager Dashboard

**What it does:** A dedicated view for managers to see team-wide activity.

```
[ Total Leads Today: 48 (from 3 Field BDAs) ]
[ Total Calls Today: 32 (from 2 Office BDAs) ]
[ Pipeline Health: 12 leads stale > 5 days ]
[ Alerts: Preethi has 3 overdue follow-ups ]
```

---

### 5. Multiple Workspaces (Multi-Company)

**What it does:** A single RecruitOS account can manage multiple companies or brands.

**Data model:** Already fully supported by the `workspaces` schema.

**UI addition:**
- Workspace selector in the sidebar/nav.
- Each workspace has its own pipeline, contacts, and marketing.
- Billing (if ever commercialized) is per workspace.

---

### 6. Audit Log

**What it does:** A full log of every action taken in the system — who added a lead, who moved a stage, who deleted a contact.

**Data model:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,          -- 'contact_created', 'stage_changed', 'lead_deleted'
  entity_type TEXT NOT NULL,     -- 'contact', 'opportunity', 'campaign'
  entity_id UUID,
  metadata JSONB DEFAULT '{}',   -- Before/after state
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 7. Advanced Analytics

**Team-level:**
- Conversion rate by BDA.
- Interview attendance rate by interviewer.
- Lead quality score by source + BDA.

**Campaign-level:**
- Best campaign by join rate (not just leads).
- Month-over-month CPL trend.
- Budget recommendation engine (simple: "This campaign's CPL is 3x the average — consider pausing").

---

### 8. Mobile App (Native or Capacitor)

**What it does:** A proper mobile app for Field BDAs instead of PWA.

**Why V3:** PWA covers 80% of Field BDA needs. A native app adds value primarily for:
- Background notifications.
- Better offline storage.
- Home screen presence without browser.

**Technical options:**
1. **Capacitor** (wraps existing React app) — Fastest path.
2. **React Native** (shared logic, native UI) — Better performance, more work.

---

## V3 Commercialization Option

If RecruitOS evolves to serve other recruiters (not just the founder), V3 is where that begins:

- Self-service workspace creation.
- Subscription billing (Stripe).
- Public landing page.
- Documentation for other users.

**Note:** This is explicitly OPTIONAL. RecruitOS may remain a personal tool forever and that is perfectly valid.

---

## V3 Non-Goals

- AI candidate scoring (too much complexity, low trust).
- Video interviews.
- Resume parsing.
- Job board integration.
- Complex HRMS features.

The product philosophy does not change in V3. It just serves more people, more roles, more effectively.
