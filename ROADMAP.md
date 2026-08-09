# Roadmap: LeadOS -> RecruitOS

## Phase 1: The Pruning (Week 1)
- **Database Cleanup:** Remove `contact_documents`, `gamification`, `incentives`, and `sync_queue` schemas.
- **UI Simplification:** Remove gamification elements, enterprise settings, and bloated dashboard widgets.
- **Role Scoping:** Hardcode or simplify roles into Office BDA, Field BDA, and Marketing.

## Phase 2: Core Workflow (Week 2)
- **Kanban Board:** Implement drag-and-drop pipeline (Lead -> Interview Scheduled -> Selected -> Recharge -> Joined).
- **Timeline View:** Revamp the contact details page to show a linear, chronological history of all activities.
- **Optimized Mobile Form:** Build a lightning-fast data entry form for Field BDAs.

## Phase 3: Marketing Intelligence (Week 3)
- **Campaign Tracking:** Build the `campaigns` table and UI.
- **Analytics Dashboard:** Build the Marketing Dashboard to track Reach, Spend, CPL, and Leads generated.
- **Conversion Tracking:** Tie campaigns to the pipeline to calculate ROI (e.g., $50 spent -> 10 leads -> 1 joined).

## Phase 4: Polish & Performance (Week 4)
- **Apple Aesthetics:** Refine spacing, typography, and micro-interactions. Minimal, monochromatic, high contrast.
- **Query Optimization:** Cache dashboard metrics.
- **Search & Filters:** Implement robust, instant global search for candidates.
