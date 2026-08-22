# MEDORA — S1 BUG REGISTRY
## Stabilization Track — S1 Document 10 of 15

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Date**: August 2026  
**Status**: VERIFIED AUDIT — ALL BUGS CLASSIFIED

---

## Critical Bugs (Data Loss / Security)

| ID | Phase | Description | File(s) | Impact |
|---|---|---|---|---|
| BUG-C001 | 0–10 | All data stored in JavaScript memory — lost on server restart | lib/data/*.ts | ALL user-created data (appointments, prescriptions, bills) is ephemeral |
| BUG-C002 | 1 | Middleware does not enforce any access control — always returns NextResponse.next() | middleware.ts | Any unauthenticated user can access any route via direct URL |
| BUG-C003 | 1 | API route handlers default to PAT-1001 when no auth header/cookie present | lib/api/api-utils.ts:55 | Unauthenticated API calls execute as patient Rahul Verma |

---

## High Bugs (Broken Functionality)

| ID | Phase | Description | File(s) | Impact |
|---|---|---|---|---|
| BUG-H001 | S2 | 9 API route handlers have TypeScript compilation errors | app/api/billing/*, pharmacy/*, lab/samples | Routes will fail at build time in production |
| BUG-H002 | 1 | `receptionist` role missing from SQL user_role enum | supabase/schema.sql | Receptionist cannot be created in SQL database |
| BUG-H003 | 0 | No .env file present — only .env.example | project root | Application cannot connect to any real backend service |
| BUG-H004 | 10 | API route billing/reconciliation calls execute3WayReconciliation which doesn't exist | app/api/billing/reconciliation/route.ts:32 | Reconciliation API always throws |
| BUG-H005 | 9 | API route pharmacy/inventory calls evaluateSingleFacilityAvailability which doesn't exist | app/api/pharmacy/inventory/route.ts:33 | Inventory check API always throws |
| BUG-H006 | 9 | API route pharmacy/dispense has wrong argument count and wrong return property | app/api/pharmacy/dispense/route.ts | Dispense API always throws |
| BUG-H007 | 10 | API route billing/refunds passes 2 args to requestRefund which expects 1 | app/api/billing/refunds/route.ts:27 | Refund API always throws |
| BUG-H008 | 10 | API route billing/bills uses wrong export name getBillsForPatient (should be getBillsByPatient) | app/api/billing/bills/route.ts:4 | Bills API throws on import |
| BUG-H009 | 10 | API route billing/disputes uses wrong export name getDisputesForPatient (should be getDisputesByPatient) | app/api/billing/disputes/route.ts:4 | Disputes API throws on import |

---

## Medium Bugs (Degraded Experience)

| ID | Phase | Description | File(s) | Impact |
|---|---|---|---|---|
| BUG-M001 | 5 | 21 SQL tables have RLS enabled but NO policy rules defined | supabase/schema.sql | Would deny all access in real Supabase deployment |
| BUG-M002 | 3 | ABHA OTP verification uses sandbox mock | abha-service.ts | Cannot verify real ABHA IDs |
| BUG-M003 | 10 | Payment processing is synchronous — no webhook receiver | payment-processing-service.ts | No real payment gateway integration |
| BUG-M004 | 8 | Lab navigation sidebar links to hardcoded /lab/samples/SMP-1001 | lib/navigation.ts:133 | Broken navigation if SMP-1001 doesn't exist |
| BUG-M005 | 5 | Duplicate RLS ENABLE blocks in schema.sql | supabase/schema.sql:605-619, 639-657 | Harmless but indicates maintenance issues |
| BUG-M006 | 10 | API route billing/bills uses "OPD" but BillType doesn't include it | app/api/billing/bills/route.ts:53 | Type mismatch for bill creation |
| BUG-M007 | 8 | API route lab/samples expects 3 args but route sends 2 | app/api/lab/samples/route.ts:21 | Sample registration API broken |

---

## Low Bugs (Minor Issues)

| ID | Phase | Description | File(s) | Impact |
|---|---|---|---|---|
| BUG-L001 | 11+ | Future phase sidebar items visible to logged-in users | navigation.ts (comingSoon flags) | Confusing for users — shows features that don't work |
| BUG-L002 | S2 | Test script has 2 TypeScript errors (IN_CONSULTATION not in enum, test_code not in type) | scripts/test-phase-s2-backend-apis.ts | Tests run fine at runtime but fail type check |
| BUG-L003 | 5 | Deactivating a facility doesn't auto-deactivate affiliated doctor records | affiliation-store.ts | Orphaned affiliations remain |
| BUG-L004 | 6 | API route appointments/route.ts sends patient_name in BookingRequest which doesn't accept it | app/api/appointments/route.ts:44 | Appointment creation may silently ignore name |

---

## Bug Summary

| Severity | Count |
|---|---|
| **CRITICAL** | 3 |
| **HIGH** | 9 |
| **MEDIUM** | 7 |
| **LOW** | 4 |
| **TOTAL** | 23 |

### By Phase:
| Phase | Bugs |
|---|---|
| 0 (Setup) | 2 |
| 1 (Auth) | 3 |
| 3 (Patient) | 1 |
| 5 (Hospital) | 3 |
| 6 (Appointments) | 1 |
| 8 (Lab) | 2 |
| 9 (Pharmacy) | 2 |
| 10 (Billing) | 6 |
| S2 (Backend) | 2 |
| System-wide | 1 |
