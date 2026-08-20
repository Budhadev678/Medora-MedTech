# 📝 MEDORA — Engineering Changelog

## [Phase 2 — Prompt 1] - 2026-08-20
### Added
- **Global Application Shell Architecture (`AppShell`)**:
  - Dynamically switches between mobile-first `PatientShell` and high-density `ProfessionalShell` based on database-backed identity and active route.
- **Mobile-First Patient Shell (`PatientShell`)**:
  - Top header with instant SOS Emergency button, notification badge, and profile avatar.
  - Primary bottom navigation with 4 key destinations: `Home`, `Appointments`, `Records`, and `Emergency`.
  - Comprehensive slide-up "More" drawer with quick access to Prescriptions, Lab Reports, Pharmacy, Bills, Health Vitals, and Care Plans.
- **High-Density Operational Professional Shell (`ProfessionalShell`)**:
  - Top bar featuring active `OrganizationSwitcher` for doctors with multi-hospital affiliations, `NotificationPanel`, language indicator, and `UserMenu`.
  - Collapsible desktop sidebar (expanded labels or collapsed icons with tooltips) and responsive mobile/tablet drawer.
- **Centralized Navigation Architecture (`lib/navigation.ts`)**:
  - Standardized navigation metadata (`label`, `href`, `icon`, `badge`, `comingSoon`, `phase`) for all 8 persona roles.
- **Standardized Reusable Shell Components**:
  - `components/shared/breadcrumbs.tsx`: Dynamic breadcrumb trails for nested routes.
  - `components/shared/page-header.tsx`: Standardized page title, badge, breadcrumbs, action buttons, and filters.
  - `components/ui/empty-state.tsx`: Standard empty state component with phase indicators and action links.
  - `components/shared/loading-state.tsx`: Safe identity resolution skeleton.
  - `components/shared/error-state.tsx`: Account loading error handler with Retry and Sign Out actions.
  - `components/shared/organization-switcher.tsx`: Dropdown for switching practice context without changing doctor identity.
  - `components/shared/notification-panel.tsx`: Dropdown with real platform and security notifications.
  - `components/shared/user-menu.tsx`: User identity dropdown with profile, settings, and session termination.
  - `components/shared/role-guard.tsx`: Enhanced route protection preventing unauthorized access and safe fallback.
- **Complete Route Hierarchy (All 79 Routes Compiled Successfully)**:
  - 11 Patient routes (`/patient/...`)
  - 10 Doctor routes (`/doctor/...`)
  - 13 Hospital routes (`/hospital/...`)
  - 8 Diagnostic Laboratory routes (`/lab/...`)
  - 9 Pharmacy routes (`/pharmacy/...`)
  - 7 Insurance & Claims routes (`/insurance/...`)
  - 4 Staff routes (`/staff/...`)
  - 7 Admin Governance routes (`/admin/...`)
  - Public verification slips (`/verify/rx/[id]`, `/verify/lab/[id]`) and system error barriers (`/access-denied`).

---

## [Phase 1 - Final Baseline] - 2026-08-20
### Added
- Complete ecosystem identity foundation across 14 personas.
- Doctor multi-hospital affiliation engine (`doctor_affiliations`).
- Multi-branch physical facilities (`facilities`).
- Staff facility appointments (`staff_memberships`).
- Master Relational Architecture & Connectivity Specification (`types/database.types.ts` & `supabase/schema.sql`).
- Public verification slips for digitally signed Prescriptions and certified Lab Reports.
