# 📝 MEDORA Project Changelog

All notable changes to the MEDORA platform are documented in this file.

---

## [Phase 2] - 2026-08-20 — App Shell + Role Workspaces + Responsive Experience

### Added
- **Patient Mobile-First Shell**:
  - `components/shared/role-bottom-nav.tsx`: 5-tab mobile bottom navigation (`Home`, `Health`, `Care`, `Emergency`, `Profile`) with active badges and emergency quick trigger.
  - `app/patient/page.tsx`: Mobile consumer healthcare homepage with digital Medora ID card (`MED-PAT-1001`), touch-optimized quick action cards (`Find Doctor`, `Hospitals`, `Reports`, `Medicines`), upcoming visit card, recent activity list, and audit notice.
  - `app/patient/health/page.tsx`: Structural health hub with scrollable navigation pills (`Journey Timeline`, `Prescriptions`, `Lab Reports`, `All Records`) and empty state placeholders.
  - `app/patient/care/page.tsx`: Care discovery hub with specialty search, doctor directory cards, hospital listings, and visit token schedules.
  - `app/patient/emergency/page.tsx`: Prominent emergency hub with one-tap national helpline triggers (112, 108), emergency medical vitals snapshot, and nearest trauma center link.
  - `app/patient/profile/page.tsx`: Personal profile destination with account status indicator, ABHA placeholder card, timed record sharing link, and sign-out control.
- **Operational Tablet/Desktop Workspaces**:
  - `app/doctor/page.tsx`: Clinical workspace with live duty status selector, operational overview metrics, tabbed queue, slot schedule, and pending diagnostic reviews.
  - `app/hospital/page.tsx`: Command center with department roster, occupancy tracking, and audit links.
  - `app/lab/page.tsx`: Diagnostic laboratory queue, testing states, and pathologist approvals.
  - `app/pharmacy/page.tsx`: Prescription dispensing queue with counter pickup patient verification desk.
  - `app/admin/page.tsx`: Master system audit stream and security posture matrix.
  - `app/emergency/page.tsx`, `app/blood-bank/page.tsx`, `app/finance/page.tsx`: Role workspaces with RoleGuard protection, empty states, and phase notices.
- **Responsive Container Strategy**:
  - `components/shared/app-shell.tsx`: Automatically switches between centered consumer mobile container for Patients (`max-w-xl md:max-w-2xl`) and high-density full workspace for Doctors/Hospitals/Admins.

---

## [Phase 1] - 2026-08-20 — Authentication & Role Foundation

### Added
- Master PostgreSQL relational schema (`supabase/schema.sql`) with 15 tables and RLS security policies.
- Centralized auth provider (`lib/auth/auth-context.tsx`) with Supabase client integration and multi-role session persistence.
- Unified login portal (`app/(auth)/login/page.tsx`) with password show/hide toggle and SIH Demo Role Launcher.
- 3-Step Patient Onboarding (`app/(auth)/register/page.tsx`) with ABHA ID generation.
- Role protection guard (`components/shared/role-guard.tsx`) and 403 Forbidden access denial page (`app/access-denied/page.tsx`).

---

## [Phase 0] - 2026-08-20 — Project Scaffolding & Design System

### Added
- Next.js 14 App Router setup with Tailwind CSS and custom tokens.
- Standardized UI component primitives in `components/ui/`.
- Shared App Shell, Navbar, and SIH Demo Persona Switcher in `components/shared/`.
