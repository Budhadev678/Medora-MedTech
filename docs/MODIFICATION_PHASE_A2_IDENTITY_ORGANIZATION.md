# 🏛️ MEDORA — MODIFICATION PHASE A.2: IDENTITY & ORGANIZATION MEMBERSHIP ARCHITECTURE
## Structural Normalization, Many-to-Many Memberships & Identity Sovereignty

**Phase:** Modification Track A.2  
**Status:** `BUILT` & `VERIFIED`  
**Git Head Reference:** `main` (All 224 automated assertions passing)  
**Parent Dependency:** Phase A.1 Architecture Audit

---

### 1. Problem Before A.2

In the previous Phase 1–4 implementation:
- **Identity Conflation:** A single monolithic `StoredIdentity` object held authentication credentials, personal identity, professional clinical credentials, organizational legal identity, and staff appointments all in one entity.
- **Organization-as-User Paradigm:** Healthcare organizations (Hospitals, Clinics, Diagnostic Labs, Pharmacies, Blood Banks) were modeled as individual user accounts with administrative role tags rather than independent legal entities that contain member users.
- **Global Roles vs Contextual Memberships:** Roles were stored as a single global property on the user profile (`user.role = "doctor"` or `"pharmacy_staff"`). This prevented a doctor or healthcare worker from having different designations, fees, schedules, and permissions in different hospitals, or working across multiple facilities under a clean single authentication account.
- **Identity Leakage Residue:** Hardcoded checks like `isRahul` in patient views led to visual confusion when switching across distinct patient personas (`PAT-1001` vs `PAT-1002`).

---

### 2. Architecture Before Modification

```
StoredIdentity (Monolithic Entity)
   ├── id (UUID) & email & passwordHash
   ├── fullName & identifier (PAT-1001, DOC-1001, HSP-1001)
   ├── role (user_role enum)
   ├── organizationName & organizationType
   ├── patientData (if patient)
   ├── doctorData (if doctor, holding embedded affiliations array)
   └── staffData (if staff, holding embedded staff memberships array)
```

---

### 3. Target Implemented Architecture (Phase A.2)

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

---

### 4. User Identity (`UserAccount`)

- Represents the authoritative authentication account (`auth.users.id`).
- Attributes: `id` (UUID), `email`, `phone`, `account_status` (`active`, `pending`, `suspended`, `disabled`), `created_at`, `last_login_at`.
- Contains **Zero Organization Data**: An authentication account never changes its email or identity simply because the person practices in a new hospital.

---

### 5. Person Identity (`PersonProfile`)

- Represents the physical human being (`PER-*`).
- Attributes: `id`, `user_id` (FK), `full_name`, `email`, `phone`, `gender`, `dob`, `avatar_url`, `verification_status`.
- Connects 1:1 with the `UserAccount`.

---

### 6. Patient Identity (`PatientProfile`)

- Represents a sovereign citizen health identity (`PAT-1001`, `PAT-1002`, `PAT-1003`).
- Attributes: `dob`, `gender`, `blood_group` (`patient_reported` vs `clinical_verified`), `allergies`, `chronic_conditions`, structured address (with 6-digit Indian PIN code), emergency contacts, ABHA credentials (`@abdm` handle, 14-digit number, masked Aadhaar).
- **Patient Sovereignty**: A patient is never locked to any single hospital. Their encounters (`ENC-*`), prescriptions (`RX-*`), and documents (`DOC-*`) link across multiple hospitals under one persistent health journey.

---

### 7. Professional Profile (`ProfessionalProfile`)

- Represents the professional credentials of a healthcare practitioner (`DOC-*`, `PRO-*`).
- Attributes: `medical_reg_no` (e.g. `MCI-2014-99214`), `medical_council`, `specialization`, `qualifications`, `experience_years`, `verification_status`.
- Stores information that belongs to the professional globally, not per-hospital.

---

### 8. Organization Identity (`OrganizationEntity`)

- Represents an independent legal healthcare institution (`organizations` table / `SEEDED_ORGANIZATIONS`).
- Core Categories:
  - `hospital` (`HSP-1001` City Hospital, `HSP-1002` Green Care Hospital)
  - `clinic` (`CLN-1001` Green Care Clinic)
  - `diagnostic_lab` (`LAB-1001` ABC Diagnostics)
  - `pharmacy` (`PHA-1001` ABC Pharmacy)
  - `blood_bank` (`BLC-1001` City Blood Centre)
  - `insurance` (`INS-1001` ABC Insurance)
  - `financing_partner` (`FIN-1001` Healthcare Finance Partner)
  - `government_assistance` (`GOV-1001` Government Assistance Org)
  - `ambulance_provider` (`AMB-1001` ABC Ambulance Services)
- Attributes: `id` (UUID), `medora_id` (Stable business ID), `name`, `type`, `license_no`, `address`, `city`, `phone`, `emergency_phone`, `status`, `verification_status`.

---

### 9. Organization Membership (`OrganizationMembership`)

- First-class join entity (`organization_memberships` table / `SEEDED_MEMBERSHIPS`).
- Unique Membership Identifier: `MEM-1001`, `MEM-1002`, `MEM-1003`, etc.
- Attributes:
  - `id`: Unique primary key (`MEM-*`)
  - `person_id`: FK $\rightarrow$ `PersonProfile.id`
  - `user_id`: FK $\rightarrow$ `UserAccount.id`
  - `organization_id` & `organization_identifier`: Link to legal organization
  - `facility_id` & `facility_name`: Optional physical campus link
  - `department_name`: Clinical department (e.g. "Department of Cardiology")
  - `role_title`: Contextual title (e.g. "Consultant Cardiologist", "Visiting Specialist", "Head Nurse", "Receptionist")
  - `member_role`: Contextual role enum (`doctor`, `hospital_admin`, `staff`, etc.)
  - `employment_type`: `full_time`, `part_time`, `consultant`, `visiting`, `contract`
  - `consultation_fee`: Contextual consultation fee (e.g. ₹500 at City Hospital vs ₹600 at Green Care Hospital)
  - `opd_room`: Contextual room designation (e.g. "OPD Room 102")
  - `schedule_notes`: Contextual hours (e.g. "Mon, Wed, Fri 09:00 AM - 01:00 PM")
  - `status`: `INVITED`, `PENDING`, `ACTIVE`, `SUSPENDED`, `REVOKED`
  - `start_date`, `end_date`, `revocation_reason`, `revoked_at`

---

### 10. Multi-Organization Models Verified in Code

#### Case A: One Doctor $\longrightarrow$ Multiple Hospitals
- **Dr. Ananya Sharma (`DOC-1001`)**:
  - `MEM-1001`: City Hospital (`HSP-1001`) — Consultant Cardiologist (Fee: ₹500, Room: OPD 102)
  - `MEM-1002`: Green Care Hospital (`HSP-1002`) — Visiting Specialist (Fee: ₹600, Room: Visiting OPD 2)
  - `MEM-1003`: Green Care Clinic (`CLN-1001`) — Consultant (Fee: ₹400, Room: Clinic Suite 1)
  - **Result:** Exactly 1 User ID (`b0000001-...`), 1 Doctor Profile, 3 Memberships. Zero duplicate user accounts.

#### Case B: One Staff Member $\longrightarrow$ Multiple Organizations
- **Anita (`PER-STAFF-1002`)**:
  - `MEM-5001`: City Hospital (`HSP-1001`) — Receptionist
  - `MEM-5002`: Green Care Clinic (`CLN-1001`) — Receptionist
  - **Result:** Exactly 1 User ID (`k0000001-...`), 2 Memberships.

#### Case C: Same Person $\longrightarrow$ Different Roles in Different Organizations
- **Rahul Multi-Role (`PER-MULTI-1001`)**:
  - `MEM-6001`: City Hospital (`HSP-1001`) — Junior Resident (`member_role: "doctor"`)
  - `MEM-6002`: Green Care Clinic (`CLN-1001`) — Clinic Administrator (`member_role: "hospital_admin"`)
  - **Result:** Exactly 1 User ID (`m0000001-...`), 2 Memberships with distinct contextual roles.

---

### 11. Membership Lifecycle Management

```
INVITED ──(Accept)──> ACTIVE ──(Suspend)──> SUSPENDED ──(Re-activate)──> ACTIVE
                         │
                      (Revoke)
                         ↓
                      REVOKED
```

- `inviteUserToOrganization(...)`: Issues an `INVITED` membership referencing an existing `user_id` and `person_id`.
- `acceptMembership(...)`: Transitions status to `ACTIVE` and records `start_date`.
- `suspendMembership(...)`: Temporarily restricts practice context while keeping history intact.
- `revokeMembership(...)`: Records `status: "REVOKED"`, `revocation_reason`, `revoked_at`, and `end_date`.

---

### 12. Historical Record Preservation Guarantee

When a membership is `REVOKED`:
- The doctor or staff member can no longer initiate new active clinical encounters in that organization.
- All historical encounters (`ENC-1001`), clinical records (`CR-1001`), prescriptions (`RX-1001`), lab orders (`LAB-ORD-1001`), and audit logs (`AUD-1001`) retain their immutable foreign key references to the practitioner, patient, and organization.
- The practitioner is never renamed to "Unknown" and no records are deleted.

---

### 13. Elimination of Identity Leakage

- In `app/patient/page.tsx` and `app/patient/records/page.tsx`, hardcoded `isRahul` conditionals were completely replaced with dynamic queries against authoritative stores (`encounter-store`, `prescription-store`, `medical-document-store`).
- When `PAT-1002` (Priya Sharma) or any new patient logs in, their dashboard dynamically renders only their own clinical visits and prescriptions.
- If a patient lookup fails, the application displays a clean empty/incomplete-profile state with zero fallback to demo accounts.

---

### 14. Automated Test Results (11/11 Passing)

The standalone test suite `scripts/test-phase-a2-identity.ts` verified all 11 requirements:
- **TEST 1 (Patient Identity Isolation):** 7/7 assertions passed.
- **TEST 2 (One Doctor, One Org):** 4/4 assertions passed.
- **TEST 3 (One Doctor, Multiple Orgs):** 6/6 assertions passed.
- **TEST 4 (Staff Multi-Org):** 5/5 assertions passed.
- **TEST 5 (Same Person, Different Roles):** 4/4 assertions passed.
- **TEST 6 (Revoked Membership Lifecycle):** 5/5 assertions passed.
- **TEST 7 (New Org Creation & Stable IDs):** 2/2 assertions passed.
- **TEST 8 (Existing User Joins Org - No Duplicate Auth):** 3/3 assertions passed.
- **TEST 9 (Missing Profile Zero Fallback):** 2/2 assertions passed.
- **TEST 10 (Data Persistence Across Sessions):** 2/2 assertions passed.
- **TEST 11 (Historical Data Integrity):** 3/3 assertions passed.
- **Total Test Suite:** 43/43 assertions passed (100% pass rate).

---

### 15. Known Limitations & Dependencies for Phase A.3

1. **Permission Enforcement:** Phase A.2 established the `OrganizationMembership` data model and role context. Fine-grained contextual permission evaluation (e.g. `can_prescribe`, `can_dispense`, `can_adjudicate_claims`) will be implemented in **Modification Phase A.3 (Role & Permission Architecture)**.
2. **Dashboard Organization Switcher:** Phase A.2 provided `activeMembership` and `setActiveMembershipId` in `AuthContext`. Full workspace navigation polish and multi-membership switcher UX belongs to **Modification Phase A.4 (Dashboard & Navigation Correction)**.
