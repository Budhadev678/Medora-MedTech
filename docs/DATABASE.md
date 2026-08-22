# 🗄️ MEDORA — Comprehensive Database Schema & Data Dictionary

## 1. Complete Relational Table Directory

### Category A — Identities
| Table Name | Primary Key | Foreign Key References | Description |
| :--- | :--- | :--- | :--- |
| **`profiles`** | `id UUID` | `auth.users(id)` | Base profile for all accounts with role and status. |
| **`organizations`** | `id UUID` | None | Legal entities (`hospital`, `clinic`, `lab`, `pharmacy`, `blood_bank`, `insurance`, `finance`, `government`, `ambulance`). |
| **`facilities`** | `id UUID` | `organization_id` | Physical hospital campuses / clinic branches. |
| **`departments`** | `id UUID` | `organization_id`, `facility_id` | Clinical & operational hospital departments. |
| **`patients`** | `id UUID` | `user_id -> profiles.id` | Patient health record, ABHA link, emergency contacts. |
| **`patient_addresses`** | `id UUID` | `patient_id -> patients.id` | Structured residential address (line1, city, district, state, pincode). |
| **`patient_emergency_contacts`** | `id UUID` | `patient_id -> patients.id` | Emergency contacts with relation, priority, and phone numbers. |
| **`patient_abha_links`** | `id UUID` | `patient_id -> patients.id` | ABHA number, ABHA handle, verification source, masked Aadhaar, and link state. |
| **`doctors`** | `id UUID` | `user_id -> profiles.id` | Medical practitioner credentials and registration. |

---

### Category B — Relationships & Memberships
| Table Name | Primary Key | Foreign Key References | Description |
| :--- | :--- | :--- | :--- |
| **`organization_memberships`** | `id UUID` / `medora_membership_id` | `user_id`, `organization_id`, `facility_id`, `department_id` | Normalized many-to-many join entity connecting persons to healthcare organizations with scoped role title, fees, room, and lifecycle status (`ACTIVE`, `REVOKED`, etc.). |
| **`doctor_affiliations`** | `id UUID` | `doctor_id`, `organization_id`, `facility_id` | Doctor appointments, OPD rooms, fees, and schedule notes. |
| **`staff_memberships`** | `id UUID` | `user_id`, `organization_id`, `facility_id` | Healthcare staff appointments. |
| **`facility_partnerships`**| `id UUID` | `hospital_facility_id`, `partner_organization_id` | Hospital network connections (internal/external lab, pharmacy, blood). |
| **`insurance_policies`** | `id UUID` | `patient_id`, `insurance_organization_id` | Patient insurance policies and coverage amounts. |
| **`consent_records`** | `id UUID` | `patient_id`, `grantee_id -> profiles.id` | Scoped, time-bound patient medical record access grants. |

---

### Category C — Healthcare Events & Transactions
| Table Name | Primary Key | Foreign Key References | Description |
| :--- | :--- | :--- | :--- |
| **`appointments`** | `id UUID` | `patient_id`, `doctor_id`, `facility_id`, `session_id` | Scheduled clinic/OPD consultations with sequential capacity token numbers and booking preference metadata. |
| **`doctor_working_sessions`** | `id UUID` | `doctor_id`, `facility_id`, `department_id` | Configured clinician operational working sessions with day-of-week, time windows, and patient capacity limits. |
| **`queue_entries`** | `id UUID` | `appointment_id`, `patient_id`, `doctor_id`, `facility_id`, `session_id` | Real-time check-in records with deterministic tokens (`C-01`, `R-02`), sequential queue order, and consultation lifecycle states. |
| **`appointment_waitlists`** | `id UUID` | `patient_id`, `doctor_id`, `facility_id`, `session_id` | Unmet patient demand queue with automatic slot offer notification and 2-hour explicit acceptance window. |
| **`schedule_overrides`** | `id UUID` | `doctor_id`, `facility_id` | Date-specific doctor leave (`DOCTOR_LEAVE`), facility closures (`FACILITY_CLOSURE`), and capacity adjustments (`CAPACITY_OVERRIDE`). |
| **`encounters`** | `id UUID` | `patient_id`, `doctor_id`, `facility_id`, `appointment_id` | Clinical encounters (`scheduled`, `walk_in`, `emergency`, `referral`). |
| **`consultations`** | `id UUID` | `encounter_id`, `patient_id`, `doctor_id`, `facility_id` | Clinical notes, vitals, primary/secondary diagnosis, treatment plan. |
| **`prescriptions`** | `id UUID` | `patient_id`, `doctor_id`, `encounter_id`, `encounter_organization_id` | Digital prescriptions with verifiable signature hashes. |
| **`prescription_items`**| `id UUID` | `prescription_id` | Individual medicines, dosages, frequencies, and durations. |
| **`prescription_dispensings`**| `id UUID`| `prescription_id`, `pharmacy_organization_id` | Prescription dispensing fulfillment records. |
| **`lab_orders`** | `id UUID` | `patient_id`, `doctor_id`, `encounter_id`, `target_laboratory_id` | Diagnostic investigation orders. |
| **`lab_samples`** | `id UUID` | `lab_order_id`, `collected_by_staff_id` | Specimen collection and chain of custody tracking. |
| **`lab_tests`** | `id UUID` | `lab_order_id` | Diagnostic test parameters, observed values, reference ranges, flags. |
| **`lab_reports`** | `id UUID` | `lab_order_id`, `patient_id`, `laboratory_id` | Certified pathology reports with pathologist signature. |
| **`emergency_cases`** | `id UUID` | `facility_id`, `patient_id`, `assigned_doctor_id` | Emergency triage, resuscitation, and trauma tracking. |
| **`blood_requests`** | `id UUID` | `hospital_id`, `emergency_case_id`, `target_blood_centre_id` | Emergency blood units requested, urgency, and allocation. |
| **`ambulance_requests`**| `id UUID` | `emergency_case_id`, `destination_facility_id`, `ambulance_organization_id` | Emergency dispatch, GPS ETA, and hospital transit. |
| **`hospital_transfers`**| `id UUID` | `patient_id`, `origin_facility_id`, `destination_facility_id` | Inter-hospital transfers with clinical handover summary. |
| **`referrals`** | `id UUID` | `patient_id`, `referring_doctor_id`, `target_doctor_id` | Specialist cross-referral tracking. |

---

### Category D — Financial & Governance Events
| Table Name | Primary Key | Foreign Key References | Description |
| :--- | :--- | :--- | :--- |
| **`bills`** | `id UUID` | `patient_id`, `facility_id`, `encounter_id` | Transparent, itemized hospital bill. |
| **`bill_items`** | `id UUID` | `bill_id`, `linked_event_id` | Individual charges with lineage back to clinical events. |
| **`bill_versions`** | `id UUID` | `bill_id`, `modified_by_staff_id` | Immutable audit version history of bill modifications. |
| **`payments`** | `id UUID` | `bill_id`, `patient_id` | Multi-mode settlement receipts (UPI, Card, Insurance, Cash). |
| **`insurance_claims`** | `id UUID` | `policy_id`, `bill_id`, `patient_id`, `facility_id` | Insurance pre-authorizations and claim settlements. |
| **`assistance_applications`** | `id UUID` | `patient_id`, `bill_id` | State/National healthcare subsidy applications (BSKY, PM-JAY). |
| **`financing_applications`** | `id UUID` | `patient_id`, `bill_id`, `financing_partner_org_id` | CarePay treatment micro-financing & EMI agreements. |
| **`bill_disputes`** | `id UUID` | `bill_id`, `patient_id` | Patient bill item dispute review and resolution. |
| **`emergency_access_logs`** | `id UUID` / `medora_access_id` | `actor_id -> profiles.id`, `patient_id`, `organization_id` | Break-glass emergency access logs with mandatory clinical justification and 4-hour expiry. |
| **`audit_logs`** | `id UUID` | `actor_id -> profiles.id` | Append-only ledger of critical system events (Hard deletion prohibited). |

---

## 2. Phase 3.1 & 3.2 Patient Identity & ABHA Data Architecture

```sql
-- Phase 3.1: Structured Patient Profile
CREATE TABLE patient_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode VARCHAR(6) NOT NULL,
  country VARCHAR(50) DEFAULT 'India',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE patient_emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relation VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  alt_phone VARCHAR(20),
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 3.2: ABHA Linking & Identity Verification
CREATE TABLE patient_abha_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID UNIQUE NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  abha_number VARCHAR(20) NOT NULL, -- e.g. 91-4589-2041-5892
  abha_address VARCHAR(50) NOT NULL, -- e.g. rahulverma@abdm
  link_status VARCHAR(30) NOT NULL DEFAULT 'LINKED',
  verification_status VARCHAR(30) NOT NULL DEFAULT 'verified',
  verification_source VARCHAR(30) NOT NULL DEFAULT 'SANDBOX', -- 'ABDM' | 'SANDBOX'
  aadhaar_masked VARCHAR(20), -- e.g. XXXX XXXX 5892
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  unlinked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 9. Connected Diagnostic Laboratory Engine (Phase C.3)

### `healthcare_lab_orders` (Doctor-Authored Diagnostic Requests)
```sql
CREATE TABLE healthcare_lab_orders (
  id VARCHAR(64) PRIMARY KEY, -- LAB-ORD-xxxx
  order_reference VARCHAR(64) UNIQUE NOT NULL,
  patient_id VARCHAR(64) NOT NULL REFERENCES patients(id),
  patient_name VARCHAR(255) NOT NULL,
  encounter_id VARCHAR(64) NOT NULL REFERENCES healthcare_encounters(id),
  clinical_record_id VARCHAR(64),
  ordering_provider_id VARCHAR(64) NOT NULL,
  ordering_provider_name VARCHAR(255) NOT NULL,
  ordering_provider_role VARCHAR(128) NOT NULL,
  organization_id VARCHAR(64) NOT NULL,
  organization_name VARCHAR(255) NOT NULL,
  facility_id VARCHAR(64),
  facility_name VARCHAR(255),
  department_name VARCHAR(128),
  laboratory_id VARCHAR(64),
  laboratory_name VARCHAR(255),
  priority VARCHAR(32) NOT NULL DEFAULT 'ROUTINE', -- ROUTINE, URGENT, STAT
  reason TEXT NOT NULL,
  instructions TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'DRAFT', -- DRAFT, ORDERED, ACCEPTED, SAMPLE_COLLECTED, PROCESSING, VERIFICATION_PENDING, REPORT_READY, RELEASED, CANCELLED, REJECTED
  rejection_reason TEXT,
  items JSONB NOT NULL, -- Array of LabOrderItem
  ordered_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `healthcare_lab_samples` (Physical Specimen Custody)
```sql
CREATE TABLE healthcare_lab_samples (
  id VARCHAR(64) PRIMARY KEY, -- SMP-xxxx
  lab_order_id VARCHAR(64) NOT NULL REFERENCES healthcare_lab_orders(id),
  patient_id VARCHAR(64) NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  sample_type VARCHAR(64) NOT NULL, -- WHOLE_BLOOD, SERUM, PLASMA, URINE, STOOL, SPUTUM, CSF, TISSUE_BIOPSY, SWAB, OTHER
  sample_barcode VARCHAR(64) UNIQUE NOT NULL,
  test_item_ids JSONB NOT NULL,
  test_names JSONB NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ORDERED', -- ORDERED, COLLECTED, RECEIVED, PROCESSING, COMPLETED, REJECTED
  collected_at TIMESTAMPTZ,
  collected_by_id VARCHAR(64),
  collected_by_name VARCHAR(255),
  received_at TIMESTAMPTZ,
  received_by_id VARCHAR(64),
  received_by_name VARCHAR(255),
  rejected_at TIMESTAMPTZ,
  rejected_by_id VARCHAR(64),
  rejected_by_name VARCHAR(255),
  rejection_reason VARCHAR(64), -- HEMOLYZED, INSUFFICIENT_VOLUME, CONTAINER_DAMAGED, INCORRECT_CONTAINER, CLOTTED, MISLABELED, TEMPERATURE_BREACH, OTHER
  rejection_notes TEXT,
  is_recollection BOOLEAN DEFAULT FALSE,
  previous_sample_id VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `healthcare_test_results` (Structured Analyte Outcomes)
```sql
CREATE TABLE healthcare_test_results (
  id VARCHAR(64) PRIMARY KEY, -- RES-xxxx
  lab_order_id VARCHAR(64) NOT NULL REFERENCES healthcare_lab_orders(id),
  sample_id VARCHAR(64) NOT NULL REFERENCES healthcare_lab_samples(id),
  test_id VARCHAR(64) NOT NULL,
  test_name VARCHAR(255) NOT NULL,
  parameter_id VARCHAR(64) NOT NULL,
  parameter_name VARCHAR(255) NOT NULL,
  result_type VARCHAR(32) NOT NULL, -- NUMERIC, TEXT, QUALITATIVE
  value TEXT NOT NULL,
  numeric_value NUMERIC,
  unit VARCHAR(64),
  reference_range VARCHAR(128),
  flag VARCHAR(32) NOT NULL DEFAULT 'NORMAL', -- NORMAL, HIGH, LOW, ABNORMAL, CRITICAL
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING, ENTERED, VERIFIED, AMENDED
  version INTEGER DEFAULT 1,
  version_history JSONB DEFAULT '[]',
  entered_by_id VARCHAR(64),
  entered_by_name VARCHAR(255),
  entered_at TIMESTAMPTZ,
  verified_by_id VARCHAR(64),
  verified_by_name VARCHAR(255),
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `healthcare_lab_reports` (Certified Diagnostic Reports)
```sql
CREATE TABLE healthcare_lab_reports (
  id VARCHAR(64) PRIMARY KEY, -- RPT-xxxx
  report_reference VARCHAR(64) UNIQUE NOT NULL,
  lab_order_id VARCHAR(64) NOT NULL REFERENCES healthcare_lab_orders(id),
  encounter_id VARCHAR(64) NOT NULL REFERENCES healthcare_encounters(id),
  clinical_record_id VARCHAR(64),
  patient_id VARCHAR(64) NOT NULL REFERENCES patients(id),
  patient_name VARCHAR(255) NOT NULL,
  ordering_provider_id VARCHAR(64) NOT NULL,
  ordering_provider_name VARCHAR(255) NOT NULL,
  ordering_provider_role VARCHAR(128) NOT NULL,
  organization_id VARCHAR(64) NOT NULL,
  organization_name VARCHAR(255) NOT NULL,
  laboratory_id VARCHAR(64) NOT NULL,
  laboratory_name VARCHAR(255) NOT NULL,
  sample_ids JSONB NOT NULL,
  results JSONB NOT NULL, -- Array of HealthcareTestResult
  status VARCHAR(32) NOT NULL DEFAULT 'DRAFT', -- DRAFT, PRELIMINARY, RELEASED, AMENDED, CANCELLED
  version INTEGER DEFAULT 1,
  version_history JSONB DEFAULT '[]',
  verified_by_id VARCHAR(64),
  verified_by_name VARCHAR(255),
  verified_at TIMESTAMPTZ,
  released_by_id VARCHAR(64),
  released_by_name VARCHAR(255),
  released_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Category E — Dynamic Clinical Continuity & Timeline Projections (Phase C.4)

### `TimelineEvent` (Virtual Projection — Zero Duplication)
Dynamic lightweight indexing layer that resolves real-time pointers back to canonical records across Encounters, Clinical Records, Prescriptions, Lab Orders, Samples, Lab Reports, Medical Orders, and Documents.

```typescript
export interface TimelineEvent {
  id: string; // Dynamic composite e.g. "tle-enc-1001", "tle-rx-1001", "tle-rpt-1001"
  patient_id: string; // Mandatory patient isolation key
  event_type: TimelineEventType; // ENCOUNTER, PRESCRIPTION, LAB_ORDER, SAMPLE, LAB_REPORT, etc.
  source_type?: TimelineSourceType; // Canonical authoritative entity
  source_id?: string; // Foreign key back to source entity primary key
  reference_id: string; // Canonical human-readable reference (e.g. ENC-1001, PRX-1001)
  encounter_id?: string; // Optional parent encounter link
  title: string;
  summary: string;
  status: string; // Canonical status
  occurred_at: string; // Authoritative clinical timestamp for chronological sorting
  section?: "UPCOMING" | "TODAY" | "PAST";
  organization_name?: string;
  organization_id?: string;
  facility_name?: string;
  facility_id?: string;
  department_name?: string;
  professional_name?: string;
  professional_id?: string;
  professional_role?: string;
  deep_link: string;
  is_verified?: boolean;
  metadata?: Record<string, any>;
}
```

### `EncounterClinicalBundle` (Encounter Aggregation Projection)
```typescript
export interface EncounterClinicalBundle {
  encounter: HealthcareEncounter;
  clinical_record?: ClinicalRecord | null;
  linked_appointment?: Appointment | null;
  prescriptions: HealthcarePrescription[];
  lab_orders: HealthcareLabOrder[];
  samples: HealthcareLabSample[];
  lab_reports: HealthcareLabReport[];
  medical_orders: HealthcareMedicalOrder[];
  medical_documents: HealthcareMedicalDocument[];
  occurred_at: string;
  status: string;
  doctor_name: string;
  organization_name: string;
  facility_name: string;
  department_name?: string;
}
```

---

## Category F: Healthcare Organization, Facility, Department & Service Foundation (Phase 5.1 & 5.2)

### `HealthcareOrganization`
Authoritative parent legal organization entity managing physical hospital branches and clinical networks.
```typescript
export interface HealthcareOrganization {
  id: string; // UUID primary key
  identifier: string; // e.g. ORG-1001, HSP-1001
  name: string;
  legal_name?: string;
  type: HealthcareOrganizationType | string;
  license_no: string;
  phone: string;
  email?: string;
  website?: string;
  address: string;
  city: string;
  district?: string;
  state: string;
  postal_code?: string;
  country: string;
  status: HealthcareFacilityStatus | AccountStatus | string;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at?: string;
}
```

### `HealthcareFacility`
Physical hospital campus, day clinic, diagnostic center, or pharmacy outlet operating under a parent organization.
```typescript
export interface HealthcareFacility {
  id: string; // UUID or fac-* primary key
  facility_code: string; // e.g. FAC-1001, HSP-1001-BBSR
  organization_id: string; // FK -> HealthcareOrganization.id or identifier
  organization_identifier?: string;
  organization_name?: string;
  name: string;
  type: HealthcareFacilityType | string;
  license_no?: string;
  phone: string;
  email?: string;
  emergency_phone?: string;
  website?: string;
  address: string;
  city: string;
  district?: string;
  state: string;
  postal_code: string;
  country: string;
  latitude?: number;
  longitude?: number;
  operating_hours?: string;
  status: HealthcareFacilityStatus | AccountStatus | string;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at?: string;
}
```

### `HealthcareDepartment`
Specialized clinical or operational department scoped to a specific facility campus.
```typescript
export interface HealthcareDepartment {
  id: string; // e.g. DEP-1001
  facility_id: string; // FK -> HealthcareFacility.id / facility_code
  facility_name?: string;
  organization_id?: string;
  name: string; // e.g. "Cardiology & Cath Lab"
  code: string; // e.g. "CARD"
  description?: string;
  head_doctor_id?: string; // DOC-1001
  head_doctor_name?: string;
  status: HealthcareDepartmentStatus;
  created_at: string;
  updated_at?: string;
}
```

### `HealthcareService`
Medical services, diagnostic procedures, consultations, and imaging offerings catalog.
```typescript
export interface HealthcareService {
  id: string; // e.g. SRV-1001
  facility_id: string; // FK -> HealthcareFacility.id
  facility_name?: string;
  department_id?: string | null; // null = facility-level service
  department_name?: string;
  name: string;
  code: string;
  category: HealthcareServiceCategory;
  description?: string;
  duration_minutes?: number;
  base_price?: number;
  status: HealthcareServiceStatus;
  created_at: string;
  updated_at?: string;
}
```

### `HealthcareDoctorAffiliation`
Verified appointment privileges connecting a doctor to a specific facility and department.
```typescript
export interface HealthcareDoctorAffiliation {
  id: string; // e.g. AFF-DOC-1001
  doctor_id: string; // User ID / DOC-1001
  doctor_name: string;
  specialization?: string;
  medical_reg_no?: string;
  organization_id: string;
  organization_name?: string;
  facility_id: string; // FAC-1001
  facility_name?: string;
  department_id?: string;
  department_name?: string;
  role_title: string;
  consultation_fee?: number;
  opd_room?: string;
  schedule_notes?: string;
  status: "ACTIVE" | "PENDING" | "REJECTED" | "SUSPENDED" | "ENDED";
  verification_status: VerificationStatus;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at?: string;
}
```

### `HealthcareStaffAffiliation`
Operational personnel appointments (reception, nursing, lab technician, billing) at a facility campus.
```typescript
export interface HealthcareStaffAffiliation {
  id: string; // e.g. AFF-STAFF-1001
  user_id: string; // User ID / STAFF-1001
  staff_name: string;
  email?: string;
  phone?: string;
  organization_id: string;
  organization_name?: string;
  facility_id: string; // FAC-1001
  facility_name?: string;
  department_id?: string;
  department_name?: string;
  role_title: string;
  staff_role: string;
  status: "ACTIVE" | "PENDING" | "SUSPENDED" | "ENDED";
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at?: string;
}
```

### `HealthcareDoctorServiceAssignment`
Mapping between an affiliated doctor and the specific services they are authorized to perform.
```typescript
export interface HealthcareDoctorServiceAssignment {
  id: string; // e.g. DSA-1001
  doctor_id: string;
  doctor_name: string;
  facility_id: string;
  department_id?: string;
  service_id: string;
  service_name: string;
  status: "ACTIVE" | "INACTIVE";
  created_at: string;
  updated_at?: string;
}
```


