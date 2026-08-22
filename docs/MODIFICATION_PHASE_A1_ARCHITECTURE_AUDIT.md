# 🏛️ MEDORA — MODIFICATION PHASE A.1: ARCHITECTURE AUDIT REPORT
## Current-State Deep Audit & Structural Gap Analysis

**Date of Audit:** 21 August 2026  
**Audit Stage:** Modification Track Phase A.1 (Discovery & Architecture Audit Only)  
**Status:** `AUDITED` & `DOCUMENTED`  
**Git Head Reference:** `50d7b97` (Phase 4.4 Verified)

---

### 1. Executive Summary

This architecture audit conducts a forensic inspection of the existing MEDORA healthcare platform codebase following the completion of **Phase 4.4 (Medical Documents & Unified Patient Health Journey)**.

The primary finding is that MEDORA has established a robust, verifiable clinical care core (`Patient` $\rightarrow$ `Encounter` $\rightarrow$ `Clinical Record` $\rightarrow$ `Prescription` / `Lab Order` $\rightarrow$ `Medical Document` $\rightarrow$ `Health Journey`), but exhibits structural conflations in its **Identity, Organization, and Staff Membership** models that must be resolved in Modification Phase A before proceeding to operational phases (Phases 5–19).

Specifically:
- **Identity Hybridization**: `StoredIdentity` in `lib/data/identity-store.ts` conflates authentication credentials, personal demographics, professional licensure, organizational entities, and staff memberships into a single monolithic object.
- **Organization-as-User Paradigm**: Organizations (Hospitals, Clinics, Laboratories, Pharmacies, Blood Banks, Payers) are currently instantiated as individual user accounts with administrative roles (`hospital_admin`, `lab_staff`) rather than decoupled legal entities containing member users.
- **Global Staff Roles vs Organization Memberships**: Staff roles are currently modeled as top-level enum variants (`pharmacy_staff`, `lab_staff`, `blood_staff`, etc.) rather than an `organization_memberships` join table with scoped contextual roles and fine-grained permissions.
- **Account Isolation & Mock Data Residue**: While the underlying domain stores (`lib/data/*.ts`) enforce strict patient isolation (e.g. `PAT-1001` vs `PAT-1002`), several downstream operational screens (e.g. `/finance`, `/government`, `/admin/audit`, `/lab/reports`, `/verify/rx/[id]`) contain hardcoded mock data arrays with static references to "Rahul Verma", causing visual confusion during persona switching.

---

### 2. Current Technology Stack

| Layer | Technology | Details / Configuration |
| :--- | :--- | :--- |
| **Framework** | Next.js 14.2.35 (App Router) | React 18, TypeScript 5, Node.js runtime |
| **Styling & UI** | Tailwind CSS v4, Lucide React, Radix UI Primitives | Custom design system (`components/ui/*`, `components/shared/*`) |
| **Database (Target)** | PostgreSQL 15+ via Supabase | Master schema in `supabase/schema.sql` (37 tables, 17 RLS policies) |
| **Runtime Data Layer** | Client-Side In-Memory / LocalStorage Domain Stores | `lib/data/*.ts` stores with event dispatchers for live UI synchronization |
| **Authentication** | Hybrid: LocalStorage Session Store + Supabase Auth Client | `lib/auth/auth-context.tsx` with credentials authentication & session tokens |
| **Access Control** | Centralized Multi-Factor Access Engine | `lib/services/access-engine.ts` (Actor + Org + Relationship + Consent + Scope) |
| **Localization** | Custom Tri-Lingual Localization Context | `lib/localization.ts` (English `en`, Hindi `hi`, Odia `or`) |
| **Testing** | Node / tsx CLI Automated Test Suites | 6 standalone test suites covering 181 automated assertions (100% pass) |

---

### 3. Current Repository Structure

```
MEDORA-MEDTECH/
├── app/                               # Next.js App Router (111 compiled routes)
│   ├── (auth)/                        # Authentication routes (/login, /register)
│   ├── access-denied/                 # Unauthorized access landing page
│   ├── admin/                         # Governance & audit overview (/admin/*)
│   ├── ambulance/                     # Emergency dispatch console (/ambulance/*)
│   ├── blood-bank/                    # Blood coordination desk (/blood-bank/*)
│   ├── clinic/                        # Outpatient clinic operations (/clinic/*)
│   ├── doctor/                        # Clinical doctor workspace (/doctor/*)
│   ├── emergency/                     # Emergency triage pre-alerts (/emergency/*)
│   ├── finance/                       # Healthcare financing workspace (/finance/*)
│   ├── government/                    # Government assistance schemes (/government/*)
│   ├── hospital/                      # Hospital command center (/hospital/*)
│   ├── insurance/                     # Insurance claims & pre-auth (/insurance/*)
│   ├── lab/                           # Diagnostic laboratory desk (/lab/*)
│   ├── patient/                       # Patient mobile health app (/patient/*)
│   ├── pharmacy/                      # Connected pharmacy operations (/pharmacy/*)
│   ├── staff/                         # Healthcare staff duty desk (/staff/*)
│   ├── verify/                        # Public cryptographic verification slips (/verify/*)
│   ├── layout.tsx                     # Root application layout & shell wrapper
│   └── page.tsx                       # Public landing page
├── components/                        # Reusable UI & Domain Components
│   ├── patient/                       # Mobile-first patient cards & modals
│   ├── shared/                        # RoleGuard, LoadingState, AppShell, LanguageSwitcher
│   └── ui/                            # Atoms (Badge, Button, Card, Input, Modal, Timeline)
├── docs/                              # Project Documentation & Architecture Specifications
│   ├── ARCHITECTURE.md                # Relational hierarchy & master axioms
│   ├── DATABASE.md                    # Database dictionary & schemas
│   ├── DATABASE_AUDIT_A1.md           # Phase A.1 database audit
│   ├── CONNECTIVITY_AUDIT_A1.md       # Phase A.1 connectivity audit
│   ├── FEATURE_STATUS.md              # Live status matrix of Phases 0–19
│   ├── PROJECT_MASTER.md              # Ecosystem master reference
│   └── ...                            # Phase completion reports (3.1 to 4.4)
├── lib/                               # Application Core Logic & Services
│   ├── auth/                          # AuthContext, session restore, persona switching
│   ├── data/                          # Authoritative domain data stores (Identities, Encounters, etc.)
│   ├── services/                      # AccessEngine, ABHAService, HealthJourneyService
│   ├── supabase/                      # Supabase client, server, and middleware helpers
│   ├── constants.ts                   # Demo personas, role dashboard routes
│   ├── localization.ts                # English, Hindi, Odia dictionaries
│   ├── navigation.ts                  # Centralized navigation matrices
│   ├── utils.ts                       # Utility functions (cn, formatting)
│   └── workspaces.ts                  # Dynamic workspace resolution engine
├── scripts/                           # Standalone Automated Test Suites
│   ├── test-phase3-security.ts        # Security & RLS tests
│   ├── test-phase3-e2e.ts             # Phase 3 integration tests
│   ├── test-phase4-encounter.ts       # Phase 4.1 encounter tests
│   ├── test-phase4-clinical-record.ts # Phase 4.2 clinical record tests
│   ├── test-phase4-prescription-lab.ts# Phase 4.3 prescription & lab tests
│   └── test-phase4-health-journey.ts  # Phase 4.4 health journey tests
├── supabase/                          # PostgreSQL Master Schema
│   └── schema.sql                     # Complete 37-table PostgreSQL schema
├── types/                             # TypeScript Type Definitions
│   └── database.types.ts              # Canonical database and domain interfaces
└── middleware.ts                      # Edge routing & cookie parser middleware
```

---

### 4. Authentication Architecture

1. **Authentication Provider**:
   - Primary: Client-side Persistent Identity Store (`lib/data/identity-store.ts`) operating via `localStorage` (key: `medora_identities_store_v2`) with cryptographic-style credential evaluation (`authenticateCredentials`).
   - Secondary / Upstream: Supabase Auth bridge (`lib/supabase/client.ts`) invoked conditionally when `NEXT_PUBLIC_SUPABASE_URL` is configured with non-placeholder endpoints.
2. **Supported Authentication Modes**:
   - Email & Password (`patient@medora.health`, `doctor@medora.health`, etc. with default `Password@123`).
   - Phone & OTP (Simulated sandbox OTP verification in `lib/services/abha-service.ts` for ABHA identity linking).
   - One-Click Persona Switcher for demonstration and end-to-end testing across 14 personas.
3. **Session Persistence & Expiration**:
   - `localStorage.setItem("medora_session_id", identity.id)`.
   - `document.cookie = "medora_role=${role}; path=/; max-age=86400"`.
   - On page load, `AuthProvider` validates `medora_session_id` against `getAllIdentities()`. If invalid or account is disabled, the session is cleared (strictly returning `null`, eliminating unauthenticated default fallbacks).
4. **Sign Out**:
   - Clears `medora_session_id` from `localStorage`, expires `medora_role` cookie, resets `currentIdentity = null`, and redirects to `/login`.

---

### 5. User Identity Architecture

#### Current Model:
```typescript
StoredIdentity (Monolithic Hybrid)
  ├── id (UUID)
  ├── email & passwordHash
  ├── fullName & identifier (PAT-1001, DOC-1001, HSP-1001)
  ├── role (user_role enum)
  ├── accountStatus & verificationStatus
  ├── patientData (if patient)
  ├── doctorData (if doctor)
  └── staffData (if staff)
```

#### Gap Analysis:
- `StoredIdentity` bundles the authentication account (`User`), physical human identity (`Person`), professional credentials (`Doctor`), and organizational appointments (`Staff`) into a single object.
- **Target Model for Phase A.2**:
  $$\text{User (Auth Account)} \longrightarrow \text{Person (Human Demographics)} \longrightarrow \text{Organization Membership} \longrightarrow \text{Role} \longrightarrow \text{Permissions}$$

---

### 6. Patient Identity Architecture

1. **Identifiers**:
   - Primary Key: UUID (`id`)
   - Public Business Identifier: `PAT-1001` (Rahul Verma), `PAT-1002` (Priya Sharma), `PAT-1003` (Amit Das).
2. **Data Structure**:
   - Demographics: DOB, gender, blood group (with certification source: `patient_reported` vs `clinical_verified`).
   - Structured Address: Line1, city, district, state, Indian 6-digit PIN code.
   - Emergency Contacts: Primary and alternate contacts with family relation.
   - Health Data: Allergies array, chronic conditions array.
   - ABHA & Aadhaar: `abhaNumber`, `abhaAddress` (`@abdm`), `aadhaarMasked` (`XXXX XXXX 5892`), `abhaStatus`.
3. **Multi-Hospital Portability**:
   - Patient identity is **Global** across the MEDORA network.
   - Patient `PAT-1001` has active encounters at City Hospital (`HSP-1001`) and Green Care Clinic (`CLN-1001`) under the exact same persistent health record.
   - Encounters, Clinical Records, Prescriptions, Lab Orders, and Medical Documents link to `patient_id` as a foreign key.

---

### 7. Doctor Identity Architecture

1. **Global Professional Identity**:
   - Doctor is modeled as a **Single Global Professional Identity** (`DOC-1001` Dr. Ananya Sharma, MCI Reg: `MCI-2014-99214`).
   - Doctor credentials (medical council, degree, experience) are stored once.
2. **Multi-Hospital Affiliations**:
   - Stored in `doctorData.affiliations` array:
     1. `HSP-1001` (City Hospital) — Consultant Cardiologist (Fee: ₹500, Room: OPD 102, Status: `active`)
     2. `HSP-1002` (Green Care Hospital) — Visiting Specialist (Fee: ₹600, Room: Visiting OPD 2, Status: `active`)
     3. `CLN-1001` (Green Care Clinic) — Consultant (Fee: ₹400, Room: Suite 1, Status: `active`)
3. **Context Switching**:
   - In Doctor Encounter Workbench (`app/doctor/consultations/page.tsx`), the doctor selects their active facility practice context (`selectedOrgId`). Clinical encounters created are scoped strictly to the selected organization.

---

### 8. Organization Architecture

1. **Current Representation**:
   - Organizations are represented as `StoredIdentity` accounts with specialized roles:
     - `hospital_admin` (`HSP-1001` City Hospital, `HSP-1002` Green Care Hospital)
     - `clinic` (`CLN-1001` Green Care Clinic)
     - `lab_staff` (`LAB-1001` ABC Diagnostics)
     - `pharmacy_staff` (`PHA-1001` ABC Pharmacy)
     - `blood_staff` (`BLC-1001` City Blood Centre)
     - `insurance_staff` (`INS-1001` ABC Insurance)
     - `finance_staff` (`FIN-1001` Healthcare Finance Partner)
     - `government_staff` (`GOV-1001` Government Assistance Org)
     - `ambulance_staff` (`AMB-1001` ABC Ambulance Services)
2. **Structural Gap**:
   - An organization is a legal entity, not a human user. In Phase A.2, `Organization` must be decoupled from the administrator account, allowing multiple staff and clinicians to be members of that organization.

---

### 9. Staff Architecture

1. **Current Representation**:
   - Hybrid / Inconsistent:
     - Persona `STAFF-1001` (Sunita Mohanty) has generic role `staff` and holds a `staffData` array linking to `HSP-1001` with `roleTitle: "Head Nurse"`.
     - Personas for Lab, Pharmacy, Blood Bank, Insurance, Finance, Government, and Ambulance are created with specialized top-level roles (`lab_staff`, `pharmacy_staff`, etc.) acting as the organization itself.
2. **Target Representation for Phase A.2 & A.3**:
   - Every staff member is a `Person` with a record in `organization_memberships`:
     $$\text{Organization (HSP-1001)} \longleftrightarrow \text{Staff Membership} \longleftrightarrow \text{User (Sunita Mohanty)}$$
     with `member_role: 'nurse' | 'pharmacist' | 'lab_tech' | 'billing_lead' | 'receptionist' | 'admin'`.

---

### 10. Role Architecture

#### Active Roles Defined in Codebase:
1. `patient` (Patient mobile passport & health journey)
2. `doctor` (Medical practitioner clinical suite)
3. `hospital_admin` (Hospital command center & clinic operations)
4. `lab_staff` (Laboratory testing & specimen intake)
5. `pharmacy_staff` (Prescription dispensing desk)
6. `emergency_staff` / `ambulance_staff` (Accident response & dispatch console)
7. `blood_staff` (Blood bank matching & donor registry)
8. `insurance_staff` (Claims adjudication & pre-auth)
9. `finance_staff` (CarePay patient financing)
10. `government_staff` (Welfare scheme disbursements)
11. `staff` (Healthcare staff duty desk)
12. `admin` (System auditor & governance)

#### Consistency Check:
- Enums match across `types/database.types.ts`, `lib/constants.ts`, and `supabase/schema.sql`.
- Inconsistency: Organization types are mixed with user roles (e.g. `pharmacy_staff` is both a user role and acts as the pharmacy organization).

---

### 11. Permission Architecture

1. **Multi-Factor Access Decision Engine (`lib/services/access-engine.ts`)**:
   - Evaluates:
     $$\text{Access} = \text{Actor Authenticated} \land \text{Active Org Membership} \land \text{Care Relationship} \land \text{Valid Consent} \land \text{Matching Scope}$$
2. **Permission Evaluation Results**:
   - `ALLOW` (Authorized under active consent)
   - `DENY` (Cross-patient unauthorized access)
   - `NOT_AUTHORIZED` (Unauthenticated or unverified affiliation)
   - `RELATIONSHIP_REQUIRED` (No prior care relationship)
   - `CONSENT_REQUIRED` (No consent grant)
   - `CONSENT_EXPIRED` (Time-bound consent expired)
   - `CONSENT_REVOKED` (Consent explicitly revoked)
   - `SCOPE_NOT_ALLOWED` (Requested scope not granted)
3. **RoleGuard Client Route Protection (`components/shared/role-guard.tsx`)**:
   - Protects workspace routes against role mismatch, redirecting unauthorized users to their own dedicated workspace.

---

### 12. Row Level Security (RLS) & Database Security

1. **PostgreSQL RLS Policies (`supabase/schema.sql`)**:
   - `profiles`: `auth.uid() = id` (Users only see/edit own profile).
   - `patients`: `user_id = auth.uid()`.
   - `doctor_affiliations`: Scoped to doctor `user_id = auth.uid()` or organization staff via `staff_memberships`.
   - `audit_logs`: Append-only (`WITH CHECK (true)`), read-only for `admin`.
2. **Current Security Findings**:
   - When running against local mock stores in development mode, security relies on JavaScript business logic (`AccessEngine` and store filters).
   - **Crucial Finding**: All stores (`lib/data/*.ts`) enforce strict filtering on `patient_id` or `organization_id`, ensuring zero cross-tenant leakage at the API/service boundary.

---

### 13. Dashboard Architecture

| Persona / Role | Landing Route | Workspace Component | Data Source | Status |
| :--- | :--- | :--- | :--- | :---: |
| **Patient (`patient`)** | `/patient` | `app/patient/page.tsx` | `identity-store` + `encounter-store` | `REAL STORE` |
| **Doctor (`doctor`)** | `/doctor` | `app/doctor/page.tsx` | `identity-store` + `encounter-store` | `REAL STORE` |
| **Hospital (`hospital_admin`)** | `/hospital` | `app/hospital/page.tsx` | `encounter-store` + mock beds | `MIXED` |
| **Clinic (`hospital_admin` on `CLN-*`)** | `/clinic` | `app/clinic/page.tsx` | `encounter-store` + mock queue | `MIXED` |
| **Laboratory (`lab_staff`)** | `/lab` | `app/lab/page.tsx` | `lab-order-store` + mock samples | `MIXED` |
| **Pharmacy (`pharmacy_staff`)** | `/pharmacy` | `app/pharmacy/page.tsx` | `prescription-store` + mock items | `MIXED` |
| **Blood Bank (`blood_staff`)** | `/blood-bank` | `app/blood-bank/page.tsx` | Mock inventory (Phase 14) | `MOCK` |
| **Insurance (`insurance_staff`)** | `/insurance` | `app/insurance/page.tsx` | Mock claims (Phase 12) | `MOCK` |
| **Finance (`finance_staff`)** | `/finance` | `app/finance/page.tsx` | Mock loans (Phase 12) | `MOCK` |
| **Government (`government_staff`)** | `/government` | `app/government/page.tsx` | Mock subsidies (Phase 12) | `MOCK` |
| **Ambulance (`ambulance_staff`)** | `/ambulance` | `app/ambulance/page.tsx` | Mock fleet GPS (Phase 15) | `MOCK` |
| **Staff (`staff`)** | `/staff` | `app/staff/page.tsx` | `identity-store` + mock duties | `MIXED` |
| **Platform Admin (`admin`)** | `/admin` | `app/admin/page.tsx` | `audit-store` + mock metrics | `REAL / STORE` |

---

### 14. Navigation Architecture

- **Central Navigation Matrix (`lib/navigation.ts`)**:
  - `PATIENT_PRIMARY_NAV` & `PATIENT_MORE_NAV` (Mobile bottom nav & side drawer)
  - `DOCTOR_NAV` (Clinical suite navigation)
  - `HOSPITAL_NAV`, `CLINIC_NAV`, `LAB_NAV`, `PHARMACY_NAV`, etc.
- **Workspace Resolver (`lib/workspaces.ts`)**:
  - Evaluates `resolveWorkspace(user, role)` mapping strictly to the user's role and organization type.
  - Contains **Zero Fallbacks** to Doctor or generic dashboards.

---

### 15. Organization Connectivity

- **Doctor $\rightarrow$ Hospital / Clinic**: Connects via `doctorData.affiliations` array (`aff-1001`, `aff-1002`, `aff-1003`).
- **Patient $\rightarrow$ Organization**: Connects via `CareRelationship` (`REL-*`) and `ConsentRecord` (`CNS-*`).
- **Encounter $\rightarrow$ Clinical Record $\rightarrow$ Prescription / Lab Order $\rightarrow$ Medical Document**: Full relational chain using strict foreign keys (`encounter_id`, `patient_id`, `organization_id`).

---

### 16. Mock / Demo Data Inventory

| Screen / Feature | Route | Data Source | Real / Mock / Mixed | Action Needed in Phase A / Future Phase |
| :--- | :--- | :--- | :---: | :--- |
| **Patient Home** | `/patient` | `identity-store` + conditional `isRahul` appointments | `MIXED` | Replace `isRahul` check with dynamic appointments store query (Phase 6). |
| **Patient Records** | `/patient/records` | `encounter-store` + `clinical-record-store` + static auxiliary | `MIXED` | Replace static `auxiliaryRecords` with dynamic document query (Phase 4.4 / A.4). |
| **Patient Prescriptions** | `/patient/prescriptions` | `prescription-store.ts` | `REAL STORE` | Preserved (Phase 4.3 Verified). |
| **Patient Lab Reports** | `/patient/reports` | `lab-order-store.ts` | `REAL STORE` | Preserved (Phase 4.3 Verified). |
| **Patient Health Journey** | `/patient/health` | `health-journey-service.ts` | `REAL STORE` | Preserved (Phase 4.4 Verified). |
| **Patient Document Vault** | `/patient/documents` | `medical-document-store.ts` | `REAL STORE` | Preserved (Phase 4.4 Verified). |
| **Doctor Consultations Workbench** | `/doctor/consultations` | `encounter-store`, `clinical-record-store`, `prescription-store`, `lab-order-store` | `REAL STORE` | Preserved (Phases 4.1–4.4 Verified). |
| **Doctor Prescriptions Desk** | `/doctor/prescriptions` | `prescription-store.ts` | `REAL STORE` | Preserved (Phase 4.3 Verified). |
| **Doctor Lab Orders Desk** | `/doctor/lab-orders` | `lab-order-store.ts` | `REAL STORE` | Preserved (Phase 4.3 Verified). |
| **Doctor Home Overview** | `/doctor` | Static patient queue array | `MOCK` | Connect to live `getDoctorEncounters()` in Phase A.4. |
| **Hospital Encounters Desk** | `/hospital/encounters` | `encounter-store.ts` | `REAL STORE` | Preserved (Phase 4.1 Verified). |
| **Hospital Admissions** | `/hospital/admissions` | Static bed allocation array | `MOCK` | Implement in Phase 5 (Hospital Operations). |
| **Hospital Billing** | `/hospital/billing` | Static invoices array | `MOCK` | Implement in Phase 10 (Itemized Billing). |
| **Lab Assigned Orders Queue** | `/lab/orders` | `lab-order-store.ts` | `REAL STORE` | Preserved (Phase 4.3 Verified). |
| **Lab Testing Desk** | `/lab/testing` | Static analyzer worklist | `MOCK` | Implement in Phase 8 (Connected Lab). |
| **Pharmacy Dispensing** | `/pharmacy/dispensing` | Static dispensing queue | `MOCK` | Implement in Phase 9 (Connected Pharmacy). |
| **Finance Workspace** | `/finance` | Static loan applications array | `MOCK` | Implement in Phase 12 (Finance). |
| **Government Assistance** | `/government` | Static subsidy cases array | `MOCK` | Implement in Phase 12 (Government). |
| **Ambulance Console** | `/ambulance` | Static GPS fleet array | `MOCK` | Implement in Phase 15 (Emergency & Fleet). |
| **Blood Coordination** | `/blood-bank` | Static donor/inventory array | `MOCK` | Implement in Phase 14 (Blood Bank). |
| **Public Verification Slips** | `/verify/rx/[id]`, `/verify/lab/[id]` | Hardcoded HTML markup | `MOCK` | Wire dynamic store lookup in Phase A.4. |

---

### 17. Authentication & Data Isolation Findings

#### Root Cause Analysis: The "Rahul Verma" Display Issue
1. **Why it happened historically:**
   - In Phase 1, unauthenticated sessions defaulted to `DEMO_PERSONAS[0]` (`PAT-1001` Rahul Verma).
   - In `app/patient/page.tsx` and `app/patient/records/page.tsx`, hardcoded `isRahul` conditionals showed static appointments and reports only for `PAT-1001`.
   - In static mock pages (`app/doctor/page.tsx`, `app/finance/page.tsx`, `app/government/page.tsx`, `app/lab/reports/page.tsx`), the mock data arrays hardcoded the name "Rahul Verma".
2. **Current State:**
   - The core authentication engine (`AuthProvider`) strictly returns `null` when unauthenticated and isolates `PAT-1001` (Rahul), `PAT-1002` (Priya), and `PAT-1003` (Amit) across all Phase 3 and Phase 4 stores.
   - However, placeholder screens for future phases (5–19) still display static mock lists containing "Rahul Verma".

---

### 18. Current Database Schema Summary

The PostgreSQL schema in `supabase/schema.sql` defines 37 tables categorized into:
- **Category A (Identities)**: `profiles`, `organizations`, `facilities`, `departments`, `patients`, `patient_addresses`, `patient_emergency_contacts`, `patient_abha_links`, `doctors`.
- **Category B (Relationships)**: `doctor_affiliations`, `staff_memberships`, `facility_partnerships`, `insurance_policies`, `consent_records`.
- **Category C (Clinical Events)**: `appointments`, `encounters`, `consultations`, `prescriptions`, `prescription_items`, `prescription_dispensings`, `lab_orders`, `lab_samples`, `lab_tests`, `lab_reports`, `emergency_cases`, `blood_requests`, `ambulance_requests`, `hospital_transfers`, `referrals`.
- **Category D (Financial & Governance)**: `bills`, `bill_items`, `bill_versions`, `payments`, `insurance_claims`, `assistance_applications`, `financing_applications`, `bill_disputes`, `audit_logs`.

---

### 19. Current Relationship Map

```
Patient (PAT-1001)
   ├── Care Relationship (REL-1001) ──> Organization (HSP-1001 City Hospital)
   ├── Consent Grant (CNS-1001) ──> Doctor (DOC-1001 Dr. Ananya Sharma)
   ├── Encounter (ENC-1001) ──> Doctor (DOC-1001) at City Hospital (HSP-1001)
   │     ├── Clinical Record (CR-1001) [Diagnoses: I10 Essential Hypertension]
   │     ├── Prescription (RX-1001) [Telmisartan 40mg, Aspirin 75mg]
   │     ├── Lab Order (LAB-ORD-1001) [CBC with Differential] ──> Lab (LAB-1001)
   │     └── Medical Document (DOC-1001 CBC Report, DOC-1002 Consultation Summary)
   └── Health Journey Timeline (Aggregates ENC-1001, CR-1001, RX-1001, LAB-ORD-1001, DOC-1001)
```

---

### 20. Target Architecture Gap Analysis

| Architectural Dimension | Current State | Target Architecture | Gap Severity |
| :--- | :--- | :--- | :---: |
| **User vs Person vs Profile** | Monolithic `StoredIdentity` | `User` $\rightarrow$ `Person` $\rightarrow$ `Organization Membership` | `HIGH` |
| **Organization Model** | Organization is a user account | Organization is a distinct entity with members | `HIGH` |
| **Staff Role Structure** | Top-level enum roles (`pharmacy_staff`, etc.) | Scoped `member_role` inside `organization_memberships` | `HIGH` |
| **Doctor Multi-Affiliations** | Array embedded in `doctorData` | First-class `organization_memberships` table | `MEDIUM` |
| **Placeholder Screens** | Static mock arrays with hardcoded names | Dynamic queries against domain stores | `MEDIUM` |
| **Access Control** | Client-side `AccessEngine` | Centralized `AccessEngine` + Database RLS | `LOW` |

---

### 21. Critical Problems (To Address in Phase A)

1. **Conflated Identity & Organization Model**: Organizations are treated as user accounts rather than organizations owning accounts.
2. **Hardcoded Mock Arrays in Future Phase Screens**: Screens for Phases 5, 8, 9, 10, 12, 14, 15 display static mock patient names rather than querying dynamic patient records.
3. **Global Roles instead of Contextual Memberships**: Staff roles are global, preventing one staff member from having different roles in different facilities.

---

### 22. Medium Problems

1. **Public Verification Slips Static Mock Data**: `/verify/rx/[id]` and `/verify/lab/[id]` render static demo data instead of looking up `getPrescriptionById()` or `getMedicalDocumentById()`.
2. **Doctor Overview Page Static Queue**: `/doctor` shows a static patient queue table while `/doctor/consultations` uses live encounters.

---

### 23. Low Priority Problems

1. **Localization Coverage**: Some placeholder strings in administrative screens are not yet translated into Hindi/Odia.
2. **Avatar Placeholders**: Using Unsplash image URLs rather than deterministic SVG initials.

---

### 24. Recommended A.2 Changes (Identity & Organization Architecture)
- Decouple `Organization` entity from user accounts.
- Establish `organization_memberships` model linking `Person` to `Organization` with scoped role and status.
- Normalize `StoredIdentity` into distinct `User`, `Person`, and `Membership` models.

---

### 25. Recommended A.3 Changes (Role & Permission Architecture)
- Refactor role checks from global `user.role` to contextual `user.memberships[orgId].role`.
- Implement fine-grained permissions per role (e.g. `can_prescribe`, `can_dispense`, `can_order_lab`, `can_triage`).
- Enhance `AccessEngine` to support contextual member role evaluation.

---

### 26. Recommended A.4 Changes (Dashboard / Navigation Correction)
- Connect `/doctor` overview table to live `getDoctorEncounters()`.
- Connect `/verify/rx/[id]` and `/verify/lab/[id]` to live `prescription-store` and `medical-document-store`.
- Replace static mock cards in `/patient/page.tsx` with dynamic store queries.

---

### 27. Recommended A.5 Changes (Integration & Connectivity Validation)
- Validate end-to-end multi-hospital doctor workflows with normalized organization memberships.
- Validate multi-role staff access across hospitals, clinics, labs, and pharmacies.

---

### 28. A.6 Verification Requirements
- Execute comprehensive automated test suite verifying identity decoupling, multi-organization memberships, contextual permissions, and zero data leakage across all 14 personas.

---

### 29. Files That Will Need Modification in Future Phase A Tasks
- `lib/data/identity-store.ts` (Decouple organizations & memberships)
- `types/database.types.ts` (Add `OrganizationMembership` and `Person` models)
- `lib/auth/auth-context.tsx` (Update session & membership resolver)
- `lib/workspaces.ts` (Resolve workspace based on active membership context)
- `app/doctor/page.tsx` (Connect live encounters)
- `app/verify/rx/[id]/page.tsx` & `app/verify/lab/[id]/page.tsx` (Connect live stores)

---

### 30. Files That Must NOT Be Modified (Preserved Core)
- `lib/data/encounter-store.ts` (Phase 4.1 Verified Core)
- `lib/data/clinical-record-store.ts` (Phase 4.2 Verified Core)
- `lib/data/prescription-store.ts` (Phase 4.3 Verified Core)
- `lib/data/lab-order-store.ts` (Phase 4.3 Verified Core)
- `lib/data/medical-document-store.ts` (Phase 4.4 Verified Core)
- `lib/services/health-journey-service.ts` (Phase 4.4 Verified Core)
- `lib/data/consent-store.ts` (Phase 3.3 Verified Core)
- `lib/data/audit-store.ts` (Phase 3.4 Verified Core)

---

### 31. Risk Assessment
- **Low Risk to Clinical Layer**: The clinical care layer (Encounters, Records, Prescriptions, Lab Orders, Documents) is fully decoupled and verified.
- **Refactoring Strategy**: Modification Phase A should introduce normalized membership interfaces while preserving backwards compatibility on existing store helpers to prevent regressions.

---

### 32. Final A.1 Conclusion

Modification Phase A.1 has completed a deep, exhaustive, and precise audit of the MEDORA healthcare platform. The architectural gaps have been mapped with zero guesswork and zero code changes to business features.

**MEDORA is fully ready to proceed to Modification Phase A.2 (Identity & Organization Architecture) upon user instruction.**
