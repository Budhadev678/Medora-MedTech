# 🗄️ MEDORA — Database Audit Report (Phase A.1)
## Current Database Architecture, Schemas, Relationships & RLS Evaluation

---

### 1. Database Overview & Technology Stack
- **Database Engine:** PostgreSQL 15+ (via Supabase) / Client-side In-Memory LocalStorage Domain Stores (`lib/data/*.ts`)
- **Primary Keys:** UUID (`uuid_generate_v4()`) with human-readable public business identifiers (`PAT-1001`, `DOC-1001`, `HSP-1001`, `ENC-1001`, `CR-1001`, `RX-1001`, `LAB-ORD-1001`, `DOC-1001`, `CNS-1001`, `AUD-1001`).
- **Master Schema Source:** [`supabase/schema.sql`](file:///c:/Users/Dell/Downloads/Medora-MedTech/supabase/schema.sql) (37 relational tables, 6 custom ENUM types, 17 RLS policies).

---

### 2. Comprehensive Table Directory & Audit

| Table / Collection | Primary Key | Important Foreign Keys | Purpose & Scope | RLS Status | Runtime State (Real / Mock / Store) | Problems / Gaps for Phase A |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| **`public.profiles`** | `id UUID` | `auth.users(id)` | Base profile for all accounts (role, status, full name, email, phone). | `ENABLED` | LocalStorage `SEEDED_IDENTITIES` + Supabase Auth | Role is currently a single global column on profile rather than dynamic per organization membership. |
| **`public.organizations`** | `id UUID` | None | Legal entities (`hospital`, `clinic`, `diagnostic_lab`, `pharmacy`, `blood_bank`, `insurance`, `financing_partner`, `government_assistance`, `ambulance_provider`). | `ENABLED` | LocalStorage `identity-store.ts` | Organizations are currently represented as user accounts with admin roles instead of decoupled legal entity records with members. |
| **`public.facilities`** | `id UUID` | `organization_id -> organizations.id` | Physical hospital campuses & clinic branches (`HSP-1001-BBSR`, etc.). | `ENABLED` | LocalStorage `SEEDED_FACILITIES` | Works well for hospital branches, but standalone clinics and labs need standardized facility resolution. |
| **`public.departments`** | `id UUID` | `organization_id`, `facility_id` | Clinical departments (Cardiology, OPD, Surgery). | `ENABLED` | Schema defined | Hardcoded in mock stores; needs dynamic linking. |
| **`public.patients`** | `id UUID` | `user_id -> profiles.id` | Patient health record, blood group, allergies, chronic conditions, emergency contact. | `ENABLED` | LocalStorage `SEEDED_IDENTITIES` (`patientData`) | Patient identity is global across MEDORA (correct), but demographic updates are partially embedded in user objects. |
| **`public.patient_addresses`** | `id UUID` | `patient_id -> patients.id` | Structured address (line1, city, district, state, pincode). | `ENABLED` | Schema + `identity-store.ts` | Embedded in `patientData.address` in client store; needs normalized table sync. |
| **`public.patient_emergency_contacts`** | `id UUID` | `patient_id -> patients.id` | Primary/alternate emergency contacts with relation. | `ENABLED` | Schema + `identity-store.ts` | Embedded in `patientData.emergencyContact`. |
| **`public.patient_abha_links`** | `id UUID` | `patient_id -> patients.id` | ABHA number, ABHA address (`@abdm`), status, masked Aadhaar. | `ENABLED` | Schema + `abha-service.ts` | Controlled sandbox verification state works well; needs full table normalization. |
| **`public.doctors`** | `id UUID` | `user_id -> profiles.id` | Doctor registration number, council, specialization, degree, experience. | `ENABLED` | LocalStorage `SEEDED_IDENTITIES` (`doctorData`) | Doctor is correctly a single global professional identity (`DOC-1001`). |
| **`public.doctor_affiliations`** | `id UUID` | `doctor_id`, `organization_id`, `facility_id` | Doctor appointments, OPD rooms, fees, schedule notes across multiple hospitals. | `ENABLED` | LocalStorage `StoredDoctorAffiliation[]` | Supports 1 doctor $\rightarrow$ N hospitals/clinics (`Dr. Ananya` at `HSP-1001`, `HSP-1002`, `CLN-1001`). |
| **`public.staff_memberships`** | `id UUID` | `user_id`, `organization_id`, `facility_id` | Healthcare staff appointments to hospitals, clinics, labs, pharmacies. | `ENABLED` | LocalStorage `StoredStaffMembership[]` | Currently mixed: specialized staff have global roles (`lab_staff`, `pharmacy_staff`) instead of `member_role` inside organization membership. |
| **`public.facility_partnerships`** | `id UUID` | `hospital_facility_id`, `partner_organization_id` | Hospital network partnerships (internal/external lab, pharmacy, blood). | `ENABLED` | Schema defined | Hardcoded in mock desks; needs formal relationship store. |
| **`public.insurance_policies`** | `id UUID` | `patient_id`, `insurance_organization_id` | Patient insurance policies and coverage amounts. | `ENABLED` | Mock UI / Schema | Mock data on UI; needs normalization. |
| **`public.consent_records`** | `id UUID` | `patient_id`, `grantee_id` | Purpose-bound, time-bound medical record access grants. | `ENABLED` | LocalStorage `consent-store.ts` (`CNS-*`) | Fully operational with `AccessEngine` integration. |
| **`public.care_relationships`** | `id UUID` | `patient_id`, `organization_id` | Patient ↔ Provider & Patient ↔ Organization relationships. | `ENABLED` | LocalStorage `relationship-store.ts` (`REL-*`) | Fully operational with `AccessEngine` integration. |
| **`public.identity_corrections`** | `id UUID` | `patient_id`, `reviewed_by` | Patient profile field modification request pipeline. | `ENABLED` | LocalStorage `correction-store.ts` (`COR-*`) | Fully operational with audit logging. |
| **`public.appointments`** | `id UUID` | `patient_id`, `doctor_id`, `facility_id` | Consultations with token queue numbers. | `ENABLED` | Mock UI (Phase 6 scope) | Currently static UI in patient/doctor/hospital appointment pages. |
| **`public.encounters`** | `id UUID` | `patient_id`, `doctor_id`, `facility_id`, `appointment_id` | Central healthcare interaction (`ENC-*`). | `ENABLED` | LocalStorage `encounter-store.ts` | Fully operational with state machine (`ACTIVE` $\rightarrow$ `COMPLETED`). |
| **`public.consultations` / `clinical_records`** | `id UUID` | `encounter_id`, `patient_id`, `doctor_id` | Symptoms, vitals, assessment, diagnoses (ICD-10), treatment plan (`CR-*`). | `ENABLED` | LocalStorage `clinical-record-store.ts` | Fully operational with versioning ($1 \rightarrow 2$) and amendment audit. |
| **`public.prescriptions`** | `id UUID` | `patient_id`, `doctor_id`, `encounter_id`, `encounter_organization_id` | Digital prescriptions (`RX-*`). | `ENABLED` | LocalStorage `prescription-store.ts` | Fully operational with open pharmacy fulfillment. |
| **`public.prescription_items`** | `id UUID` | `prescription_id` | Structured medicines, dosages, frequencies, instructions. | `ENABLED` | Embedded in `prescription-store.ts` | Fully operational. |
| **`public.prescription_dispensings`** | `id UUID` | `prescription_id`, `pharmacy_organization_id` | Pharmacy dispensing fulfillment logs. | `ENABLED` | Schema / Mock UI (Phase 9 scope) | Mock UI on `/pharmacy/dispensing`. |
| **`public.lab_orders`** | `id UUID` | `patient_id`, `doctor_id`, `encounter_id`, `target_laboratory_id` | Diagnostic orders (`LAB-ORD-*`). | `ENABLED` | LocalStorage `lab-order-store.ts` | Fully operational with priority & clinical indications. |
| **`public.lab_samples`** | `id UUID` | `lab_order_id`, `collected_by` | Specimen accessioning and collection. | `ENABLED` | Schema / Mock UI (Phase 8 scope) | Mock UI on `/lab/samples`. |
| **`public.lab_tests`** | `id UUID` | `lab_order_id` | Test parameters, observed values, flags. | `ENABLED` | Schema / Mock UI (Phase 8 scope) | Mock UI on `/lab/testing`. |
| **`public.lab_reports` / `medical_documents`** | `id UUID` | `lab_order_id`, `patient_id`, `laboratory_id` | Certified lab reports & clinical documents (`DOC-*`). | `ENABLED` | LocalStorage `medical-document-store.ts` | Fully operational with SHA-256 hashes & 15MB limit. |
| **`public.emergency_cases`** | `id UUID` | `facility_id`, `patient_id`, `assigned_doctor_id` | Emergency triage, trauma management (`ER-*`). | `ENABLED` | Mock UI (Phase 13 scope) | Mock UI on `/hospital/emergency`. |
| **`public.blood_requests`** | `id UUID` | `hospital_id`, `target_blood_centre_id` | Emergency blood requests and matching (`BLD-REQ-*`). | `ENABLED` | Mock UI (Phase 14 scope) | Mock UI on `/blood-bank`. |
| **`public.ambulance_requests`** | `id UUID` | `destination_facility_id`, `ambulance_org_id` | Emergency dispatch and GPS ETA (`AMB-REQ-*`). | `ENABLED` | Mock UI (Phase 15 scope) | Mock UI on `/ambulance`. |
| **`public.hospital_transfers`** | `id UUID` | `patient_id`, `origin_facility_id`, `destination_facility_id` | Inter-hospital transfers with clinical summary. | `ENABLED` | Mock UI (Phase 13 scope) | Mock UI on `/hospital/transfers`. |
| **`public.referrals`** | `id UUID` | `patient_id`, `referring_doctor_id`, `target_doctor_id` | Specialist cross-referrals. | `ENABLED` | Mock UI (Phase 7 scope) | Mock UI on `/doctor/referrals`. |
| **`public.bills`** | `id UUID` | `patient_id`, `facility_id`, `encounter_id` | Itemized bills with gross/insurance/subsidy splits (`BIL-*`). | `ENABLED` | Mock UI (Phase 10 scope) | Mock UI on `/hospital/billing` and `/patient/bills`. |
| **`public.bill_items`** | `id UUID` | `bill_id`, `linked_event_id` | Line items with clinical event lineage. | `ENABLED` | Mock UI (Phase 10 scope) | Mock UI on `/patient/bills`. |
| **`public.bill_versions`** | `id UUID` | `bill_id`, `modified_by` | Immutable financial version history. | `ENABLED` | Schema / Mock UI (Phase 10 scope) | Schema defined. |
| **`public.payments`** | `id UUID` | `bill_id`, `patient_id` | Payment receipts (`RCP-*`). | `ENABLED` | Mock UI (Phase 10 scope) | Mock UI on `/patient/bills`. |
| **`public.insurance_claims`** | `id UUID` | `policy_id`, `bill_id`, `patient_id`, `facility_id` | Cashless claims & pre-authorizations (`CLM-*`). | `ENABLED` | Mock UI (Phase 12 scope) | Mock UI on `/insurance/claims`. |
| **`public.assistance_applications`** | `id UUID` | `patient_id`, `bill_id` | Government healthcare subsidy applications (`GOV-APP-*`). | `ENABLED` | Mock UI (Phase 12 scope) | Mock UI on `/government/applications`. |
| **`public.financing_applications`** | `id UUID` | `patient_id`, `bill_id`, `financing_org_id` | CarePay micro-financing EMI plans (`FIN-APP-*`). | `ENABLED` | Mock UI (Phase 12 scope) | Mock UI on `/finance/applications`. |
| **`public.bill_disputes`** | `id UUID` | `bill_id`, `patient_id` | Patient bill item dispute records (`DSP-*`). | `ENABLED` | Mock UI (Phase 10 scope) | Mock UI on `/patient/bills`. |
| **`public.audit_logs`** | `id UUID` | `actor_id -> profiles.id` | Append-only ledger of critical system events (`AUD-*`). | `ENABLED` | LocalStorage `audit-store.ts` + SQL | Fully operational with credential redaction. |

---

### 3. Row Level Security (RLS) Evaluation

1. **Profiles:** `Users can read own profile` and `Users can update own profile` enforced via `auth.uid() = id`.
2. **Patients:** `Patients can view own medical identity` enforced via `user_id = auth.uid()`.
3. **Doctors & Affiliations:** Doctors can view their own affiliations via `user_id = auth.uid()`; hospital staff can manage facility affiliations via `staff_memberships`.
4. **Audit Logs:** Append-only (`WITH CHECK (true)` for inserts, `SELECT` restricted to admin role).
5. **Runtime Client Stores:** In local development mode without live Supabase credentials, isolation is enforced in JavaScript via `AccessEngine.evaluateAccess()`, `findIdentityById()`, and store patient filters.

---

### 4. Identified Database Gaps for Phase A
1. **Organization Representation:** Legal organizations are currently represented as user profiles (`StoredIdentity` with `organizationType`) rather than independent organization entities with distinct membership records.
2. **Staff Role Model:** Staff roles are currently global enum values (`lab_staff`, `pharmacy_staff`, `blood_staff`, etc.) rather than an organization membership record with a scoped role (`organization_memberships` table).
3. **Hardcoded Mock Pages:** Screens for Phases 5–19 (billing, insurance claims, emergency dispatch, appointments) render static mock arrays instead of querying relational database tables.
