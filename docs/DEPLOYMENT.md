# LeadOS V1 Deployment Guide

LeadOS utilizes a dual-environment deployment strategy (Staging and Production) using Vercel for the Frontend and Supabase for the Backend.

## 1. Prerequisites
- Vercel Account
- Supabase Account
- GitHub Repository Access

## 2. Supabase Setup (Backend)

### Create Projects
1. Create two new projects in Supabase: `leados-staging` and `leados-production`.
2. For each project, navigate to **SQL Editor**.
3. Copy the contents of `/supabase/schema.sql` and run it to provision the database schema, indexes, RPCs, and RLS policies.
4. Navigate to **Project Settings -> API** and copy the `Project URL` and `anon public key`.

### Configure Authentication
1. Navigate to **Authentication -> Providers**.
2. Enable Email/Password authentication.
3. Turn off "Confirm email" for V1 to ensure immediate onboarding (or configure SMTP).

## 3. Vercel Setup (Frontend)

1. Import the GitHub repository into Vercel.
2. Override the Build Command to: `npm run build`
3. Set the Output Directory to: `dist`
4. Configure the following Environment Variables for **Production**:
   - `VITE_SUPABASE_URL`: (Your Production Supabase URL)
   - `VITE_SUPABASE_ANON_KEY`: (Your Production Supabase Anon Key)
   - `VITE_SENTRY_DSN`: (Your Production Sentry DSN)
5. Configure the following Environment Variables for **Preview / Development** (Staging):
   - `VITE_SUPABASE_URL`: (Your Staging Supabase URL)
   - `VITE_SUPABASE_ANON_KEY`: (Your Staging Supabase Anon Key)
   - `VITE_SENTRY_DSN`: (Leave blank to disable crash reporting on preview deploys)

## 4. Continuous Integration / Continuous Deployment (CI/CD)
- **Preview Deployments:** Whenever a Pull Request is opened against `main`, Vercel will automatically generate a unique Preview URL connected to the Staging Supabase environment.
- **Production Deployments:** When a PR is merged into `main`, Vercel will automatically deploy to Production (`app.leados.app`).

## 5. PWA Configuration
For iOS users to install the app:
1. Ensure SSL is enforced.
2. Users must open the URL in Safari, tap the Share icon, and select "Add to Home Screen".
3. Vercel automatically handles the `manifest.json` and service worker caching via `vite-plugin-pwa`.
