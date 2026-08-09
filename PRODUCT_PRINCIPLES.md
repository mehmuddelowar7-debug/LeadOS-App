# RecruitOS Product Principles

These principles were forged in the trenches of building v1.0. They are the immutable laws governing the evolution of RecruitOS. When facing an architectural or product decision, refer to this document.

## 1. Core Independence
**The CRM must always work offline from AI.** No core recruitment workflow (creation, searching, pipeline movement) should ever be blocked because an Edge Function or LLM provider is unavailable.

## 2. Unglamorous > Clever
**Product quality comes from solving the boring problems well.** Prioritize RLS policies, duplicate prevention, migration synchronization, and solid state management over building the next flashy intelligence feature. 

## 3. Strict Schema Governance
**No schema changes without a formal migration.** The local repository migrations and the remote live database must remain perfectly synchronized. Code complete is not production validated until it survives the live schema.

## 4. Immutable History
**Every mutation must generate timeline activity.** A CRM is only as good as its audit trail. If it happened, it must be logged on the candidate's journey.

## 5. Absolute Data Integrity
**No duplicate phones per workspace.** Enforce data cleanliness at the database constraint level. Never trust the frontend to prevent bad data.

## 6. Real Data Always
**No mock data in production builds.** Always validate against the live Supabase backend. Test with 5 records and test with 500 records.

## 7. Performance Over Animation
A snappy, instantaneous UI that loads massive datasets efficiently will always win over a slow, beautifully animated interface. 

## 8. Mobile-First Ergonomics
Recruiters work on the go. Touch targets must be generous, and the interface must be fully functional on a small screen without horizontal scrolling or clipping.

## 9. Respect the Tracks
**Track A (CRM) and Track B (AI) evolve independently.** Do not mix experimental AI features into the critical path of the CRM. AI enhances; it never replaces.

## 10. Dogfood Before Deploy
Before any major feature goes to real users, it must be used by the team internally for at least a day to uncover the UX friction that automated tests cannot catch.

## 11. Production Evidence
**Nothing is complete until it passes against the live environment.** A successful build, unit test, or mock response is not evidence of production readiness. Every critical workflow must be validated against the live backend.

## 12. Fail Gracefully
**Infrastructure failures must never become user failures.** If AI, Realtime, Analytics, or Webhooks are unavailable, RecruitOS must continue functioning as a CRM with clear, non-technical messaging.

## 13. One Source of Truth
**Every business rule exists in exactly one place.** Avoid duplicating workflow logic between the frontend, backend, AI prompts, and SQL. Business rules should be centralized and reused.

## 14. Continuous Clarity
**A recruiter should never wonder "What do I do next?"** Every screen must proactively answer this question. Reduce thinking, not just clicking.

## 15. One Click Forward
**Every primary workflow should end by naturally suggesting the next logical action.** Never leave the recruiter at a dead end. When a call finishes, prompt for a follow-up. When an interview completes, prompt for the next stage. Every action leads to the next.
