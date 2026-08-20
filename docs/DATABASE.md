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
| **`doctors`** | `id UUID` | `user_id -> profiles.id` | Medical practitioner credentials and registration. |

---

### Category B — Relationships
| Table Name | Primary Key | Foreign Key References | Description |
| :--- | :--- | :--- | :--- |
| **`doctor_affiliations`** | `id UUID` | `doctor_id`, `organization_id`, `facility_id` | Doctor appointments, OPD rooms, fees, and schedule notes. |
| **`staff_memberships`** | `id UUID` | `user_id`, `organization_id`, `facility_id` | Healthcare staff appointments. |
| **`facility_partnerships`**| `id UUID` | `hospital_facility_id`, `partner_organization_id` | Hospital network connections (internal/external lab, pharmacy, blood). |
| **`insurance_policies`** | `id UUID` | `patient_id`, `insurance_organization_id` | Patient insurance policies and coverage amounts. |
| **`consent_records`** | `id UUID` | `patient_id`, `grantee_id -> profiles.id` | Scoped, time-bound patient medical record access grants. |

---

### Category C — Healthcare Events & Transactions
| Table Name | Primary Key | Foreign Key References | Description |
| :--- | :--- | :--- | :--- |
| **`appointments`** | `id UUID` | `patient_id`, `doctor_id`, `facility_id` | Scheduled clinic/OPD consultations with queue token numbers. |
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
| **`audit_logs`** | `id UUID` | `actor_id -> profiles.id` | Append-only ledger of critical system events. |
