# 🏛️ MEDORA — Ecosystem Relationship & Connectivity Architecture

## 1. The Master Axiom
> **"Every person, organization, facility, medical event, financial event, and emergency event is an independent entity connected through explicit relationships. Never connect entities using hardcoded names, text fields, or frontend-only state."**

---

## 2. Core Relational Hierarchy
```
                                  MEDORA
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
       PEOPLE                  ORGANIZATIONS                FACILITIES
          │                          │                          │
    ┌─────┼─────┐             ┌──────┼──────┐             ┌─────┼──────┐
    │     │     │             │      │      │             │     │      │
 Patient Doctor Staff      Hospital Clinic Lab Pharmacy  Hospital Clinic Lab
    │     │     │             │      │      │     │
    │     │     └─────────────┴──────┴──────┴─────┘ (Staff Memberships)
    │     │                          │
    │     └────── Affiliations ──────┘ (Doctor Affiliations)
    │                                │
    └────── Healthcare Encounters ───┘
```

---

## 3. Core Architectural Guarantees
1. **Zero Account Duplication:** If Dr. Sharma works at 3 hospitals, she has exactly 1 Doctor account (`DOC-1001`) with 3 distinct `doctor_affiliations`.
2. **Patient Independence:** Patient `PAT-1001` visiting City Hospital and Green Care Clinic has 1 persistent medical identity and distinct `encounters`.
3. **Open Pharmacy Fulfillment:** Digital Prescriptions are clinical outputs of an encounter and are never locked to a single retail pharmacy.
4. **"Why Was I Charged?" Traceability:** Every item on a bill (`bill_items`) links directly to the clinical event (`consultation`, `lab_order`, `prescription`, `emergency_case`) that generated it.
5. **Cross-Cutting Audit Ledger:** Every critical event generates an immutable `audit_logs` record detailing `WHO`, `WHAT`, `WHEN`, `WHY`, and `STATUS`.

---

## 4. Phase 2 Real-World Workspace Resolution System
```
Authenticated User (Session)
        ↓
MEDORA Identity (Identifier: PAT-1001, DOC-1001, HSP-1001, CLN-1001, LAB-1001, PHA-1001, GOV-1001, AMB-1001, etc.)
        ↓
Role & Organization Membership (doctor_affiliations, staff_memberships)
        ↓
Workspace Resolver (resolveWorkspace(user, role))
        ├── PATIENT ROLE → Patient Mobile App (/patient)
        ├── DOCTOR ROLE → Clinical Workspace (/doctor)
        ├── HOSPITAL ADMIN (Hospital) → Hospital Command Center (/hospital)
        ├── HOSPITAL ADMIN (Clinic) → Outpatient Clinic Operations (/clinic)
        ├── LAB STAFF → Laboratory Diagnostic Workbench (/lab)
        ├── PHARMACY STAFF → Pharmacy Dispensing Desk (/pharmacy)
        ├── INSURANCE STAFF → Insurance Claims & Pre-Auth (/insurance)
        ├── GOVERNMENT STAFF → Government Assistance Desk (/government)
        ├── FINANCE STAFF → Healthcare Financing Workspace (/finance)
        ├── AMBULANCE STAFF → Emergency Dispatch Console (/ambulance)
        ├── BLOOD STAFF → Blood Coordination Desk (/blood-bank)
        ├── STAFF ROLE → Healthcare Staff Duty Desk (/staff)
        └── PLATFORM ADMIN → Platform Governance Overview (/admin)
        ↓
Dedicated Navigation & Landing Experience (Zero Doctor / Generic Dashboard Fallbacks)
        ↓
Row-Level Security & RoleGuard Protection
```

---

## 5. Phase 3 Patient Identity, ABHA, Consent & Access Architecture
```
                         MEDORA
                            │
                      AUTHENTICATION
                            │
                        USER ID
                            │
                     PATIENT IDENTITY (PAT-1001)
                            │
                 ┌──────────┴──────────┐
                 │                     │
              PROFILE               VERIFICATION
                 │                     │
          ┌──────┼──────┐        ┌────┴────┐
          │      │      │        │         │
       Contact Address Health   Aadhaar    ABHA
       Info             Info      │         │
                                   └────┬────┘
                                        │
                                    ABHA LINK (rahulverma@abdm)
                                        │
                                        ↓
                                 RELATIONSHIPS
                                        │
                              ┌─────────┴─────────┐
                              │                   │
                          Organizations        Providers
                              │                   │
                              └─────────┬─────────┘
                                        │
                                      CONSENT (Purpose + Scope + Expiry)
                                        │
                                  ACCESS CONTROL (AccessEngine.evaluateAccess)
                                        │
                               ┌────────┴────────┐
                               │                 │
                             ALLOW              DENY
                               │
                               ↓
                        FUTURE HEALTH DATA
                               │
                             AUDIT (Append-Only Immutable Ledger)
```

### Core Identity & Access Principles
1. **Separation of Concerns:** `IDENTITY` $\neq$ `ABHA` $\neq$ `RELATIONSHIP` $\neq$ `CONSENT` $\neq$ `PERMISSION` $\neq$ `ACCESS` $\neq$ `AUDIT`.
2. **Patient Data Sovereignty:** Patients explicitly review who, why, what, and how long. Scope is never `ALL` by default.
3. **Multi-Factor Access Decision:** Access decisions require Authenticated Actor + Active Org Membership + Care Relationship + Valid Non-Expired Non-Revoked Consent + Sufficient Scope.
4. **Verified Field Protection:** Verified fields (Aadhaar, legal name, blood group certification) cannot be directly overwritten via raw client mutations; must go through the administrative `identity_correction_requests` pipeline.
5. **Append-Only Immutability:** All security events are logged with sanitized metadata (no Aadhaar, OTP, or passwords).

