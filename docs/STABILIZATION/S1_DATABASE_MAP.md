# MEDORA — S1 DATABASE MAP
## Stabilization Track — S1 Document 5 of 15

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Date**: August 2026  
**Status**: VERIFIED AUDIT

---

## 1. Database Architecture Reality

### SQL Schema (supabase/schema.sql)
- **Location**: `supabase/schema.sql` — 748 lines, 33.5KB
- **Tables defined**: 38 (with full FK constraints and RLS policies)
- **Type definitions**: `types/database.types.ts` — 110KB
- **Connection status**: ❌ NOT CONNECTED — `lib/supabase/client.ts` uses placeholder URL

### In-Memory Data Layer (ACTUAL RUNTIME)
- **Location**: `lib/data/*.ts` — 39 stores, ~580KB total
- **Persistence**: JavaScript arrays in module scope → lost on server restart
- **Session persistence**: `localStorage` on client side only

---

## 2. SQL Schema Table Map (38 Tables)

### Category A — Identities (6 tables)

| # | Table | Foreign Keys | RLS |
|---|---|---|---|
| 1 | profiles | → auth.users(id) | ✅ |
| 2 | organizations | standalone | ✅ |
| 3 | facilities | → organizations | ✅ |
| 4 | departments | → organizations, facilities | ✅ |
| 5 | patients | → profiles | ✅ |
| 6 | doctors | → profiles | ✅ |

### Category B — Relationships (6 tables)

| # | Table | Foreign Keys | RLS |
|---|---|---|---|
| 7 | doctor_affiliations | → doctors, organizations, facilities, departments | ✅ |
| 8 | staff_memberships | → profiles, organizations, facilities, departments | ✅ |
| 9 | organization_memberships | → profiles, organizations, facilities, departments | ✅ |
| 10 | facility_partnerships | → facilities, organizations | — |
| 11 | insurance_policies | → patients, organizations | — |
| 12 | consent_records | → patients, profiles | — |

### Category C — Healthcare Events (15 tables)

| # | Table | Foreign Keys | RLS |
|---|---|---|---|
| 13 | appointments | → patients, doctors, facilities, departments | ✅ |
| 14 | encounters | → patients, doctors, facilities, departments, appointments | ✅ |
| 15 | consultations | → encounters, patients, doctors, facilities | ✅ |
| 16 | prescriptions | → patients, doctors, encounters, organizations (×2) | ✅ |
| 17 | prescription_items | → prescriptions | — |
| 18 | prescription_dispensings | → prescriptions, organizations, profiles | — |
| 19 | lab_orders | → patients, doctors, encounters, organizations | ✅ |
| 20 | lab_samples | → lab_orders, profiles | — |
| 21 | lab_tests | → lab_orders | — |
| 22 | lab_reports | → lab_orders, patients, organizations | ✅ |
| 23 | emergency_cases | → patients, facilities, doctors | — |
| 24 | blood_requests | → emergency_cases, organizations (×2) | — |
| 25 | ambulance_requests | → emergency_cases, facilities, organizations | — |
| 26 | hospital_transfers | → patients, facilities (×2) | — |
| 27 | referrals | → patients, doctors (×2), encounters, facilities | — |

### Category D — Financial & Governance (11 tables)

| # | Table | Foreign Keys | RLS |
|---|---|---|---|
| 28 | bills | → patients, facilities, encounters | ✅ |
| 29 | bill_items | → bills | — |
| 30 | bill_versions | → bills, profiles | — |
| 31 | payments | → bills, patients | ✅ |
| 32 | insurance_claims | → insurance_policies, bills, patients, facilities | — |
| 33 | assistance_applications | → patients, bills | — |
| 34 | financing_applications | → patients, bills, organizations | — |
| 35 | bill_disputes | → bills, bill_items, patients | — |
| 36 | audit_logs | → profiles | ✅ |
| 37 | emergency_access_logs | → profiles, patients, organizations | ✅ |
| 38 | (RLS duplicate block) | — | — |

---

## 3. In-Memory Store ↔ SQL Table Mapping

| In-Memory Store | Corresponding SQL Table(s) | Alignment |
|---|---|---|
| identity-store.ts | profiles, patients, doctors | PARTIAL — identity-store is a superset |
| affiliation-store.ts | doctor_affiliations, organization_memberships | PARTIAL — store merges both |
| appointment-store.ts | appointments | ✅ ALIGNED |
| encounter-store.ts | encounters | ✅ ALIGNED |
| clinical-record-store.ts | consultations | PARTIAL — store has extra fields |
| prescription-store.ts | prescriptions, prescription_items | ✅ ALIGNED |
| lab-order-store.ts | lab_orders | ✅ ALIGNED |
| lab-sample-store.ts | lab_samples | ✅ ALIGNED |
| lab-testing-store.ts | lab_tests | ✅ ALIGNED |
| billing-store.ts | bills, bill_items | ✅ ALIGNED |
| payment-store.ts | payments | ✅ ALIGNED |
| dispute-store.ts | bill_disputes | ✅ ALIGNED |
| audit-store.ts | audit_logs | ✅ ALIGNED |
| consent-store.ts | consent_records | ✅ ALIGNED |
| department-store.ts | departments | ✅ ALIGNED |
| facility-store.ts | facilities | ✅ ALIGNED |
| referral-store.ts | referrals | ✅ ALIGNED |
| dispensing-store.ts | prescription_dispensings | ✅ ALIGNED |
| reconciliation-store.ts | (no SQL equivalent) | ❌ MISSING SQL TABLE |
| notification-store.ts | (no SQL equivalent) | ❌ MISSING SQL TABLE |
| waitlist-store.ts | (no SQL equivalent) | ❌ MISSING SQL TABLE |
| queue-store.ts | (no SQL equivalent) | ❌ MISSING SQL TABLE |
| medical-document-store.ts | (no SQL equivalent) | ❌ MISSING SQL TABLE |
| medical-order-store.ts | (no SQL equivalent) | ❌ MISSING SQL TABLE |
| consultation-history-store.ts | (no SQL equivalent) | ❌ MISSING SQL TABLE |
| correction-store.ts | (no SQL equivalent) | ❌ MISSING SQL TABLE |
| followup-store.ts | (no SQL equivalent) | ❌ MISSING SQL TABLE |
| billing-catalog-store.ts | (no SQL equivalent) | ❌ MISSING SQL TABLE |
| financial-coverage-store.ts | (no SQL equivalent) | ❌ MISSING SQL TABLE |
| medicine-catalog-store.ts | (no SQL equivalent) | ❌ MISSING SQL TABLE |
| pharmacy-intake-store.ts | (no SQL equivalent) | ❌ MISSING SQL TABLE |
| pharmacy-inventory-store.ts | (no SQL equivalent) | ❌ MISSING SQL TABLE |
| pharmacy-order-store.ts | (no SQL equivalent) | ❌ MISSING SQL TABLE |
| pharmacy-organization-store.ts | (no SQL equivalent) | ❌ MISSING SQL TABLE |
| lab-capability-store.ts | (no SQL equivalent) | ❌ MISSING SQL TABLE |
| lab-organization-store.ts | (no SQL equivalent) | ❌ MISSING SQL TABLE |
| lab-test-catalog-store.ts | (no SQL equivalent) | ❌ MISSING SQL TABLE |
| relationship-store.ts | (no SQL equivalent) | ❌ MISSING SQL TABLE |
| service-store.ts | (no SQL equivalent) | ❌ MISSING SQL TABLE |

---

## 4. Database Gap Analysis

| Metric | Count |
|---|---|
| SQL tables defined | 38 |
| In-memory stores | 39 |
| Stores with SQL equivalent | 20 |
| Stores WITHOUT SQL equivalent | 19 |
| SQL tables with RLS policies | 17 |
| SQL tables without RLS policies | 21 |

> [!WARNING]
> **19 in-memory stores have no corresponding SQL table.** These represent data that would be lost if the application were deployed to production with the current schema.

> [!IMPORTANT]  
> **The SQL schema and in-memory stores are NOT connected.** The schema exists for future Supabase integration but currently serves only as documentation.
