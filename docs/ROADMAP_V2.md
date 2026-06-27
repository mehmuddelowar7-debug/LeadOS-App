# LeadOS V2 Roadmap

LeadOS V1 established a stable, offline-capable architecture. V2 will pivot from operational stability toward intelligence, automation, and real-time geospatial awareness.

## Phase 1: Real Data Hydration (Q3)
- **Aggregated Analytics:** Replace all mock data in the Dashboard, Referral Network, and Insights screens with live Supabase Edge Functions.
- **Full Sync Engine:** Enhance the offline sync engine to support complex document uploads (images to Supabase Storage buckets offline) with background sync APIs.

## Phase 2: Automation & AI (Q3/Q4)
- **AI Assistant Integration (`ENABLE_AI_ASSISTANT`):** Introduce an LLM-powered assistant capable of summarizing call notes, extracting action items, and suggesting the next best follow-up date.
- **Voice Capture (`ENABLE_VOICE_CAPTURE`):** Field executives can record audio notes after a meeting, which will be transcribed via Whisper API and automatically attached to the Contact's timeline.

## Phase 3: Geospatial & Field Intelligence (Q4)
- **Maps Integration (`ENABLE_MAPS_INTEGRATION`):** Introduce a Map View for the Contacts list, allowing executives to visually cluster high-priority leads and plan travel routes efficiently.
- **Check-in/Check-out:** Allow executives to physically "check-in" at a geographic location, tying their activity logs to GPS coordinates for administrative auditing.

## Phase 4: Financial Integrations (Q4)
- **Incentive Payouts (`ENABLE_INCENTIVE_PAYOUTS`):** Integrate an API-driven payout system (e.g., RazorpayX) to automatically disburse referral rewards once a candidate hits their milestone.
- **Wallet Ledger:** Introduce a detailed financial ledger for Referral Partners so they can track their exact earnings inside the application.

## Architectural Maintenance
- **Postgres Optimization:** As the database scales, introduce partitioning on the `contact_activities` table.
- **Duplicate Merging:** Build a UI tool for administrators to merge identical Contacts safely.
