# S4 SECURITY BUG REGISTRY

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S4 Stabilization Track  
**Focus**: Security Gaps, Vulnerabilities Identified & Fixes Applied  

---

## 1. Resolved Security Bugs

| Bug ID | Vulnerability Category | Severity | Affected Component | Description | Fix Applied | Status |
|---|---|---|---|---|---|---|
| **S4-SEC-001** | Unauthenticated Fallback | Critical | `lib/api/api-utils.ts` | Default fallback of `findIdentityById("PAT-1001")` allowed unauthenticated HTTP requests to silently execute as Patient A | Removed unsafe fallback; unauthenticated requests return `401 UNAUTHORIZED` | **RESOLVED** |
| **S4-SEC-002** | Anti-IDOR: Prescriptions | High | `app/api/prescriptions/route.ts` | Passing `?patientId=PAT-1002` allowed Patient A to retrieve Patient B's digital prescriptions | Enforced `validatePatientRecordAccess` returning `403 FORBIDDEN` for ID mismatch | **RESOLVED** |
| **S4-SEC-003** | Anti-IDOR: Lab Orders | High | `app/api/lab/orders/route.ts` | Missing IDOR check on lab orders allowed cross-patient inspection | Enforced `validatePatientRecordAccess` returning `403 FORBIDDEN` | **RESOLVED** |
| **S4-SEC-004** | Anti-IDOR: Lab Reports | High | `app/api/lab/reports/route.ts` | Passing another patient ID allowed unauthorized access to pathology reports | Enforced `validatePatientRecordAccess` returning `403 FORBIDDEN` | **RESOLVED** |
| **S4-SEC-005** | Anti-IDOR: Bills | High | `app/api/billing/bills/route.ts` | Patient A querying `?patientId=PAT-1002` or `?billId=BILL-1002` could read other patient bills | Added record ownership check returning `403 FORBIDDEN` | **RESOLVED** |
| **S4-SEC-006** | Anti-IDOR: Waterfall | High | `app/api/billing/waterfall/route.ts` | Waterfall breakdown could be queried for any bill ID without ownership verification | Added `getBillById` and `validatePatientRecordAccess` returning `403 FORBIDDEN` | **RESOLVED** |
| **S4-SEC-007** | Anti-IDOR: Disputes | High | `app/api/billing/disputes/route.ts` | Querying disputes allowed browsing all dispute cases across the hospital | Scoped GET to patient's own dispute records for `role === "patient"` | **RESOLVED** |
| **S4-SEC-008** | Anti-IDOR: Encounters | High | `app/api/consultations/route.ts` | Passing other patient IDs or encounter IDs allowed unauthorized clinical note reading | Enforced `validatePatientRecordAccess` returning `403 FORBIDDEN` | **RESOLVED** |
| **S4-SEC-009** | Safe Error Masking | Medium | `lib/api/api-utils.ts` | Error responses could potentially reveal internal PostgreSQL table names or RLS details | Replaced internal technical errors with simple, user-friendly security messages | **RESOLVED** |
