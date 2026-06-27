# LeadOS V1 Launch Checklist

This checklist is the final gate before deploying LeadOS to real field executives. It focuses on physical device testing, edge cases, and production readiness.

## 1. Environment & Deployment 🚀
- [ ] Staging and Production projects are created in Supabase.
- [ ] `schema.sql` is run in Production Supabase, establishing RLS policies.
- [ ] Vercel Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SENTRY_DSN`) are correctly mapped for both Production and Preview environments.
- [ ] Production build succeeds without errors (`npm run build`).

## 2. Real-World Field Testing (Physical Devices) 📱
- [ ] **Mobile (iOS Safari):** Add to Home Screen (PWA). Verify icon, launch screen, and standalone mode behavior (no browser UI).
- [ ] **Mobile (Android Chrome):** Add to Home Screen (PWA). Verify install prompt and full-screen launch.
- [ ] **Tablet (iPad):** Verify the `NavRail` and side-pane Master-Detail routing works correctly in both Portrait and Landscape.
- [ ] **Desktop:** Verify the multi-column Grid on the Dashboard, full Sidebar, and `Cmd+Enter` form submission.

## 3. The "Subway Test" (Offline Sync) 🚇
- [ ] Turn on Airplane Mode.
- [ ] Create a new Contact (Walk-in). Verify the "Saved Offline" toast appears and the UI updates immediately.
- [ ] Log a Call activity on the new contact.
- [ ] Turn off Airplane Mode.
- [ ] Verify the "Synced offline changes to cloud" toast appears.
- [ ] Refresh the page and verify the data actually persisted to Supabase.

## 4. UX & Resilience 🛡️
- [ ] **Error Boundary:** Manually throw an error in a component and verify the customized "Something went wrong" Sentry fallback screen appears instead of a blank white page.
- [ ] **Form Validation:** Submit the Quick Capture form empty. Verify the toast error preventing submission without a Name and Phone.
- [ ] **Empty States:** Log in as a brand new user with no data. Verify the Dashboard, Contacts, and Queue show the polished empty states instead of broken UI.

## 5. Security & Isolation 🔒
- [ ] Create two different users in two different Workspaces.
- [ ] Verify User A cannot see User B's Contacts, Opportunities, or Dashboard stats in the UI.
- [ ] Attempt to query User B's contacts directly via the browser console using the Supabase client. Verify RLS blocks the request and returns an empty array.

> [!WARNING]
> **GO/NO-GO DECISION**
> Do not launch if any of the Offline Sync or Security tests fail. LeadOS's reputation relies on absolute data integrity for the field executives.
