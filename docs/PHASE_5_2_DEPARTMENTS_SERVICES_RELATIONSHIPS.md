# MEDORA — PHASE 5.2 SPECIFICATION
## DEPARTMENTS, SERVICES, DOCTOR & STAFF RELATIONSHIPS

---

## 1. Executive Summary

Phase 5.2 establishes the operational clinical structure within each physical healthcare facility. It answers the fundamental operational questions:
- **WHO** works here? (Doctor and Staff affiliations)
- **WHERE** do they work? (Facility and Clinical Department)
- **IN WHAT CAPACITY?** (Role designation, head of unit, consultation fee, OPD chamber)
- **WHAT services** does this facility provide? (Healthcare Services Catalog — consultations, diagnostics, imaging, emergency, procedures)
- **WHICH doctor provides which service?** (Doctor Service Capability Assignments)
- **WHICH staff belongs to which department?** (Staff Affiliations)

---

## 2. Relational Hierarchy & Invariants

```
FACILITY (FAC-1001)
  ├── DEPARTMENT (DEP-1001: Cardiology & Cath Lab)
  │     ├── HEALTHCARE SERVICES (SRV-1001: OPD Consult, SRV-1002: ECG, SRV-1003: Echo)
  │     ├── AFFILIATED DOCTOR (DOC-1001: Dr. Ananya Sharma - Consultant Cardiologist)
  │     └── AFFILIATED STAFF (STAFF-1002: Anita - Receptionist)
  └── FACILITY-WIDE SERVICES (SRV-1004: Emergency Triage)
```

### Core Invariants:
1. **Facility-Scoped Departments**: Department names are unique within a facility (`facility_id + name`). Two facilities (e.g. `FAC-1001` and `FAC-2001`) can both have a "Cardiology" unit without identifier collision.
2. **Unified Doctor Identity Across Multi-Facility Affiliations**: Doctor `DOC-1001` maintains a single identity and profile. They can hold active affiliations at `FAC-1001` (Cardiology), `FAC-1004` (Cardiovascular Outpatient Suite), and `FAC-2001` (Visiting Specialty) with facility-specific consultation rates and chambers.
3. **Explicit Service Capability Assignment**: Services can be mapped to specific doctors at a facility, powering OPD booking, appointment generation, and encounter billing.
4. **Soft Deactivation & Historical Record Preservation**: Deactivating a department or service, or ending a doctor/staff affiliation, sets `status: INACTIVE` or `ENDED` with timestamps. Historical appointments (Phase 6 / B.1), clinical encounters (C.1), prescriptions (C.2), lab reports (C.3), and continuous longitudinal records (C.4) remain completely intact and immutable.

---

## 3. Data Model

### HealthcareDepartment
| Field | Type | Description |
|---|---|---|
| `id` | `string` (`DEP-xxxx`) | Primary Key |
| `facility_id` | `string` | Foreign Key to `HealthcareFacility` |
| `facility_name` | `string` | Denormalized facility display name |
| `organization_id` | `string` | Foreign Key to parent `HealthcareOrganization` |
| `name` | `string` | Department title (e.g. "Cardiology & Cath Lab") |
| `code` | `string` | Short department code (e.g. `CARD`) |
| `description` | `string` | Scope and clinical services summary |
| `head_doctor_id` | `string` | Practitioner ID of Department Head (e.g. `DOC-1001`) |
| `head_doctor_name` | `string` | Name of Department Head |
| `status` | `HealthcareDepartmentStatus` | `ACTIVE`, `INACTIVE` |

### HealthcareService
| Field | Type | Description |
|---|---|---|
| `id` | `string` (`SRV-xxxx`) | Primary Key |
| `facility_id` | `string` | Foreign Key to `HealthcareFacility` |
| `department_id` | `string \| null` | Nullable FK: null indicates facility-wide service |
| `department_name` | `string` | Department name |
| `name` | `string` | Service display name |
| `code` | `string` | Short service code (e.g. `CARD-ECG`) |
| `category` | `HealthcareServiceCategory` | `CONSULTATION`, `DIAGNOSTIC`, `IMAGING`, `PROCEDURE`, `THERAPY`, `EMERGENCY`, `OTHER` |
| `duration_minutes` | `number` | Typical duration |
| `base_price` | `number` | Transparent base charge in INR (₹) |
| `status` | `HealthcareServiceStatus` | `ACTIVE`, `INACTIVE` |

### HealthcareDoctorAffiliation
| Field | Type | Description |
|---|---|---|
| `id` | `string` (`AFF-DOC-xxxx`) | Primary Key |
| `doctor_id` | `string` | Unified Practitioner ID (e.g. `DOC-1001`) |
| `doctor_name` | `string` | Practitioner full name |
| `specialization` | `string` | Medical specialty |
| `facility_id` | `string` | Affiliated Facility code |
| `department_id` | `string` | Optional assigned department |
| `role_title` | `string` | Designation at this facility |
| `consultation_fee` | `number` | OPD consultation fee at this facility |
| `opd_room` | `string` | Consultation chamber |
| `status` | `string` | `ACTIVE`, `PENDING`, `REJECTED`, `SUSPENDED`, `ENDED` |

### HealthcareDoctorServiceAssignment
| Field | Type | Description |
|---|---|---|
| `id` | `string` (`DSA-xxxx`) | Primary Key |
| `doctor_id` | `string` | Practitioner ID |
| `facility_id` | `string` | Facility code |
| `service_id` | `string` | Service ID |
| `service_name` | `string` | Service name |
| `status` | `string` | `ACTIVE`, `INACTIVE` |

---

## 4. UI Workspaces
- `/hospital/departments`: Department management, doctors/services count, and department onboarding.
- `/hospital/services`: Healthcare service catalog, category filters, and doctor assignment modal.
- `/hospital/doctors`: Medical staff roster, affiliation request review (approve/reject), invite doctor modal, and assigned services badges.
- `/hospital/staff`: Operational staff personnel roster, role category assignments, and staff onboarding modal.
- `/clinic`: Outpatient clinic workspace with real department and service metrics.

---

## 5. Automated Verification
- Suite: `scripts/test-phase-5-2-departments-services.ts`
- Result: **31 / 31 Assertions Passing (100%)**
