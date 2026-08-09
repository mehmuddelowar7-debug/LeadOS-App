# Changelog

All notable changes to RecruitOS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to Semantic Versioning where applicable.

## [v0.5.0] - 2026-08-08

### Added
- **Marketing Data Architecture (Sprint 5A)**: Introduced a robust Omni-Channel marketing data model supporting both paid ads and organic lead sources (Agents, Field, Walk-ins, Meta Ads).
  - Added `marketing_sources`, `marketing_campaigns`, `marketing_ad_sets`, `marketing_creatives` for hierarchical source tracking.
  - Added `marketing_attributions` to link candidates to exact sources/campaigns/creatives, including a flexible `source_reference` field.
  - Added `marketing_events` to power the future analytics engine (Impression → Joined).
  - Added `marketing_daily_metrics` for API ingestion of daily ad spend and impressions without recalculating history.

---

## [v0.4.0] - 2026-08-08

### Added
- **Dashboard 2.0 (The Daily Command Center)**: A complete rewrite of the dashboard focusing on immediate operational actions rather than historical analytics.
- **Today's Mission**: A dynamic, sentence-based progress section that focuses the recruiter on immediate goals (Calls, Interviews, Recharges, Joins).
- **Work Queue Cards**: High-contrast, clickable cards providing instant visibility into Overdue, Follow-ups Today, Interviews Today, Pending Recharges, and Stuck candidates.
- **Smart Alerts (At Risk Today)**: Intelligent frontend evaluation that automatically highlights candidates who are stuck in the pipeline (e.g., in Interview for >3 days with no follow-up scheduled) and explicitly states *why* they are at risk.
- **Apple-Style Timeline**: A chronological timeline merging today's interviews and follow-ups.
- **Global Recent Activity Feed**: A lightweight frontend implementation fetching the latest activity across all candidates.
- **Pipeline Health Ribbon**: Minimalist horizontal progression visualizing exactly how many candidates exist at each stage.
- **ASCII Progress Bars**: Ultra-lightweight daily target visualization without heavy charting libraries.

### Improved
- **Sub-1-Second Rendering**: The dashboard now aggressively reuses cached data from React Query (`useContacts`, `useFollowUps`, `useInterviews`), eliminating duplicate API requests and loading in 0ms when navigating back from other views.
- **Dashboard Hierarchy**: Reordered sections to match a recruiter's natural morning workflow (Good Morning → Mission → Queue → At Risk → Timeline).

### Removed
- **Legacy Widgets**: Removed generic analytical pie charts and donut charts from the operational dashboard.

---

## [v0.3.0] - RC1 Polish (2026-08-08)

### Added
- **Linear-Style Dark Mode**: The application is now permanently locked into Dark Mode to ensure a premium visual experience. Injected `class="dark"` into `index.html` to eliminate white flashes on load.
- **Pipeline Skeleton**: Added a premium pulsing skeleton loader to the Pipeline view.

### Improved
- **Rebrand**: Completely purged legacy terminology. "Network" is now "Candidates". "Create Contact" is now "Add Candidate".
- **Spring Physics**: Replaced rigid duration-based animations with smooth `framer-motion` spring physics across all modals and cards.
- **Accessibility**: Added `role="button"`, `tabIndex`, and `onKeyDown` handlers to interactive elements like `ContactCard`.
- **Design System**: Purged hardcoded HEX colors (e.g., `#25D366`) and replaced them with Tailwind variables (`emerald-500`).

### Removed
- All theme toggle buttons from Sidebar, NavRail, AppShell, and Profile pages.
