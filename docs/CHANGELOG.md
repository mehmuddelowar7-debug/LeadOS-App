# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-25

### Added
- **Multi-Device Responsive Architecture**: Fully adaptive UI for Mobile, Tablet, and Desktop.
- **Master-Detail Pattern**: Side-pane detailed view for Contacts and Queue on larger screens.
- **Offline Sync Engine**: Automatic IndexedDB mutation queuing and background sync retry logic.
- **Contact Relationships**: Robust Contact/Opportunity architecture supporting multiple roles (Candidate, Partner).
- **Referral Engine**: Tracking for referrals, incentives, and rewards payouts.
- **Global Keyboard Shortcuts**: Shortcuts for quick navigation and form submission (`Cmd+Enter`, `N`, `F`).
- **Dashboard & Insights**: Analytics rings, daily mission lists, and network health overviews.
- **End Day Workflow**: RPC-driven end day rollover for migrating incomplete follow-ups to the next day.
- **Sentry Integration**: Global error boundary catching and error monitoring.
- **React Lazy Loading**: Non-critical routes (Analytics, Profile) are now lazy-loaded to reduce bundle size.
