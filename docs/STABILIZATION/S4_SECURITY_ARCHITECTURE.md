# S4 SECURITY ARCHITECTURE & ACCESS CONTROL FRAMEWORK

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S4 Stabilization Track  
**Focus**: Multi-Tier Security, Authentication Tokens, RBAC, Anti-IDOR & Organization Scoping  

---

## 1. Security Tier Model

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT / FRONTEND                        │
│  (Next.js UI, Role Switcher, Route Guards, Visual Controls) │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP Request (Headers/Cookies)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              MIDDLEWARE & AUTH RESOLUTION LAYER             │
│   • Cookie (`medora_session_id`, `medora_role`)             │
│   • Authorization Bearer Header (`x-medora-user-id`)        │
│   • Rejects unauthenticated requests -> 401 UNAUTHORIZED    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Authenticated Identity
                               ▼
┌─────────────────────────────────────────────────────────────┐
│            API ROUTE AUTHORIZATION & ANTI-IDOR              │
│   • Role RBAC Check (`validateRole`)                        │
│   • Record-Level Check (`validatePatientRecordAccess`)      │
│   • Multi-Tenant Organization Scope (`organization_id`)     │
│   • Rejects unauthorized actions -> 403 FORBIDDEN           │
└──────────────────────────────┬──────────────────────────────┘
                               │ Authorized Domain Request
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               DATA STORES & SUPABASE POSTGRESQL             │
│   • In-Memory Validated Stores (`lib/data/*-store.ts`)      │
│   • Row-Level Security (RLS) Policies on 52 Tables          │
│   • Immutable Audit Ledger Records                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication & Identity Flow

1. **Identity Resolution**:
   - Primary: `x-medora-user-id` or `Authorization: Bearer <ID>`.
   - Secondary: `medora_session_id` session cookie.
   - Tertiary: `medora_role` development switcher cookie.
   - Fallback: `null` (strictly rejected with `401 UNAUTHORIZED`).
2. **Credential Authentication (`authenticateCredentials`)**:
   - Checks user existence by email.
   - Validates account status (active vs suspended/disabled).
   - Validates cryptographic password hash.
   - Rejects invalid logins with safe, non-revealing error messages.
3. **Session Invalidation**:
   - Logout clears all session cookies and local storage tokens.

---

## 3. Multi-Tenant Organization Scoping

1. **Doctor Scoping**:
   - Doctors belong to one or more organizations via `doctorData.affiliations`.
   - Schedules and working sessions are isolated by `facility_id` and `organization_identifier`.
2. **Staff Scoping**:
   - Receptionists, nurses, billing officers belong to specific facilities (`facility_id`).
   - Actions outside their affiliated facility are rejected.
3. **Diagnostic Scoping**:
   - Laboratories (`LAB-1001`) only process samples routed to their laboratory facility.
   - Pharmacies (`PHA-1001`) only fulfill intakes addressed to their pharmacy facility.
