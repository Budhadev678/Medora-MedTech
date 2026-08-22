# MEDORA — MODIFICATION PHASE C.2 SPECIFICATION & RUNBOOK
## Prescription & Medical Order Engine

---

## 1. Executive Summary

Modification Phase C.2 establishes the authoritative **Prescription & Medical Order Engine** in MEDORA. It bridges the active or completed clinical encounter authored by the attending clinician to structured, verifiable medication instructions and multi-disciplinary medical orders.

$$\text{Patient} \rightarrow \text{Healthcare Encounter (C.1)} \rightarrow \begin{cases} \text{Prescription (PRX-xxxx)} \rightarrow \text{Prescription Items} \rightarrow \text{Pharmacy (Phase 9)} \\ \text{Lab Order (ORD-xxxx)} \rightarrow \text{Specimen \& Testing (Phase C.3)} \\ \text{Imaging Order (IMG-xxxx)} \rightarrow \text{Radiology \& Diagnostics} \\ \text{Referral Order (REF-xxxx)} \rightarrow \text{Specialty Facility / Doctor} \\ \text{Follow-Up Order} \rightarrow \text{Reminders \& Care Continuity} \end{cases}$$

---

## 2. Core Architectural Invariants

1. **Mandatory Encounter Context**:
   - A prescription or medical order **cannot exist without a parent `HealthcareEncounter`**.
   - No floating or disconnected prescriptions are permitted.
2. **Attending Clinician Exclusivity**:
   - Only the doctor assigned to the encounter (or authorized administrator) can author and issue prescriptions or orders for that encounter.
   - Doctor B cannot prescribe inside Doctor A's encounter (`WRONG_DOCTOR`).
3. **Structured Medication Model**:
   - Prescriptions store structured data:
     $$\text{Medicine ID} \rightarrow \text{Generic/Brand} \rightarrow \text{Strength (value + unit)} \rightarrow \text{Dose (quantity + form)} \rightarrow \text{Frequency} \rightarrow \text{Timing} \rightarrow \text{Duration} \rightarrow \text{Route} \rightarrow \text{Instructions}$$
4. **Draft vs. Issued Lifecycle & Patient Isolation**:
   - **`DRAFT`**: Iteratively editable during consultation; strictly hidden from the patient portal.
   - **`ISSUED`**: Validated and locked. Released to the patient mobile portal.
   - **`AMENDED`**: Post-issue modifications create an immutable snapshot of Version 1 in `version_history` and increment the version to $V_2$.
   - **`CANCELLED`**: Cancelled with mandatory documented reason; retained for legal/clinical provenance.
5. **Open Pharmacy Freedom & Least Privilege**:
   - Prescriptions are independent of any single hospital pharmacy. Patients may choose any registered pharmacy.
   - Pharmacy access boundary returns strictly **minimum necessary data** for dispensing; unrelated clinical notes and previous history remain protected.
   - Pharmacies cannot alter the doctor's prescription items.
6. **Zero AI / Autonomous Prescribing**:
   - Doctor prescribes. MEDORA records, validates, and transmits. No autonomous treatment inference.

---

## 3. Data Model Enhancements (`types/database.types.ts`)

### `MedicineCatalogItem`
- `id`: `MED-1001`
- `generic_name`: e.g. "Telmisartan"
- `brand_name`: e.g. "Telma 40"
- `default_strength`: "40 mg" (`strength_value: 40`, `strength_unit: "mg"`)
- `form`: `"TABLET" | "CAPSULE" | "SYRUP" | "INJECTION" | "INHALER" | "DROPS" | "OINTMENT"`
- `default_route`: `"ORAL" | "TOPICAL" | "INHALATION" | "INJECTION" | "OTHER"`
- `category`: e.g. "Antihypertensive (ARB)"
- `is_restricted`: boolean flag for scheduled drugs

### `PrescriptionItem`
- `id`: `PRI-1`
- `medicine_id`: Foreign key to catalog item
- `medicine_name`: Display name
- `generic_name` & `brand_name`
- `strength`, `strength_value`, `strength_unit`
- `dosage`, `dosage_quantity`, `dosage_form`
- `route`: `"ORAL" | "TOPICAL" | "INHALATION" | "INJECTION" | "OPHTHALMIC" | "OTIC" | "SUBLINGUAL" | "OTHER"`
- `frequency`: e.g. "Twice daily (morning, night)"
- `timing`: `"BEFORE_FOOD" | "AFTER_FOOD" | "WITH_FOOD" | "AT_BEDTIME" | "EMPTY_STOMACH" | "ANY_TIME"`
- `duration`: e.g. "30 days"
- `quantity`: e.g. "60 tablets"
- `instructions`: Specific administration guidelines
- `is_prn`: boolean flag for "as needed" medication
- `status`: `"ACTIVE" | "DISCONTINUED" | "COMPLETED"`

### `HealthcareMedicalOrder`
- `id`: e.g. `ORD-1001`, `IMG-1001`, `REF-1001`
- `order_type`: `"LAB" | "IMAGING" | "REFERRAL" | "FOLLOW_UP"`
- `priority`: `"ROUTINE" | "URGENT" | "STAT"`
- `status`: `"DRAFT" | "ORDERED" | "CANCELLED" | "COMPLETED"`
- `lab_items`: Array of laboratory tests with specimen types
- `imaging_details`: Modality (`XRAY`, `MRI`, `CT`, `ECHO`, `USG`), body part, IV contrast flag
- `referral_details`: Target specialty, target doctor/facility, urgency, reason, clinical summary
- `follow_up_details`: Recommended timeframe and precautions

---

## 4. Platform Services & Stores

| Component | Path | Responsibility |
|---|---|---|
| **Medicine Catalog Store** | `lib/data/medicine-catalog-store.ts` | Extensible pharmaceutical catalog with fast debounced generic/brand search |
| **Prescription Core Store** | `lib/data/prescription-store.ts` | Authoritative persistence, draft saving, issuance, version snapshots, RLS filtering, and pharmacy access boundary |
| **Medical Orders Store** | `lib/data/medical-order-store.ts` | Diagnostic, radiology, referral & follow-up order repository |
| **Prescription & Order Service** | `lib/services/prescription-order-service.ts` | Business logic coordinator, duplicate medicine detection, authorization, and audit trail logging |
| **Doctor Consultation Workspace** | `app/doctor/consultations/[id]/page.tsx` | Interactive medicine search, structured composer, preview modal, issue confirmation, and multi-order hub |
| **Patient Prescriptions Portal** | `app/patient/prescriptions/page.tsx` | Mobile-first active vs past prescription regimen with open pharmacy guidance and QR slips |

---

## 5. Automated Verification Results

Test Suite: `scripts/test-phase-c2-prescription-orders.ts`
- **Total Assertions**: 39
- **Passed**: 39 (100%)
- **Failed**: 0

### Test Groups:
1. **Medicine Catalog & Autocomplete Search**: Generic and brand name resolution.
2. **Structured Medicine Model & Validation**: Rejects empty items, missing dosage/frequency; detects duplicates.
3. **Encounter Mandatory Binding & Authorization**: Rejects non-existent encounters, wrong doctors, and non-clinicians.
4. **Draft Lifecycle & Patient Isolation**: Draft persistence hidden from patient portal until issued; cross-patient isolation.
5. **Authoritative Issuance & Double-Issue Prevention**: Locks issued prescriptions; publishes to patient portal.
6. **Formal Amendment & Version Snapshotting**: Requires clinical reason, creates Version 1 snapshot, increments to Version 2.
7. **Prescription Cancellation**: Requires reason, transitions status to `CANCELLED`.
8. **Medical Orders Domain Engine**: Issues `LAB`, `IMAGING`, `REFERRAL`, and `FOLLOW_UP` orders.
9. **Multi-Facility Doctor Practice Scoping**: Correctly scopes prescriptions to City Hospital vs Green Care Clinic.
10. **Pharmacy Read Boundary & Least Privilege**: Sanitized dispensing payload; denies cancelled/draft orders.
11. **Immutable Audit Logging**: Emits tamper-proof audit trail records.
