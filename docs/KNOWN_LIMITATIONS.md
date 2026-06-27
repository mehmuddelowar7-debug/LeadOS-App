# LeadOS V1 Known Limitations

While LeadOS V1 is production-ready, there are several known limitations due to hard architecture choices, feature freezing, and platform constraints. Engineering teams should be aware of these constraints when planning for V2.

## 1. Storage Quotas (IndexedDB)
LeadOS heavily relies on IndexedDB for its offline-first capability (via `tanstack/react-query-persist-client` and a custom mutation queue).
- **Limitation:** iOS Safari aggressively clears IndexedDB storage if the device is running low on space or if the PWA is not actively used for extended periods. 
- **Impact:** If a user captures data offline and does not reconnect to the internet for days, the OS *may* purge the offline cache before sync occurs.
- **Mitigation:** Advise users to sync daily via the "End Day" ritual.

## 2. Hardcoded Mock Data in UI
- **Limitation:** To freeze V1 without massive API expansion, several analytical views (e.g., `InsightsView.tsx`, `ReferralDashboardView.tsx`, and the `DashboardView.tsx` mission stats) are currently rendering static mock data.
- **Impact:** The application feels functional, but the data on these specific screens will not update based on database changes.
- **Mitigation:** V2 must implement robust aggregated RPC calls in Supabase to hydrate these views.

## 3. Contact Merging
- **Limitation:** While duplicate detection is designed into the UI, there is currently no administrative mechanism to *merge* two existing Contacts if they are discovered to be the same person.
- **Impact:** Duplicate profiles may exist, fracturing activity timelines.
- **Mitigation:** Requires manual database intervention until a formal UI is built in V2.

## 4. Incentive Payout Pipeline
- **Limitation:** The feature flag `ENABLE_INCENTIVE_PAYOUTS` is hard-locked to `false`. While the database schema supports tracking Referrals and Reward amounts, there is no integrated payment gateway (e.g., Razorpay/Stripe).
- **Impact:** All rewards must be paid manually outside the system, and their status manually toggled to "Paid" by an administrator.

## 5. Media & File Uploads
- **Limitation:** Currently, `ContactProfileView` documents (Aadhaar, PAN) are listed visually but do not possess file upload handlers.
- **Impact:** Field executives cannot physically upload document photos to Supabase Storage in V1.
- **Mitigation:** Planned for V2 once Supabase Storage buckets and RLS policies are fully configured.
