# ROADMAP_v2.md
# RecruitOS — Canonical Product & Engineering Roadmap

**Version:** 2.0  
**Status:** FROZEN — Effective from v1.0 (August 2026)  
**Owner:** Principal Architect  
**Last Reviewed:** August 2026

> This document is the single source of truth for the RecruitOS product strategy, engineering architecture, and version roadmap. Every sprint, feature decision, and architectural change must be evaluated against this document. Any change to this document requires an Architecture Decision Record (ADR).

---

## 1. Vision

RecruitOS is an **AI-first Recruitment Operating System** for independent and small-team recruiters.

It is not a CRM with extras. It is an operating system that:

- **Eliminates cognitive overhead** — the recruiter should never need to manually assess what to do next.
- **Surfaces intelligence automatically** — every data point becomes a recommendation.
- **Executes work on the recruiter's behalf** — where human approval is given, the system acts.
- **Learns from outcomes** — candidate journeys, marketing attribution, and conversion data feed back into better decisions.

The north star metric is: **Time to fill a placement, reduced by 50%.**

---

## 2. Product Principles

These are non-negotiable. Any feature that violates these principles must not ship.

1. **The recruiter is always in control.** Automation suggests. Humans decide.
2. **Every pixel must be actionable.** No vanity metrics. No decorative dashboards.
3. **Intelligence, not data.** Don't show numbers — show decisions.
4. **Zero friction for the common case.** The most frequent recruiter actions require the fewest taps.
5. **Deterministic over probabilistic.** Every recommendation must be explainable by a rule, not a model.
6. **Mobile-first.** Field recruiters operate on phones. Desktop is supplementary.
7. **Offline-tolerant.** React Query + PWA must handle poor connectivity gracefully.
8. **Enterprise-grade reliability.** An error in one module must never crash the entire application.

---

## 3. Frozen Architecture (v1.0 Baseline)

The following architectural decisions are frozen as of v1.0. No change may be made without an ADR.

### 3.1 Frontend Architecture

| Concern | Decision |
|---|---|
| Framework | React 19 (Vite) |
| Language | TypeScript (strict mode) |
| Styling | Vanilla CSS + TailwindCSS v4 |
| State | Zustand (auth, UI) + React Query v5 (server state) |
| Routing | React Router v7 |
| Icons | Lucide React |
| Component Library | Custom primitives (no external UI kit) |
| Build | Vite 8 with Rolldown bundler |
| PWA | Workbox (generateSW) |

### 3.2 Backend Architecture

| Concern | Decision |
|---|---|
| Platform | Supabase (PostgreSQL 17) |
| Auth | Supabase Auth (JWT) |
| Security | Row Level Security (RLS) on all tables |
| Real-time | Supabase Realtime (subscriptions, not polling) |
| File Storage | Supabase Storage |
| Edge Functions | Reserved for external webhook receivers only |

### 3.3 Intelligence Architecture

| Concern | Decision |
|---|---|
| Location | `src/engine/intelligence/` |
| Philosophy | Pure functions, deterministic, zero side effects |
| Data source | React Query cache only (no direct DB queries) |
| Types | `src/engine/intelligence/types/` |
| Constants | `src/engine/intelligence/constants/` |

### 3.4 Automation Architecture

| Concern | Decision |
|---|---|
| Location | `src/engine/automation/` |
| Philosophy | Client-side simulation; render-cycle triggers |
| Execution | Human approval required for all write operations |
| Rollback | Unmount `useAutomationEngine()` to disable entirely |

### 3.5 Database Baseline

**DATABASE_BASELINE_v0.5 is frozen.**  
No table, column, enum, relationship, trigger, index, or RLS policy may be added, removed, or modified without a formal ADR.

Core tables (frozen): `contacts`, `opportunities`, `activities`, `follow_ups`, `interviews`, `marketing_sources`, `marketing_campaigns`, `marketing_creatives`, `marketing_touchpoints`, `marketing_events`, `marketing_imports`, `workspaces`, `workspace_members`.

---

## 4. ADR Index

All Architecture Decision Records live in `docs/architecture/`.

| ADR | Title | Status |
|---|---|---|
| ADR-001 | Marketing Architecture | Frozen |
| ADR-002 | Pipeline Architecture | Frozen |
| ADR-003 | Dashboard Architecture (superseded by Operations Center) | Deprecated |
| ADR-004 | Candidate Intelligence Architecture | Frozen |
| ADR-005 | Search Architecture | Frozen |
| ADR-006 | AI Knowledge Engine Architecture | Planned (Sprint 11A) |

> Every new sprint that introduces a major module, pattern, or infrastructure dependency must produce a new ADR before implementation begins.

---

## 5. Version Roadmap

### ✅ v1.0 — Foundation (COMPLETE)
**Sprints 0–10A**

The stable, production-ready base. All future versions build on this.

- CRM (Contacts, Pipeline, Profiles)
- Operations Center (replaces Dashboard)
- Candidate Intelligence Engine (deterministic, rule-based)
- Marketing Intelligence (omni-channel attribution)
- Global Search (Command Palette)
- Automation Engine (client-side, human-approved)
- Architecture freeze (DATABASE_BASELINE_v0.5)
- ADR discipline (5 ADRs published)
- Error boundaries on all critical modules
- Bundle size: ~55KB (gzipped main chunk)

---

### 🟡 v1.1 — AI Layer (NEXT)
**Sprints 11A–11F**

Transform RecruitOS from a tracking system into an AI-first recruitment operating system.

#### Sprint 11A — AI Knowledge Engine
**Goal:** Give the AI complete, structured awareness of the entire business state.

- Build a read-only `useAIContext()` hook.
- Compose all cached React Query data (candidates, pipeline, marketing, interviews, follow-ups, automation) into a single structured JSON context.
- Zero backend changes. Zero new network requests.
- Output: A deterministic snapshot of the business state, ready to be passed to any AI model.

#### Sprint 11B — AI Recruiter Assistant
**Goal:** Natural-language interface embedded into RecruitOS.

- A conversational panel powered by the AI Knowledge Engine context.
- Answers questions like: "Who should I call first?", "Which interview is at risk?", "Which campaign is wasting money?"
- Processes against cached data first; only falls back to AI model if data cannot answer the question deterministically.
- Keyboard shortcut: `Cmd+/`

#### Sprint 11C — AI Candidate Summary
**Goal:** Every candidate profile gets an auto-generated executive summary.

- Replaces the manual reading of contact timelines.
- Summary format: Entry source → Engagement history → Current status → Risk assessment → Recommended action.
- Generated on-demand. No pre-computation or background jobs.

#### Sprint 11D — AI Marketing Analyst
**Goal:** Replace dashboard charts with readable, actionable marketing intelligence.

- Produces natural language summaries of campaign performance (e.g., "Instagram is producing 43% more joined candidates than Facebook").
- Surfaces budget reallocation recommendations.
- Integrated into the Marketing module's home view.

#### Sprint 11E — AI Operations Coach
**Goal:** Every morning, RecruitOS delivers a structured daily briefing.

- Replaces the static Operations Center header with a dynamic, AI-generated briefing.
- Format: Greeting → Today's Priority Tasks → Risk Alerts → Estimated Workload.
- Computed from the AI Knowledge Engine context on application load.

#### Sprint 11F — AI Conversation Layer
**Goal:** Capture and process unstructured human communication.

- WhatsApp conversation ingestion
- Call note summarization
- Voice transcript processing
- Sentiment detection
- Auto follow-up draft generation
- Requires ADR-007 before implementation.

---

### 🔵 v1.2 — External Integrations
**After v1.1 is complete**

Integrations only become valuable once the AI layer can interpret the incoming data.

- Meta Lead Ads (automatic lead capture)
- Google Ads attribution
- WhatsApp Business API
- Gmail / Outlook
- Google Calendar sync
- Google Forms
- CSV / Excel import
- Webhook API (inbound)

> Each integration requires its own ADR. No integration may modify the frozen database schema without consensus.

---

### 🔵 v1.3 — Reporting
**After v1.2 is complete**

Reports become meaningful only when real, integrated data is flowing.

- Recruiter Performance Report
- Team Performance Report
- Source ROI Report
- Campaign ROI Report
- Candidate Funnel Analysis
- SLA Compliance Report
- Export to CSV, Excel, PDF
- Printable report templates

---

### 🔵 v2.0 — Enterprise
**Long-term**

- Multi-office / multi-workspace support
- Team dashboards and leaderboards
- Role-based access control (RBAC)
- Full audit log
- Approval workflows
- Real-time collaboration
- Notification center (push, email, WhatsApp)
- Public API platform
- Plugin architecture
- White-label support
- SSO (SAML, Google Workspace)

---

## 6. Non-Negotiable Engineering Rules

These rules apply permanently and unconditionally. A sprint that violates them must be rejected.

### Performance Budgets
| Metric | Budget |
|---|---|
| Main application chunk (gzipped) | ≤ 100 KB |
| First Contentful Paint (FCP) | ≤ 1.5s |
| Time to Interactive (TTI) | ≤ 3.0s |
| Cumulative Layout Shift (CLS) | ≤ 0.05 |
| Lighthouse Performance Score | ≥ 90 |
| Lighthouse Accessibility Score | ≥ 95 |

### Code Quality Rules
- Every component must be under 300 lines.
- Every hook must have one responsibility.
- Zero duplicate business logic. If a selector exists, import it — don't rewrite it.
- Zero prop drilling beyond 2 levels. Use context or state.
- Every new module in `src/features/` must have a corresponding error boundary.
- All TypeScript compilation must succeed with zero errors before merging.

### Database Rules
- Zero schema changes without an ADR.
- All new tables must have RLS policies enabled from day one.
- All new indexes must be documented with their query justification.
- No direct SQL in frontend code. All queries go through Supabase client or named hooks.

### Architecture Rules
- Business logic lives in `src/engine/`. Never in components.
- Components are display-only. All data transformation happens in hooks or selectors.
- No new `useQuery()` calls in a component that renders inside an already-primed cache scope.
- `DATABASE_BASELINE_v0.5` is the authoritative schema reference.

---

## 7. Database Evolution Strategy

The database evolves through **planned migration waves**, not ad-hoc schema changes.

| Wave | Version | Focus |
|---|---|---|
| Wave 0 (Complete) | v0.5 | Core CRM, Pipeline, Marketing, Intelligence |
| Wave 1 (Planned) | v1.2 | Integration connectors (Meta, Google, WhatsApp webhooks) |
| Wave 2 (Planned) | v1.3 | Reporting materialized views and aggregation tables |
| Wave 3 (Planned) | v2.0 | Multi-workspace, RBAC, audit logs |

Each wave requires:
1. A published ADR
2. A reviewed and approved migration script
3. A validated rollback script
4. A post-migration health check

---

## 8. Release Checklist

Before any version is declared released, the following gates must pass:

### Engineering Gates
- [ ] All TypeScript errors resolved (`tsc -b` succeeds)
- [ ] Production build succeeds (`npm run build`)
- [ ] Bundle size within budget (main chunk ≤ 100KB gzipped)
- [ ] Zero broken routes
- [ ] All new views wrapped in `ComponentErrorBoundary`
- [ ] All new database tables have RLS enabled

### Quality Gates
- [ ] Lighthouse Performance ≥ 90
- [ ] Lighthouse Accessibility ≥ 95
- [ ] All major user flows tested end-to-end
- [ ] Mobile responsiveness verified on iOS Safari and Android Chrome

### Documentation Gates
- [ ] ADR written for all new architectural decisions
- [ ] Walkthrough document updated
- [ ] ROADMAP_v2.md reviewed for consistency

---

## 9. Guiding Philosophy

> "Build less, but build it right. Every feature you add is a feature you must maintain forever. Every feature you remove is a burden lifted. Complexity is the enemy of reliability. Reliability is the prerequisite for trust. Trust is the prerequisite for adoption."

RecruitOS succeeds not because it has the most features, but because a recruiter opens it every single morning and it tells them exactly what to do.

---

*This document supersedes `ROADMAP.md`. All future planning must reference this document.*
