# MEDORA — S1 REPAIR PRIORITY
## Stabilization Track — S1 Document 12 of 15

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Date**: August 2026  
**Status**: VERIFIED AUDIT

---

## Repair Priority Matrix

### P0 — Fix Immediately (Blocks Everything)

| # | Bug ID | Description | Repair Track |
|---|---|---|---|
| 1 | BUG-C001 | In-memory data lost on restart — no persistence | S3 (Database) |
| 2 | BUG-C002 | Middleware enforces zero access control | S4 (Security) |
| 3 | BUG-C003 | API defaults to PAT-1001 for unauthenticated requests | S4 (Security) |

### P1 — Fix Before Any Production Use

| # | Bug ID | Description | Repair Track |
|---|---|---|---|
| 4 | BUG-H001 | 9 API routes have TypeScript errors | S2 (Backend) |
| 5 | BUG-H003 | No .env file — cannot connect to real services | S2 (Backend) |
| 6 | BUG-H004–H009 | Specific API route method name/arg mismatches | S2 (Backend) |
| 7 | BUG-M001 | 21 tables have RLS but no policies | S3 (Database) |
| 8 | BUG-H002 | `receptionist` missing from SQL enum | S3 (Database) |

### P2 — Fix During Stabilization

| # | Bug ID | Description | Repair Track |
|---|---|---|---|
| 9 | BUG-M004 | Lab sidebar hardcodes SMP-1001 | S5 (Navigation) |
| 10 | BUG-M005 | Duplicate RLS blocks in schema | S3 (Database) |
| 11 | BUG-L001 | Future phase sidebar items visible | S5 (Navigation) |
| 12 | BUG-L003 | Facility deactivation doesn't cascade | S3 (Database) |

### P3 — Fix When Resources Available

| # | Bug ID | Description | Repair Track |
|---|---|---|---|
| 13 | BUG-M002 | ABHA OTP sandbox mock | External integration |
| 14 | BUG-M003 | Payment synchronous settlement | External integration |
| 15 | BUG-L002 | Test script type errors | S2 (Backend) |
| 16 | BUG-L004 | patient_name in BookingRequest | S2 (Backend) |

---

## Repair Track Assignment Summary

| Track | Bug Count | Priority |
|---|---|---|
| S2 — Backend API | 8 | P1 |
| S3 — Database | 5 | P0–P2 |
| S4 — Security | 2 | P0 |
| S5 — Navigation | 2 | P2 |
| S6 — UI/UX | 0 | — |
| External Integration | 2 | P3 |

---

## Recommended Stabilization Execution Order

```
S2 (Backend API Fix)     ← Fix 9 broken API routes, resolve TypeScript errors
    │
    ▼
S3 (Database Stabilize)  ← Add missing SQL tables, fix enum gaps, RLS policies
    │
    ▼
S4 (Security Harden)     ← Enforce middleware auth, remove API default fallback
    │
    ▼
S5 (Navigation Fix)      ← Fix hardcoded URLs, hide future phases, wire routes
    │
    ▼
S6 (UI/UX Polish)        ← Consistent components, responsive layout, states
```
