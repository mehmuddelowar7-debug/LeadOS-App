# ADR-002: Pipeline Foundation

## Status
Accepted

## Context
Candidates go through a series of stages before successfully joining the platform. Previously, these stages were loosely defined or duplicated across the frontend and backend. We needed a singular, reliable way to represent a candidate's state machine within RecruitOS.

## Decision
We implemented an `opportunities` table that runs parallel (1:1) to the `contacts` table. The Pipeline uses a strict, visually cohesive React configuration (`pipelineConfig.ts`) which defines precise statuses (e.g. `new`, `interested`, `interview`, `recharge_pending`, `joined`). 
The Pipeline view is purely a Kanban-style visualization of this underlying data.

## Consequences
- **Positive**: Complete separation of concerns. `contacts` holds demographic data; `opportunities` holds state. The Pipeline UI serves merely as a strict visual reflection of these states, eliminating duplicate logic.
- **Negative**: Requires careful relational querying when rendering Kanban lanes, as a candidate's pipeline status lives outside their core row.
