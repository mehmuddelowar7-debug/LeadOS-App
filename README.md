# LeadOS V1

LeadOS is a modern, offline-first Customer Relationship Management (CRM) built for high-performance field executives. Engineered for speed, reliability, and resilience, LeadOS allows sales teams to capture leads, track walk-ins, log communications, and generate performance insights—all without needing a continuous internet connection.

## ✨ Features

- **Offline-First Architecture**: Built on IndexedDB and React Query. All data is cached locally. You can create contacts and log activities even in airplane mode. The dead-letter queue automatically synchronizes data the moment connection is restored.
- **PWA Ready**: Fully installable as an app on iOS, Android, and Desktop (Chrome/Edge/Safari). Includes background sync and seamless updates.
- **Lightning Fast UI**: Uses optimistic updates so the UI never blocks while saving.
- **Comprehensive CRM**: Manage Walk-ins, Calls, Referrals, and Tasks seamlessly.
- **Analytics Engine**: Real-time insights and End of Day reporting.
- **Dark/Light Mode**: First-class responsive theming for daytime field work or evening review.

## 🛠 Tech Stack

- **Frontend Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) + [TanStack Query v5](https://tanstack.com/query/latest)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + Glassmorphism UI
- **Backend & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + RLS)
- **Deployment**: [Vercel](https://vercel.com/) (SPA Rewrites configured)

## 📸 Screenshots

*(Add screenshots here after deployment)*
- Dashboard View
- Offline Mode Indicator
- Mobile Contact Profile

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+)
- npm or pnpm
- A free [Supabase](https://supabase.com) account

### 2. Environment Variables
Clone the repository and copy the environment template:
```bash
cp .env.example .env.local
```
Fill in the `.env.local` file with your Supabase credentials:
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_ENV=development
```

### 3. Local Development
Install dependencies and run the development server:
```bash
npm install
npm run dev
```

### 4. Database Setup
Execute the SQL scripts found in `/supabase/` against your Supabase SQL Editor in the following order:
1. `schema.sql` - Core tables, triggers, and RPC functions.
2. `pipeline_stages.sql` - System configurations.
3. `seed.sql` - (Optional) Mock data for testing.

## 🌍 Deployment

LeadOS is configured for immediate deployment to Vercel.

1. Connect your GitHub repository to Vercel.
2. In the Vercel Dashboard, add the required Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
3. Vercel will automatically detect Vite and run `npm run build`.
4. The included `vercel.json` ensures that React Router SPA fallbacks work correctly.

## 🔐 Security
- **Row Level Security (RLS)** is strictly enforced at the database level. Every user can only access data assigned to their `workspace_id`.
- The repository has been audited for secrets. Never commit your `.env` files.

## 📄 License
MIT License. See `LICENSE` for more information.

## 🏷 Version
**v1.0.0** — Initial Production Release
