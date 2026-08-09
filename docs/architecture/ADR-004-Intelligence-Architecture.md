# ADR-004: Intelligence Engine & Shared Architecture

## Status
Accepted

## Context
As RecruitOS evolves from a passive CRM into an active "Operating System", the presentation layer is becoming overloaded. React components (e.g., `ContactProfileView`, `DashboardView`) are currently responsible for fetching data, processing business logic, deciding priorities, and rendering the UI. This violates the Single Responsibility Principle and creates monolith components exceeding 600 lines. Furthermore, UI components that belong to the core RecruitOS experience (like `JourneyTimeline` or `StatusBadge`) are currently siloed within specific features like `/marketing`.

## Decision
We are introducing two major architectural pillars:

### 1. The Engine (`/src/engine`)
All business logic, intelligence, automation, and decision-making will be entirely decoupled from React. 
- **Intelligence**: Evaluates pure data to output actionable insights (e.g., `isCandidateCold`, `getPriorityLevel`).
- **Automation**: Pure functions defining system actions (e.g., `triggerFollowUp`).
- **Recommendations**: Deterministic rules engines (e.g., marketing ROI alerts).
- **Pipeline**: Logic for determining stage progression.

*Rule: The `/engine` cannot import from `/components` or `/features`. It is a pure logic layer.*

### 2. Shared UI (`/src/features/shared`)
Any component used across multiple domains (Pipeline, Marketing, Analytics, Contacts) must be elevated to `/features/shared/components`. This ensures a single source of truth for the design system.

## Consequences
- **Positive**: Components become "dumb" renderers. The core intelligence of RecruitOS can be unit-tested without mounting React. Bundle size is optimized via aggressive reuse of `/shared` components.
- **Negative**: Increased abstraction layer requires discipline; developers must resist the urge to drop business logic directly into `onClick` handlers.
