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

---

## 6. Phase A.2 Implemented Identity & Organization Membership Architecture

```
                            USER ACCOUNT
                     (Authoritative Auth ID & Credentials)
                                 │
                                 ↓
                           PERSON PROFILE
                     (Human Identity & Demographics)
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
          PATIENT PROFILE              PROFESSIONAL PROFILE
     (Health record, blood group,       (Licensure, registration,
      allergies, ABHA link)              qualifications, specialty)
                 │                               │
                 │                               ↓
                 │                    ORGANIZATION MEMBERSHIP
                 │              (First-Class Join Entity: MEM-*)
                 │                               │
                 │                 ┌─────────────┴─────────────┐
                 │                 │                           │
                 │           ORGANIZATION                  FACILITY
                 │         (HSP-1001, CLN-1001,         (HSP-1001-BBSR,
                 │          LAB-1001, PHA-1001)          HSP-1001-ROU)
                 │                 │
                 └─────────────────┼───────────────────────────┘
                                   │
                                   ↓
                   CLINICAL & HEALTHCARE CONTRACTS
               (Encounters, Clinical Records, Prescriptions,
               Lab Orders, Documents, Consents, Audit Ledger)
```

### Phase A.2 Core Architecture Accomplishments
- Canonical `UserAccount` $\rightarrow$ `PersonProfile` $\rightarrow$ `OrganizationMembership` $\rightarrow$ `OrganizationEntity` data model.
- Multi-hospital practice under 1 doctor identity (e.g. Dr. Ananya with memberships `MEM-1001`, `MEM-1002`, `MEM-1003`).
- Multi-organization staff appointments (e.g. Anita with `MEM-5001`, `MEM-5002`).
- Same person holding distinct roles across facilities (e.g. Rahul as Doctor at City Hospital and Administrator at Green Care Clinic).
- Membership lifecycle (`INVITED`, `PENDING`, `ACTIVE`, `SUSPENDED`, `REVOKED`) with immutable historical record preservation.
- Complete elimination of hardcoded identity fallbacks in patient dashboards.

---

## 7. Phase A.3 Implemented Role, Permission & Authorization Architecture

```
                                AUTHENTICATED USER
                                        │
                                        ↓
                               USER / PERSON PROFILE
                                        │
                                        ↓
                             ORGANIZATION MEMBERSHIP
                                        │
                                        ↓
                                 CONTEXTUAL ROLE
                           (Resolved per Organization)
                                        │
                                        ↓
                             PERMISSION MATRIX CHECK
                          (RESOURCE_ACTION Verification)
                                        │
                                        ↓
                          RESOURCE SCOPING & IDOR CHECK
                      (Ownership / Consent / Emergency)
                                        │
                                        ↓
                         ACTION RESTRICTION & COMPLIANCE
                     (Hard Delete Prohibited on Medical Data)
                                        │
                                        ↓
                                 ALLOW / DENY
```

### Core Authorization Principles Implemented
1. **Multi-Factor Contextual Authorization**: The `AuthorizationEngine` independently derives the actor from session credentials, verifies membership in the active organization context, and maps to the contextual role.
2. **Least Privilege & Default Deny**: Default response is `DENY`. Permissions are explicit (`PATIENT_VIEW`, `ENCOUNTER_CREATE`, `PRESCRIPTION_CREATE`, etc.).
3. **Break-Glass Emergency Protocol**: Clinicians can trigger time-bounded (4-hour) emergency break-glass access (`EMG-ACC-*`) with required clinical justifications, automatically recorded in the immutable audit ledger.
4. **IDOR & Tampering Immunity**: Zero trust in client-submitted `user_id`, `role`, or `organization_id`. URL spoofing and cross-patient requests are intercepted and rejected with `RESOURCE_MISMATCH`.
5. **Database RLS Enforced**: Row-Level Security policies active across `profiles`, `patients`, `organization_memberships`, `encounters`, `prescriptions`, `lab_orders`, `emergency_access_logs`, and `audit_logs` (with deletion blocked).

---

## 8. Phase A.4 Implemented Dashboard, Workspace & Navigation Architecture

```
                            AUTHENTICATED SESSION
                                      │
                                      ↓
                             IDENTITY RESOLUTION
                                      │
                                      ↓
                       ORGANIZATION MEMBERSHIP LOOKUP
                                      │
                                      ↓
                          ACTIVE CONTEXT RESOLUTION
                     (Header OrganizationSwitcher for UX)
                                      │
                                      ↓
                         WORKSPACE RESOLVER ENGINE
                     (resolveWorkspace(user, activeMem))
                                      │
              ┌───────────────────────┼────────────────────────┐
              ↓                       ↓                        ↓
      PATIENT APP               CLINICAL SUITE            ADMIN & ALLIED
   (/patient, mobile)         (/doctor, /nurse,         (/hospital, /clinic,
    • Home                     /reception)               /lab, /pharmacy,
    • Appointments             • Queue                   /blood-bank, /admin)
    • Health Timeline          • Consultations           • Operations
    • More Drawer:             • Patients                • Roster
      - Documents Vault        • Prescriptions           • Inventory
      - Insurance & Benefits   • Lab Orders              • Governance
      - Govt Schemes (BSKY)    • Vitals Check-in
      - CarePay Micro-EMI
```

### Core Architecture Enhancements Implemented
1. **Contextual Workspace Assignment**: Workspaces are resolved by `Identity + Active Membership + Contextual Role`, preventing flat global role leakage.
2. **True Mobile-First Patient UX**: 4 primary bottom destinations (`Home`, `Appointments`, `Health`, `More`) with dedicated patient service pages for Insurance (`/patient/insurance`), Government Subsidies (`/patient/government`), CarePay Micro-EMI (`/patient/finance`), and Emergency SOS (`/patient/emergency`).
3. **Role-Specific Staff Workspaces**: Eliminated generic staff dashboard; created dedicated `Reception Workspace` (`/reception`) and `Nursing Workspace` (`/nurse`).
4. **Multi-Organization Context Switching**: Dynamic switching across multi-facility appointments (e.g. Dr. Ananya across City Hospital and Green Care Clinic) with immediate data re-scoping and Phase A.3 authorization boundary enforcement.
5. **Clear External Service Separation**: Insurance, Government Welfare, Treatment Financing, and Ambulance transit are cleanly surfaced as consumer healthcare services for patients rather than ordinary hospital operational sidebars.

---

## 9. Phase C.4 Unified Clinical Record & Continuity Layer Architecture

```
                    PATIENT / DOCTOR / SPECIALIST CLIENT
                                     │
                                     ↓
                  CLINICAL CONTINUITY SERVICE ENGINE
              (lib/services/clinical-continuity-service.ts)
                                     │
     ┌───────────────────┬───────────┴───────────┬───────────────────┐
     ↓                   ↓                       ↓                   ↓
ENCOUNTERS & NOTES   PRESCRIPTIONS          LABORATORY          APPOINTMENTS &
 (ENC-*, CR-*)       & ORDERS (PRX-*, ORD-*) (LAB-ORD-*, SMP-*,  DOCUMENTS (APT-*,
  Phase C.1           Phase C.2              RPT-*) Phase C.3    DOC-*) Phase B.1/4.4
     │                   │                       │                   │
     └───────────────────┼───────────────────────┴───────────────────┘
                         │
                         ↓
            DYNAMIC CLINICAL AGGREGATION & PROJECTION
         • Single Source of Truth (Zero Duplication)
         • Occurrence Timestamps (occurred_at)
         • 3-Section Partitioning: UPCOMING, TODAY, PAST
         • Encounter Clinical Bundles (EncounterClinicalBundle)
         • Factual Structured Health Summary (No AI)
         • Role-Based Least Privilege Scoping (Patient, Doctor, Lab, Pharmacy, Hospital)
         • Immutable Audit Trail (TIMELINE_ACCESSED)
```

### Core Architecture Invariants
1. **Connectivity, Not Duplication:** C.4 is purely a dynamic aggregation and projection engine. It references primary keys and timestamps in authoritative stores (`encounters`, `prescriptions`, `lab_orders`, `lab_reports`, `medical_orders`, `appointments`, `medical_documents`) and never stores duplicate copies of clinical notes.
2. **Clinical Occurrence Timestamps:** Events are sequenced chronologically by clinical occurrence timestamp (`occurred_at`) rather than technical record creation timestamps.
3. **Encounter Clinical Bundles:** All prescriptions, lab tests, samples, reports, and recommendations generated during a consultation are grouped under their parent `encounter_id`.
4. **Least Privilege Scoping:** Laboratory staff only accesses assigned lab investigations; pharmacy staff only accesses dispensable prescriptions; doctors access their patients with Current Encounter highlighting; patients are protected by strict IDOR isolation.
5. **Strict No-AI Clinical Policy:** Factual extraction only; zero automated or AI-generated clinical diagnosis or summaries.

---

## 10. Multi-Tenant Healthcare Organization, Facility, Department & Service Architecture (Phase 5.1 & 5.2)

### Relational Entity Hierarchy
```
                                  ORGANIZATION (ORG-1001)
                                  "City Healthcare Group"
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ↓                                           ↓
              FACILITY (FAC-1001)                         FACILITY (FAC-1002)
            "City Hospital (Main Hub)"                    "City Clinic (Branch)"
                       │                                           │
         ┌─────────────┴─────────────┐                             │
         ↓                           ↓                             ↓
    DEPARTMENT (DEP-1001)       DEPARTMENT (DEP-1002)         DEPARTMENT (DEP-2001)
     "Cardiology & Cath"        "General & Emergency"          "General Medicine"
         │                           │                             │
    ┌────┴────┐                 ┌────┴────┐                   ┌────┴────┐
    ↓         ↓                 ↓         ↓                   ↓         ↓
 SERVICE   DOCTORS           SERVICE   STAFF               SERVICE   DOCTORS
(SRV-1001) (DOC-1001)       (SRV-1004) (STAFF-1001)       (SRV-2001) (DOC-1001)
  "ECG"    Dr. Ananya         "Triage"   Anita (Nurse)    "OPD Consult" Dr. Ananya
```

### Core Architecture Invariants
1. **Legal Organization $\neq$ Physical Facility Campus:** Legal parents (`HealthcareOrganization`) own and govern one or more geographical facility campuses (`HealthcareFacility`).
2. **Unified Doctor & Staff Identity Across Facilities:** Doctor `DOC-1001` maintains a single user profile. They hold distinct facility-specific affiliations with customized consultation rates, room assignments, and service authorizations.
3. **Facility-Scoped Clinical Departments:** Departments are uniquely identified by `facility_id + code/name`. Collisions across campuses are prevented.
4. **Department-Level & Facility-Level Services:** Services can be attached to a specific clinical unit (e.g. 12-Lead ECG under Cardiology) or span the whole facility (e.g. Emergency Triage).
5. **Zero Destructive Mutation & Historical Preservation:** Ending a doctor/staff affiliation or deactivating a department/facility sets `status: INACTIVE/ENDED` with timestamps. Historical clinical encounters (C.1), prescriptions (C.2), lab reports (C.3), and appointments (B.1) remain completely unaffected and immutable.
6. **Server-Authoritative Enforcement:** Multi-tenant access controls, IDOR validation, and append-only audit trail logging (`OrganizationService`).

---

## 11. Phase 6.1 & 6.2 Appointment Discovery, Booking & Dynamic Queue Engine Architecture

```
                                  PATIENT / USER ENTRYPOINT
                                             │
                                             ↓
                                    APPOINTMENT REQUEST
                                             │
      ┌──────────────────────────────────────┼──────────────────────────────────────┐
      ↓                                      ↓                                      ↓
DOCTOR-FIRST MODE                     FACILITY-FIRST MODE                    SERVICE-FIRST MODE
• Preferred Doctor Selection          • Hospital / Clinic Campus             • Medical Service Catalog
• Multi-Facility Practice Footprint   • Clinical Departments                 • Service-to-Facility Map
• Strict vs Flexible Alternatives     • Practicing Specialists               • Eligible Doctor Match
      │                                      │                                      │
      └──────────────────────────────────────┼──────────────────────────────────────┘
                                             │
                                             ↓
                              PHASE-4 OPERATIONAL SCHEDULE CHECK
                                             │
                                             ↓
                                 SESSION CAPACITY VALIDATION
                                (SESSION + CAPACITY Invariant)
                                             │
                    ┌────────────────────────┴────────────────────────┐
                    ↓                                                 ↓
            CAPACITY AVAILABLE                                 SESSION FULL
                    │                                                 │
            CONFIRMED BOOKING                                 5-TIER ALTERNATIVES /
           (APT-*, Token: 01)                                 WAITLIST (ACTIVE)
                    │                                                 │
                    ↓                                                 ↓
            CHECK-IN WORKFLOW                                  CANCEL / EXPLICIT
        (Patient Self / Reception)                             OFFER ACCEPTANCE
                    │
                    ↓
               QUEUE ENTRY (QE-*)
                    │
                    ↓
             TOKEN GENERATION
           (e.g. C-01, R-02, W-01)
                    │
                    ↓
             DYNAMIC QUEUE STATES
         WAITING (Range: 20–35 min)
                    │
                    ↓ (Doctor Call Next)
                 CALLED
                    │
                    ↓ (Doctor Start Consultation)
            IN CONSULTATION (Max 1 active per doctor)
                    │
                    ↓ (Doctor Complete Consultation)
                COMPLETED
                    │
                    ↓
            CLINICAL ENCOUNTER HANDOFF (Phase 7 / C.1)
```

### Core Architecture Invariants
1. **Three Distinct Entities:** `Appointment` (Reservation) $\neq$ `Queue Entry` (Operational Clinic Position) $\neq$ `Encounter` (Clinical Consultation).
2. **Preferred Doctor Guarantee:** When a patient specifies a doctor in strict mode (`SAME_DOCTOR_ONLY`), MEDORA searches all affiliated campuses under that clinician's unified profile and never silently replaces them with an alternative doctor.
3. **Session Capacity vs Micro-Slots:** Sessions operate on an aggregate capacity model (e.g. 12 patients per morning session) without artificial, rigid minute intervals.
4. **Single Active Consultation Invariant:** A clinician can have at most one consultation in `IN_CONSULTATION` status at any given moment.
5. **Deterministic Token Generation:** Stable, sequential tokens (`C-01`, `C-02`, `R-01`) issued server-side upon physical or mobile check-in.
6. **Dynamic Range Waiting Estimation:** Realistic ranges (`20–35 min`) derived from queue count, doctor velocity, and consultation duration baselines.


