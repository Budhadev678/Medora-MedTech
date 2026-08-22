# 🌐 MEDORA — Connectivity Audit Report (Phase A.1)
## Current vs. Target Ecosystem Connectivity & Relationship Mapping

---

### 1. Master Connectivity Principle
In MEDORA, every participant (Person, Organization, Facility, Healthcare Interaction, Financial Transaction, Emergency Event) is an independent entity connected strictly through explicit, auditable relationships. No relationship should ever be forged using hardcoded names, static strings, or implicit client state.

---

### 2. CURRENT Connectivity Architecture (As of Phase 4.4)

```
                                  MEDORA ECOSYSTEM (CURRENT)
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      │                                               │
                   PEOPLE                                       ORGANIZATIONS
                      │                                               │
      ┌───────────────┼───────────────┐               ┌───────────────┼───────────────┐
      │               │               │               │               │               │
   PATIENT          DOCTOR          STAFF          HOSPITAL        CLINIC            LAB / PHARMACY /
 (PAT-1001,       (DOC-1001,      (STAFF-1001,   (HSP-1001,      (CLN-1001)         BLOOD / INS / GOV / AMB
  PAT-1002,        DOC-1002,       lab_staff,    HSP-1002)                          (LAB-1001, PHA-1001,
  PAT-1003)        DOC-1003)      pharm_staff,                                       BLC-1001, INS-1001,
      │               │           blood_staff,                                       FIN-1001, GOV-1001,
      │               │           gov_staff)                                         AMB-1001)
      │               │               │               │               │               │
      │               │               └───────────────┴───────────────┴───────────────┘
      │               │                          (staffData / staff_memberships)
      │               │
      │               └───────────────────────────────┐
      │                                (doctorData.affiliations)
      │                                               ↓
      │                              ┌─────────────────────────────────┐
      │                              │  MULTI-HOSPITAL AFFILIATIONS   │
      │                              │  • City Hospital (HSP-1001)     │
      │                              │  • Green Care Hospital (HSP-1002│
      │                              │  • Green Care Clinic (CLN-1001) │
      │                              └─────────────────────────────────┘
      │                                               │
      ├────────────────────── Care Relationships ─────┤
      │               (lib/data/relationship-store.ts)│
      │                                               │
      ├────────────────────── Patient Consent ────────┤
      │                  (lib/data/consent-store.ts)  │
      │                                               │
      ├────────────────────── Access Engine ──────────┤
      │               (lib/services/access-engine.ts) │
      │                                               │
      ↓                                               ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                       HEALTHCARE CARE LAYER (LIVE)                          │
│                                                                             │
│  PATIENT ── ENC-* ── CR-* ── [ RX-* (Open Rx) | LAB-ORD-* (Open Lab) ]      │
│      │                                                                      │
│      └───── DOC-* (Medical Documents Vault: Provider Verified vs Uploaded)  │
│      │                                                                      │
│      └───── Unified Health Journey Timeline (Dynamic Aggregation)           │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Current Connection Mechanisms:
1. **Patient $\leftrightarrow$ Doctor / Hospital**:
   - `CareRelationship` entity (`REL-*`) links `patient_id` with `organization_id` and `practitioner_id`.
   - `ConsentRecord` entity (`CNS-*`) grants purpose-bound, time-bound, scoped access to medical records.
   - Evaluated at runtime by `AccessEngine.evaluateAccess()`.
2. **Doctor $\leftrightarrow$ Organizations**:
   - Represented as 1 global Doctor identity (`DOC-1001` Dr. Ananya Sharma) holding an embedded array `doctorData.affiliations` linking to `HSP-1001`, `HSP-1002`, and `CLN-1001`.
   - Doctor can switch active practice facility context in consultation workbench.
3. **Staff $\leftrightarrow$ Organizations**:
   - `STAFF-1001` (Sunita Mohanty) has `staffData` array linking to `HSP-1001` with `roleTitle: "Head Nurse"`.
   - Other specialized staff personas (`LAB-1001`, `PHA-1001`, `BLC-1001`, `INS-1001`, `FIN-1001`, `GOV-1001`, `AMB-1001`) are represented as dedicated accounts where the user role is the organization function.
4. **Prescription $\leftrightarrow$ Pharmacy**:
   - `HealthcarePrescription` (`RX-*`) is decoupled from hospital lock-in. Patient can present QR slip at any connected pharmacy.
5. **Lab Order $\leftrightarrow$ Laboratory**:
   - `HealthcareLabOrder` (`LAB-ORD-*`) allows patient to choose target diagnostic laboratory.

---

### 3. TARGET Connectivity Architecture (Post Phase A Refactoring)

```
                                  MEDORA ECOSYSTEM (TARGET)
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      │                                               │
                    USER                                        ORGANIZATION
             (auth.users.id)                                   (Unique Legal Entity)
                      │                                               │
                      ↓                                               ├── Hospital
                    PERSON                                            ├── Clinic
          (Global Human Identity)                                     ├── Diagnostic Laboratory
                      │                                               ├── Pharmacy
          ┌───────────┴───────────┐                                   ├── Blood Centre
          │                       │                                   ├── Insurance Company
       PATIENT               PROFESSIONAL                             ├── Government Body
   (Health Profile)     (Doctor / Nurse / Staff)                      ├── Financing Partner
          │                       │                                   └── Ambulance Provider
          │                       │                                           │
          │                       └───────────────┬───────────────────────────┘
          │                                       │
          │                                       ↓
          │                          ORGANIZATION MEMBERSHIP
          │                     (User ↔ Organization Bridge)
          │                                       │
          │                        ┌──────────────┴──────────────┐
          │                        │                             │
          │                   MEMBER ROLE                   PERMISSIONS
          │              (e.g. Doctor, Nurse,          (e.g. prescribe, dispense,
          │               Lab Tech, Billing Lead,       adjudicate, dispatch,
          │               Hospital Admin)               triage)
          │                                                      │
          └──────────────────────────┬───────────────────────────┘
                                     │
                                     ↓
                          CARE & ACCESS CONTRACT
                 (Patient ↔ Organization / Practitioner)
                                     ├── Care Relationship (REL-*)
                                     ├── Patient Consent (CNS-*)
                                     ├── Multi-Factor Access Decision
                                     └── Append-Only Audit Ledger (AUD-*)
```

---

### 4. Direct Current vs. Target Comparison Matrix

| Relationship | Current Implementation | Target Implementation | Gap / Required Phase A Refactoring |
| :--- | :--- | :--- | :--- |
| **User $\rightarrow$ Person** | `StoredIdentity` bundles auth, profile, and clinical data into 1 monolithic object. | Clean separation: `User` (auth/credentials) $\rightarrow$ `Person` (demographics/identity). | Extract user authentication credentials from domain identity in Phase A.2. |
| **Doctor $\rightarrow$ Hospital/Clinic** | Array `doctorData.affiliations` embedded on Doctor `StoredIdentity`. | Normalized `organization_memberships` table with `role: 'doctor'` and affiliation metadata. | Normalize affiliation records into first-class membership entities in Phase A.2. |
| **Staff $\rightarrow$ Organization** | Mixed: `STAFF-1001` has `staffData[]`, while `LAB-1001` / `PHA-1001` use global roles (`lab_staff`, `pharmacy_staff`). | Uniform `organization_memberships` table linking `Person` to `Organization` with scoped `role` and `permissions`. | Migrate all specialized staff personas to uniform membership model in Phase A.2 / A.3. |
| **Organization Entity** | Organization accounts are represented as user profiles (`hospital_admin`, `lab_staff`). | Organizations are first-class entities (`organizations` table) containing multiple member users. | Separate organization entity from admin user account in Phase A.2. |
| **Patient $\rightarrow$ Multiple Hospitals** | Global patient identity (`PAT-1001`) with encounters (`ENC-1001`, `ENC-1002`) across different hospitals. | Global patient identity with normalized encounters and care relationships. | Current architecture already matches target; keep preserved. |
| **Prescription Fulfillment** | Open prescription model (`RX-*`) independent of hospital pharmacy. | Open prescription fulfillment with verified pharmacy dispensing transactions. | Architecture matches target; wire live dispensing in Phase 9. |
| **Access Control** | Evaluated via `AccessEngine.evaluateAccess()` using in-memory/localStorage stores. | Evaluated via `AccessEngine` backed by normalized database tables and Supabase RLS. | Migrate in-memory checks to database-backed RLS policies in Phase A.3. |
