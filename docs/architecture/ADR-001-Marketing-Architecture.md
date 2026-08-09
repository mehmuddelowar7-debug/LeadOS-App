# ADR-001: Marketing Architecture (Omni-Channel)

## Status
Accepted

## Context
RecruitOS must transition from tracking only candidates to acting as a comprehensive Lead Acquisition Operating System. Initially, the database structure was designed for standard CRM functionality. However, tracking ROI across various acquisition channels (Meta Ads, Field Marketing, Agent Referrals, Organic Instagram) requires a dedicated schema.

## Decision
We implemented a cascading Omni-Channel Marketing Schema containing the following core entities:
- **Sources (Root)**: The base acquisition channel (e.g. Field Marketing, Agent).
- **Campaigns (Optional)**: Initiatives tied to a Source.
- **Ad Sets & Creatives (Optional)**: Used strictly for digital targeting and asset tracking.
- **Attributions (1:1 with Contacts)**: Associates a candidate with their origin. Includes a flexible `source_reference` (e.g. "Reel #42").
- **Touchpoints (1:N with Contacts)**: An analytics engine that records the complete historical journey of a candidate from `reel_viewed` to `joined`, along with the `source_system` (e.g., `manual`, `meta_api`).

## Consequences
- **Positive**: The core `contacts` table remains pristine. We can track multi-touch journeys. The schema accommodates both robust API-driven ad data and loose field/organic tracking simultaneously.
- **Negative**: Increased query complexity for analytics, requiring specific table joins through `marketing_attributions` to calculate CPL and CPJ (Cost Per Joined).
