# MEDORA — S1 MOCK DATA REGISTRY
## Stabilization Track — S1 Document 9 of 15

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Date**: August 2026  
**Status**: VERIFIED AUDIT

---

## 1. Demo/Seed Data Locations

### Identity Store (lib/data/identity-store.ts — 65KB)
10 pre-seeded demo personas with full profiles:

| ID | Identifier | Name | Role | Organization |
|---|---|---|---|---|
| 1 | PAT-1001 | Rahul Verma | patient | Sovereign Patient |
| 2 | PAT-1002 | Priya Sharma | patient | Sovereign Patient |
| 3 | DOC-1001 | Dr. Ananya Sharma | doctor | City Hospital + Green Care Clinic |
| 4 | STAFF-1002 | Anita Patel | receptionist | City Hospital |
| 5 | HSP-1001 | City Hospital | hospital_admin | Multispeciality Hospital |
| 6 | CLN-1001 | Green Care Clinic | hospital_admin | Day-Care Clinic |
| 7 | LAB-1001 | ABC Diagnostics | lab_staff | Pathology Lab |
| 8 | PHA-1001 | ABC Pharmacy | pharmacy_staff | Dispensing Desk |
| 9 | BLC-1001 | City Blood Centre | blood_staff | Blood Logistics |
| 10 | ADM-1001 | Medora Platform Admin | admin | Governance |

### Encounter Store (lib/data/encounter-store.ts)
- Seeded encounter `ENC-1001` (provider: DOC-1001, patient: PAT-1001, org: HSP-1001, status: COMPLETED)

### Facility Store (lib/data/facility-store.ts — 21KB)
- Pre-seeded facilities for HSP-1001 (Bhubaneswar, Rourkela, Cuttack campuses)
- Lab and pharmacy facilities

### Department Store (lib/data/department-store.ts — 14KB)
- Pre-seeded departments (Cardiology, General Medicine, etc.) for City Hospital

### Service Store (lib/data/service-store.ts — 19KB)
- Pre-seeded healthcare services with pricing

### Affiliation Store (lib/data/affiliation-store.ts — 40KB)
- Pre-seeded doctor affiliations across hospitals and clinics

### Prescription Store (lib/data/prescription-store.ts — 38KB)
- Seeded prescriptions linked to ENC-1001

### Lab Order Store (lib/data/lab-order-store.ts — 33KB)
- Seeded lab orders with test items

### Medicine Catalog (lib/data/medicine-catalog-store.ts — 7KB)
- Pre-seeded medicine catalog with dosages and pricing

### Lab Test Catalog (lib/data/lab-test-catalog-store.ts — 9KB)
- Pre-seeded diagnostic test catalog

### Billing Catalog (lib/data/billing-catalog-store.ts — 5KB)
- Pre-seeded service pricing catalog

### Pharmacy Inventory (lib/data/pharmacy-inventory-store.ts — 12KB)
- Pre-seeded FEFO batch inventory with expiry dates

---

## 2. Mock Data vs. Legitimate Demo Data

| Category | Classification | Reason |
|---|---|---|
| Demo personas (10 users) | ✅ LEGITIMATE DEMO | Required for testing multi-role system without real users |
| Seeded encounters | ✅ LEGITIMATE DEMO | Required to demonstrate clinical workflows |
| Seeded facilities/depts | ✅ LEGITIMATE DEMO | Required for organization management testing |
| Medicine catalog | ✅ LEGITIMATE DEMO | Represents realistic drug inventory |
| Lab test catalog | ✅ LEGITIMATE DEMO | Represents realistic diagnostic tests |
| Billing pricing catalog | ✅ LEGITIMATE DEMO | Represents realistic service pricing |
| FEFO pharmacy inventory | ✅ LEGITIMATE DEMO | Required for batch selection testing |
| ABHA OTP sandbox | ⚠️ MOCK | Cannot verify real ABHA without ABDM credentials |
| Payment settlement | ⚠️ MOCK | Synchronous — no actual payment gateway |
| Supabase URL placeholder | ⚠️ MOCK | No real database connection |

---

## 3. Inline Hardcoded Data in UI Components

Based on grep analysis, 43 page files contain the string "placeholder" — but investigation shows these are form input placeholders (e.g., `placeholder="Enter your name"`) which is standard HTML usage, NOT mock data.

**Actual inline mock data found**: Only `patient/documents/page.tsx` references "mock" — this page uses the term "mock data" in a comment but renders data from `medical-document-store.ts` which is legitimate demo data.

---

## 4. Data Reset Behavior

| Trigger | Effect |
|---|---|
| Server restart (`npm run dev`) | All in-memory stores reset to seeded state |
| Browser refresh | Session restored from localStorage → identity persisted |
| New browser tab | Same session (shared localStorage) |
| Incognito window | Clean state — no session |
| Build (`npm run build`) | No persistence effect — stores are runtime-only |

> [!IMPORTANT]
> All data created during a user session (appointments, prescriptions, bills, etc.) is LOST on server restart. This is the single biggest limitation of the current architecture.
