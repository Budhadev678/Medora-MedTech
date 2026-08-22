# 🖥️ MEDORA — MODIFICATION PHASE A.4: DASHBOARD, WORKSPACE & NAVIGATION ARCHITECTURE
## Contextual Workspace Resolution, Mobile Patient App Experience & Multi-Organization Scoping

**Phase:** Modification Track A.4  
**Status:** `BUILT` & `VERIFIED`  
**Git Head Reference:** `main` (All 37/37 A.4 navigation assertions and 261+ full regression assertions passing)  
**Parent Dependencies:** Phase A.1 (Audit), Phase A.2 (Identity & Organization Architecture), Phase A.3 (Role, Permission & Authorization Architecture)

---

### 1. A.4 Objectives

1. **Contextual Workspace Resolution:**
   $$\text{AUTH USER} \longrightarrow \text{IDENTITY} \longrightarrow \text{MEMBERSHIPS} \longrightarrow \text{ACTIVE ORG CONTEXT} \longrightarrow \text{ACTIVE ROLE} \longrightarrow \text{AUTHORIZED WORKSPACE} \longrightarrow \text{NAVIGATION}$$
2. **Mobile-First Patient Experience:** Pure mobile application UX (Home, Appointments, Health, More) without enterprise admin clutter or raw database terminology.
3. **Role-Specific Provider Workspaces:** Dedicated operational interfaces for Doctors, Receptionists, Nurses, Hospital Admins, Clinic Admins, Lab Technicians, Pharmacists, and Blood Centre Staff.
4. **Elimination of Generic Staff Dashboard:** Structured staff into specific clinical and front-desk desks (`Reception Workspace`, `Nursing Workspace`).
5. **Disambiguation of External Services:** Insurance, Government Welfare, Treatment Financing, and Emergency Transit are accessed as patient-facing services (`More` $\rightarrow$ `Insurance & Benefits`, `Government Schemes`, `Financial Support`, `Emergency / SOS`), NOT as generic operational hospital sidebars.
6. **Multi-Organization Context Switching:** Clean organization switcher in the header for practitioners with multiple appointments (e.g. Dr. Ananya across City Hospital, Green Care Hospital, and Green Care Clinic). Reloads organization data with zero stale leakage and enforces Phase A.3 authorization boundaries.
7. **Production Aesthetic:** Clean, calm, trustworthy healthcare design system without AI-generated neon gradients or 3D cards.

---

### 2. Before Architecture vs. After Architecture

| Aspect | Before (A.1 – A.2 Audit State) | After (Phase A.4 Corrected Architecture) |
| :--- | :--- | :--- |
| **Workspace Trigger** | Derived solely from flat `user.role === 'doctor'` | Resolved from `Identity` + `Active Membership` + `Contextual Role` |
| **Patient Experience** | Desktop-like portal with mixed cards | Pure Mobile-First app with 4-tab bottom navigation (`Home`, `Appointments`, `Health`, `More`) |
| **Staff Workspace** | Single generic "Staff Dashboard" | Role-specific: `Reception Workspace` (`/reception`) & `Nursing Workspace` (`/nurse`) |
| **Multi-Hospital Practice** | Ambiguous active hospital context | Explicit `OrganizationSwitcher` showing active facility, department, and consultation fee |
| **External Services** | Treated as ordinary internal dashboards | Patient-facing welfare & financing service pages (`/patient/insurance`, `/patient/government`, `/patient/finance`) |
| **Organization Switching** | Client-side visual toggle | Backend-verified against active memberships with immediate data re-scoping |
| **Unauthorized Access** | Blank white screens or errors | Professional `Access Restricted` shield with return-to-workspace action |

---

### 3. Patient Workspace & Navigation

- **Landing Route:** `/patient`
- **Bottom Navigation (4 Core Destinations):**
  1. `Home` (`/patient`): Greeting, Digital Health ID Passport, Upcoming Appointment Card, Recent Health Activity, Quick Action Pills (`Appointments`, `Health`, `Prescriptions`, `Reports`), Emergency SOS badge.
  2. `Appointments` (`/patient/appointments`): Upcoming OPD visits, past consultations, book new appointment.
  3. `Health` (`/patient/health`): Unified Health Journey timeline, vitals history, care advice.
  4. `More` (Modal Drawer): Full access to certified Documents Vault (`/patient/documents`), Digital Prescriptions (`/patient/prescriptions`), Diagnostic Lab Reports (`/patient/reports`), Itemized Bills (`/patient/bills`), Insurance Coverage (`/patient/insurance`), Government Schemes (`/patient/government`), CarePay Financing (`/patient/finance`), Profile & ABHA (`/patient/profile`), Privacy & Consents (`/patient/privacy`), and Emergency SOS (`/patient/emergency`).

---

### 4. Doctor Clinical Workspace

- **Landing Route:** `/doctor`
- **Header Context:** Active Organization Banner (e.g. `City Hospital (HSP-1001) • Department of Cardiology • Consultant Cardiologist`) with integrated `OrganizationSwitcher`.
- **Navigation:**
  - `Today / Queue` (`/doctor`): Active queue count, next patient in line, duty status controller (`Available`, `In Consultation`, `On Call`, `Emergency`).
  - `Consultation Workbench` (`/doctor/consultations`): Active encounter management, SOAP clinical notes, diagnosis entry.
  - `Patient Registry` (`/doctor/patients`): Longitudinal patient records within active care relationships.
  - `Appointments` (`/doctor/appointments`): OPD booking schedule.
  - `Prescriptions` (`/doctor/prescriptions`): Digital e-prescription generation and uncancelled Rx review.
  - `Lab Orders` (`/doctor/lab-orders`): Diagnostic test order placement and verified report review.
  - `Schedule & Hours` (`/doctor/schedule`): Multi-hospital OPD time slots.
  - `Referrals` (`/doctor/referrals`): Inter-specialist and inter-hospital referrals.
  - `Doctor Profile` (`/doctor/profile`): Professional credentials and council registration.

---

### 5. Receptionist Workspace

- **Landing Route:** `/reception`
- **Focus:** Patient flow, front-desk intake, queue dispatch, OPD token issuance, and demographic registration.
- **Navigation:**
  - `Today's Queue` (`/reception`)
  - `Appointments` (`/reception/appointments`)
  - `Patient Check-in` (`/reception/checkin`)
  - `Patient Registration` (`/reception/patients`)
  - `OPD Billing` (`/reception/billing`)
  - `Staff Profile` (`/staff/profile`)
- **Security Boundary:** Strictly blocked from clinical diagnosis, vital entry, and prescription creation (`PERMISSION_DENIED`).

---

### 6. Nursing Care Workspace

- **Landing Route:** `/nurse`
- **Focus:** Inpatient ward monitoring, vital signs recording (BP, SpO2, Temp, HR), medication administration rounds, and clinical care tasks.
- **Navigation:**
  - `Shift Overview` (`/nurse`)
  - `Assigned Inpatients` (`/staff/patients`)
  - `Vitals & Nursing Tasks` (`/staff/tasks`)
  - `Ward Schedule` (`/staff/schedule`)
  - `Staff Profile` (`/staff/profile`)
- **Security Boundary:** Strictly blocked from doctor prescribing and billing modifications.

---

### 7. Hospital Command Center & Clinic Operations

- **Hospital Command Center (`/hospital`):** Facility-level operations including departments, medical staff roster, bed admissions, emergency trauma desk, hospital lab, hospital pharmacy, billing, and facility settings.
- **Clinic Operations (`/clinic`):** Tailored for day-care outpatient clinics (OPD queue, visiting doctors, appointment slots, outpatient receipts).

---

### 8. Laboratory & Pharmacy Workspaces

- **Laboratory Diagnostic Workbench (`/lab`):** Sample intake (barcode scan), test queue, diagnostic testing, pathologist verification, and certified report release.
- **Pharmacy Dispensing Desk (`/pharmacy`):** Verified prescription intake, order preparation, patient pickup verification, dispensing confirmation, and medication inventory.

---

### 9. Platform Administration Workspace

- **Landing Route:** `/admin`
- **Focus:** Medora ecosystem governance, facility onboarding verification, platform user accounts, and immutable append-only audit stream. Completely isolated from hospital accounts.

---

### 10. Multi-Organization Context Switching

- Built into [`components/shared/organization-switcher.tsx`](file:///c:/Users/Dell/Downloads/Medora-MedTech/components/shared/organization-switcher.tsx).
- When a clinician switches context:
  1. Calls `setActiveMembershipId(targetMemId)`.
  2. Evaluates membership status (must be `ACTIVE`; `REVOKED` or `SUSPENDED` are rejected).
  3. Re-scopes the active organization identifier (`HSP-1001` $\rightarrow$ `CLN-1001`).
  4. Recalculates workspace permissions via `AuthorizationEngine`.
  5. Dispatches `medora-organization-switched` event to trigger re-fetching of scoped records with zero cross-hospital stale data.

---

### 11. Empty, Loading, Error & Unauthorized States

- **Empty States:** Components use [`components/ui/empty-state.tsx`](file:///c:/Users/Dell/Downloads/Medora-MedTech/components/ui/empty-state.tsx) with human-readable guidance on next actions.
- **Loading States:** Skeletons and spinners in [`components/shared/loading-state.tsx`](file:///c:/Users/Dell/Downloads/Medora-MedTech/components/shared/loading-state.tsx).
- **Unauthorized States:** [`components/shared/role-guard.tsx`](file:///c:/Users/Dell/Downloads/Medora-MedTech/components/shared/role-guard.tsx) displays an `Access Restricted` shield with a one-click button to return to the user's authorized workspace.

---

### 12. Verification & Automated Test Results

Standalone test suite [`scripts/test-phase-a4-navigation.ts`](file:///c:/Users/Dell/Downloads/Medora-MedTech/scripts/test-phase-a4-navigation.ts) verified 37/37 assertions across 10 test suites:
- **Test 1 (Patient Mobile Workspace & Nav):** ✅ PASSED (`patient_mobile`, 3 bottom tabs, More drawer services)
- **Test 2 (Doctor Workspace & Multi-Org Context):** ✅ PASSED (`doctor_clinical`, consultations workbench, no external clutter)
- **Test 3 (Receptionist Workspace):** ✅ PASSED (`reception_workspace`, `/reception`, check-in tools, clinical creation blocked)
- **Test 4 (Nursing Workspace):** ✅ PASSED (`nursing_workspace`, `/nurse`, inpatient tasks, prescribing blocked)
- **Test 5 (Multi-Role User Isolation):** ✅ PASSED (Rahul Doctor at City Hospital vs Admin at Green Care Clinic isolated)
- **Test 6 (Hospital & Clinic Workspaces):** ✅ PASSED (`hospital_command` & `clinic_operations`)
- **Test 7 (Laboratory & Pharmacy Workspaces):** ✅ PASSED (`laboratory_workbench` & `pharmacy_operations`)
- **Test 8 (Blood Centre & Platform Admin):** ✅ PASSED (`blood_coordination` & `platform_admin`)
- **Test 9 (Security Boundary & Route Protection):** ✅ PASSED (Patient, Receptionist, Hospital Admin bounds enforced)
- **Test 10 (Multi-Org Switch Authorization):** ✅ PASSED (Authorized switch allowed; unauthorized/revoked blocked)
- **Total:** **37/37 Assertions Passed (100%)**.
