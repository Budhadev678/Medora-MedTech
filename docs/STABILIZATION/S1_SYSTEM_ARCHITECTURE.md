# MEDORA — S1 SYSTEM ARCHITECTURE
## Stabilization Track — S1 Document 1 of 15

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Date**: August 2026  
**Status**: VERIFIED AUDIT

---

## 1. Actual Technology Stack

| Component | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 14.2.24 |
| UI Library | React | 18.3.1 |
| Language | TypeScript | 5.7.3 |
| Styling | Tailwind CSS | 3.4.17 |
| Icons | Lucide React | 0.475.0 |
| CSS Utils | clsx, tailwind-merge, class-variance-authority | Various |
| Data Validation | Zod | 3.24.2 |
| Auth SDK | @supabase/ssr | 0.5.2 |
| DB Client | @supabase/supabase-js | 2.49.1 |
| Testing | Custom scripts via `npx tsx` | N/A |

---

## 2. Actual Runtime Architecture

```
[USER BROWSER]
      │
      ▼
[NEXT.JS 14 APP ROUTER] ← 142 page.tsx files, 1 layout.tsx
      │
      ├──► [19 HTTP API ROUTE HANDLERS] (app/api/*/route.ts)
      │         │
      │         ▼
      │    [API UTILS] (lib/api/api-utils.ts — getAuthenticatedUser via cookies/headers)
      │         │
      │         ▼
      │    [34 DOMAIN SERVICES] (lib/services/*.ts)
      │         │
      │         ▼
      │    [39 IN-MEMORY DATA STORES] (lib/data/*.ts)
      │
      ├──► [AUTH PROVIDER] (lib/auth/auth-context.tsx — 511 lines)
      │         │
      │         ├──► [IDENTITY STORE] (lib/data/identity-store.ts — 65KB, 1912 lines)
      │         ├──► [ROLE GUARD] (components/shared/role-guard.tsx)
      │         └──► [SUPABASE CLIENT] (lib/supabase/client.ts — PLACEHOLDER FALLBACK)
      │
      └──► [SESSION PERSISTENCE] (localStorage → medora_session_id)
                                  (cookie → medora_role)
```

---

## 3. Critical Architecture Findings

### 3.1 Authentication: DUAL-MODE (Supabase + In-Memory)
- `lib/supabase/client.ts` uses placeholder URL/key when env vars are missing
- `lib/auth/auth-context.tsx` authenticates against `identity-store.ts` first, Supabase second
- Session stored in `localStorage` (medora_session_id) and cookie (medora_role)
- **FINDING**: No real Supabase connection is active. Auth is 100% in-memory identity store.

### 3.2 Database: SCHEMA EXISTS, NOT CONNECTED
- `supabase/schema.sql`: 748 lines, 38 tables with full foreign keys and RLS policies
- `types/database.types.ts`: 110KB type definitions
- **FINDING**: Zero code paths connect to PostgreSQL. All data lives in `lib/data/*.ts` in-memory stores.

### 3.3 API Layer: PARTIALLY BUILT (S2 Work)
- 19 route handlers exist under `app/api/`
- 13 of 19 have TypeScript compilation errors (discovered in S2)
- **FINDING**: API routes were created in S2 stabilization but have unresolved type errors.

### 3.4 Middleware: PERMISSIVE (No Enforcement)
- `middleware.ts`: 31 lines — reads `medora_role` cookie but does NOT block any route
- Always returns `NextResponse.next()`
- **FINDING**: Middleware exists structurally but enforces zero access control.

### 3.5 Component Architecture
- 36 reusable components across 4 categories:
  - `components/patient/` (6 cards): appointment-card, bill-card, live-queue-card, prescription-card, record-card, report-card
  - `components/professional/` (3): filter-bar, metric-card, workspace-header
  - `components/shared/` (15): app-shell, breadcrumbs, demo-switcher, error-state, loading-state, navbar, notification-panel, organization-switcher, page-header, patient-shell, professional-shell, role-bottom-nav, role-guard, role-sidebar, splash-screen, user-menu
  - `components/ui/` (12): badge, button, card, empty-state, input, label, skeleton, status-badge, table, textarea, timeline

---

## 4. File Count Summary

| Category | Count |
|---|---|
| Page routes (page.tsx) | 142 |
| Layout files | 1 (root only) |
| API route handlers | 19 |
| Domain services | 34 |
| Data stores | 39 |
| Reusable components | 36 |
| Test scripts | 50 |
| Documentation files | 67 + 17 stabilization |
| SQL schema | 1 (38 tables) |
| Type definitions | 1 (110KB) |

---

## 5. Missing Architecture Elements

| Element | Status |
|---|---|
| Database connection | NOT_CONNECTED (placeholder Supabase) |
| Server-side auth middleware | PERMISSIVE (no enforcement) |
| Per-role route layouts | MISSING (single root layout.tsx) |
| Error boundaries per section | PARTIAL (1 global error.tsx) |
| i18n / localization runtime | EXISTS (lib/localization.ts — 29KB) but NOT WIRED |
| WebSocket / real-time | NOT_IMPLEMENTED |
| File upload / storage | NOT_IMPLEMENTED |
| Email / SMS notifications | NOT_IMPLEMENTED |
| CI/CD pipeline | NOT_CONFIGURED |
| Environment configuration | .env.example exists (582 bytes), no .env |
