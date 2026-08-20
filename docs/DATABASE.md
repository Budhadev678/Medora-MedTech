# 🗄️ MEDORA — Database Schema & Data Dictionary

## 1. Core Schema Overview

All tables are interconnected with relational foreign keys to guarantee end-to-end traceability from appointment to billing and audit.

---

## 2. Table Definitions

### 1. `profiles` & `roles`
* `id` (UUID, PK, references `auth.users`)
* `full_name` (TEXT)
* `email` (TEXT)
* `phone` (TEXT)
* `role` (ENUM: `patient`, `doctor`, `hospital_admin`, `lab_staff`, `pharmacy_staff`, `emergency_staff`, `blood_staff`, `finance_staff`, `admin`)
* `avatar_url` (TEXT)
* `created_at` (TIMESTAMPTZ)

### 2. `patients`
* `id` (UUID, PK)
* `user_id` (UUID, FK -> `profiles.id`)
* `medora_id` (TEXT, Unique, e.g. `MED-PAT-1001`)
* `abha_id` (TEXT, Simulated ABHA Address)
* `aadhaar_last4` (TEXT)
* `dob` (DATE)
* `gender` (TEXT)
* `blood_group` (TEXT)
* `allergies` (TEXT[])
* `chronic_conditions` (TEXT[])
* `emergency_contact_name` (TEXT)
* `emergency_contact_phone` (TEXT)

### 3. `hospitals` & `departments`
* `hospitals`: `id`, `name`, `license_no`, `address`, `city`, `phone`, `emergency_phone`, `type` (`hospital`, `clinic`, `diagnostic_center`)
* `departments`: `id`, `hospital_id` (FK), `name` (e.g. `Cardiology`, `Pathology`, `Orthopedics`, `Emergency`), `head_doctor_id` (FK)

### 4. `doctors`
* `id` (UUID, PK)
* `user_id` (UUID, FK -> `profiles.id`)
* `hospital_id` (UUID, FK -> `hospitals.id`)
* `department_id` (UUID, FK -> `departments.id`)
* `specialization` (TEXT)
* `qualification` (TEXT)
* `consultation_fee` (NUMERIC)
* `status` (ENUM: `available`, `busy`, `on_call`, `emergency_occupied`, `off_duty`)

### 5. `appointments` & `consultations`
* `appointments`: `id`, `patient_id` (FK), `doctor_id` (FK), `hospital_id` (FK), `department_id` (FK), `scheduled_at` (TIMESTAMPTZ), `token_number` (INT), `status` (`booked`, `waiting`, `in_consultation`, `completed`, `cancelled`)
* `consultations`: `id`, `appointment_id` (FK), `patient_id` (FK), `doctor_id` (FK), `symptoms` (TEXT), `clinical_diagnosis` (TEXT), `notes` (TEXT), `follow_up_date` (DATE), `follow_up_instructions` (TEXT), `created_at` (TIMESTAMPTZ)

### 6. `prescriptions` & `prescription_items`
* `prescriptions`: `id`, `prescription_no` (TEXT, Unique, e.g. `RX-1001`), `consultation_id` (FK), `patient_id` (FK), `doctor_id` (FK), `hospital_id` (FK), `status` (`active`, `dispensed`, `cancelled`), `created_at` (TIMESTAMPTZ)
* `prescription_items`: `id`, `prescription_id` (FK), `medicine_name` (TEXT), `strength` (TEXT), `dosage` (TEXT), `frequency` (TEXT), `timing` (TEXT, e.g. `Before food` / `After food`), `duration_days` (INT), `special_instructions` (TEXT)

### 7. `lab_orders`, `samples` & `lab_reports`
* `lab_orders`: `id`, `order_no` (TEXT, Unique, e.g. `LAB-1001`), `consultation_id` (FK), `patient_id` (FK), `doctor_id` (FK), `hospital_id` (FK), `test_name` (TEXT), `urgency` (`routine`, `urgent`, `stat`), `status` (`ordered`, `sample_collected`, `testing`, `completed`, `cancelled`)
* `samples`: `id`, `lab_order_id` (FK), `sample_code` (TEXT, e.g. `SMP-1001`), `sample_type` (`blood`, `urine`, `tissue`, etc.), `collected_at` (TIMESTAMPTZ), `collected_by` (UUID, FK -> `profiles.id`)
* `lab_reports`: `id`, `lab_order_id` (FK), `sample_id` (FK), `parameters` (JSONB: test values, reference range, unit, flag), `summary` (TEXT), `approved_by` (UUID, FK -> `profiles.id`), `approved_at` (TIMESTAMPTZ), `report_file_url` (TEXT)

### 8. `pharmacy_dispensations`
* `id` (UUID, PK)
* `prescription_id` (UUID, FK -> `prescriptions.id`)
* `patient_id` (UUID, FK -> `patients.id`)
* `pharmacist_id` (UUID, FK -> `profiles.id`)
* `dispensed_at` (TIMESTAMPTZ)
* `medora_id_verified` (BOOLEAN)
* `notes` (TEXT)

### 9. `bills`, `bill_items` & `bill_versions`
* `bills`: `id`, `bill_no` (TEXT, e.g. `BILL-1001`), `patient_id` (FK), `hospital_id` (FK), `total_amount` (NUMERIC), `insurance_covered` (NUMERIC), `govt_scheme_covered` (NUMERIC), `discount` (NUMERIC), `patient_payable` (NUMERIC), `status` (`draft`, `generated`, `paid`, `disputed`)
* `bill_items`: `id`, `bill_id` (FK), `item_type` (`consultation`, `lab_test`, `pharmacy`, `bed_charge`, `procedure`), `reference_id` (UUID, polymorphic FK to `consultations`, `lab_orders`, `prescriptions`), `description` (TEXT), `quantity` (INT), `unit_price` (NUMERIC), `total_price` (NUMERIC)
* `bill_versions`: `id`, `bill_id` (FK), `version_no` (INT), `previous_total` (NUMERIC), `new_total` (NUMERIC), `changed_by` (UUID, FK), `reason` (TEXT), `created_at` (TIMESTAMPTZ)

### 10. `healthcare_timeline_events`
* `id` (UUID, PK)
* `patient_id` (UUID, FK -> `patients.id`)
* `event_type` (`appointment`, `consultation`, `prescription`, `lab_order`, `lab_report`, `pharmacy_dispense`, `admission`, `discharge`, `bill_generated`, `payment`, `emergency`)
* `reference_id` (UUID)
* `title` (TEXT)
* `summary` (TEXT)
* `hospital_id` (UUID, FK)
* `doctor_id` (UUID, FK)
* `event_timestamp` (TIMESTAMPTZ)

### 11. `audit_logs` (Append-Only)
* `id` (UUID, PK)
* `user_id` (UUID, FK -> `profiles.id`)
* `role` (TEXT)
* `action` (TEXT, e.g. `RECORD_ACCESSED`, `PRESCRIPTION_ISSUED`, `REPORT_APPROVED`, `MEDICINE_DISPENSED`, `BILL_UPDATED`)
* `target_entity` (TEXT)
* `target_id` (TEXT)
* `reason` (TEXT)
* `status` (TEXT, e.g. `SUCCESS`, `DENIED`)
* `ip_address` (TEXT)
* `created_at` (TIMESTAMPTZ)
