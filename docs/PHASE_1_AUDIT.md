# 🔍 MEDORA — Phase 1 Project & Identity Architecture Audit

> **Audit Date:** 2026-08-20  
> **Status:** Completed  
> **Target Scope:** Authentication, Identity Chain, Multi-Organization Architecture, Doctor Multi-Affiliation, Data Isolation & RLS

---

## 1. Current Authentication Flow
The previous authentication flow attempted to use Supabase Auth but relied on a static/fallback persona when running in local development or unauthenticated mode:
- **Flaw:** Unauthenticated sessions defaulted to `DEMO_PERSONAS[0]` (Rahul Verma / `PAT-1001`), leading to persistent state leakage where any logged-in user or unauthenticated state would render Rahul Verma's identity.
- **Remediation:** Strict binding to `auth.uid()` as the authoritative identity anchor. When no session exists, the state is strictly `null` (never a fallback persona).

---

## 2. Current Identity Flow
The required identity flow is:
```
Supabase Auth (JWT / Session)
        ↓
    auth.uid()
        ↓
  public.profiles (email, role, account_status)
        ↓
  Identity Type (Person vs. Organization vs. Platform Admin)
        ↓
  Role-Specific Entity:
    - Person: Patients / Doctors / Staff Memberships
    - Organization: Hospitals / Clinics / Labs / Pharmacies / Blood Banks / Insurance / Financing / Govt / Ambulance
        ↓
  Professional Affiliations & Facilities:
    - Doctors → doctor_affiliations → facilities / organizations
    - Staff → staff_memberships → facilities / organizations
        ↓
  Permissions & Row-Level Security (RLS)
        ↓
  Authorized Data Access
```

---

## 3. Current Database Structure
- **`profiles`:** Base user account table extending `auth.users(id)`.
- **`organizations`:** Healthcare institutions (`hospital`, `clinic`, `diagnostic_lab`, `pharmacy`, `blood_bank`, `insurance`, `financing_partner`, `government_assistance`, `ambulance_provider`).
- **`facilities`:** Physical branches/locations associated with an organization (e.g. City Hospital Group $\rightarrow$ Bhubaneswar, Rourkela, Cuttack branches).
- **`departments`:** Clinical/operational units within an organization or facility.
- **`patients`:** Patient demographics, medical details, ABHA ID, and emergency contacts.
- **`doctors`:** Independent professional registry (MCI registration number, council, specialization).
- **`doctor_affiliations`:** Many-to-many relationship linking a single doctor UUID to multiple hospital/clinic facilities.
- **`staff_memberships`:** Links personnel to organizations with specific role titles, verification states, and departments.
- **`prescriptions`:** Open prescription model tied to patient, prescribing doctor, and encounter organization, with optional/selectable fulfillment pharmacy.
- **`audit_logs`:** Append-only ledger recording all security and access events.

---

## 4. Supported Ecosystem Roles & MEDORA IDs
| Entity Type | Identity Type | Human-Readable ID | Sample Verified Account |
| :--- | :--- | :--- | :--- |
| **Patient A** | Person (`patient`) | `PAT-1001` | Rahul Verma (`patient@medora.health`) |
| **Patient B** | Person (`patient`) | `PAT-1002` | Priya Sharma (`priya@medora.health`) |
| **Patient C** | Person (`patient`) | `PAT-1003` | Amit Das (`amit@medora.health`) |
| **Doctor** | Person (`doctor`) | `DOC-1001` | Dr. Ananya Sharma (`doctor@medora.health`) |
| **Hospital** | Organization (`hospital`) | `HSP-1001` | City Hospital (`hospital@medora.health`) |
| **Clinic** | Organization (`clinic`) | `CLN-1001` | Green Care Clinic (`clinic@medora.health`) |
| **Laboratory** | Organization (`diagnostic_lab`) | `LAB-1001` | ABC Diagnostics (`lab@medora.health`) |
| **Pharmacy** | Organization (`pharmacy`) | `PHA-1001` | ABC Pharmacy (`pharmacy@medora.health`) |
| **Blood Centre** | Organization (`blood_bank`) | `BLC-1001` | City Blood Centre (`bloodbank@medora.health`) |
| **Insurance** | Organization (`insurance`) | `INS-1001` | ABC Insurance (`insurance@medora.health`) |
| **Financing** | Organization (`financing_partner`) | `FIN-1001` | Healthcare Finance Partner (`finance@medora.health`) |
| **Government** | Organization (`government_assistance`) | `GOV-1001` | Government Assistance Org (`government@medora.health`) |
| **Ambulance** | Organization (`ambulance_provider`) | `AMB-1001` | ABC Ambulance Services (`ambulance@medora.health`) |
| **Staff** | Person (`staff`) | `STAFF-1001` | Healthcare Staff Member (`staff@medora.health`) |
| **Platform Admin** | Platform Admin (`admin`) | `ADM-1001` | Medora Admin (`admin@medora.health`) |

---

## 5. Root Cause Analysis: The "Rahul Verma" Bug
1. **Root Cause:** Hardcoded `DEMO_PERSONAS[0]` was used as a fallback initial state in `auth-context.tsx` and UI headers whenever user profiles were resolving.
2. **Resolution:**
   - Eradicated all default fallbacks to `DEMO_PERSONAS[0]`.
   - `useAuth()` evaluates to `null` when unauthenticated.
   - Profile resolution queries strictly against authenticated session UUID.
   - Logout unconditionally purges React state, query caches, `localStorage`, and session cookies.

---

## 6. Doctor Multi-Hospital Architecture
- **Problem:** Conventional EHRs assume a doctor is a sub-entity of a single hospital (`doctors.hospital_id`).
- **Solution:** A doctor is an independent medical practitioner (`doctors.id`). Their work at multiple facilities is modeled through `doctor_affiliations` linking `doctor_id` $\rightarrow$ `organization_id` / `facility_id` with distinct consultation fees, OPD rooms, and role titles (e.g. Consultant at City Hospital vs. Visiting Specialist at Green Care Hospital).

---

## 7. Open Prescription Architecture
- **Problem:** Tying prescriptions directly to the hospital's internal pharmacy restricts patient freedom and breaks independent pharmacy workflows.
- **Solution:** A prescription is created within a clinical encounter (Doctor + Patient + Hospital/Clinic). The fulfillment pharmacy is an independent relation (`fulfillment_pharmacy_id`), allowing patients to fulfill digital prescriptions at in-hospital pharmacies, external retail pharmacies, or online partners.

---

## 8. Row-Level Security (RLS) & IDOR Protection
- RLS enabled across all database tables.
- Patient records are strictly constrained by `user_id = auth.uid()`.
- Tampering with URL parameters (e.g. `patient_id=PAT-1002` while authenticated as `PAT-1001`) is denied at the database and API layers.
