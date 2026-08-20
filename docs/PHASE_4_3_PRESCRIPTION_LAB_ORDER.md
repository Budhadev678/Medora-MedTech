# 💊 MEDORA — PHASE 4.3: PRESCRIPTION & LAB ORDER FOUNDATION
## Architectural Specification & Verification Report

---

### 1. Primary Objective
Phase 4.3 establishes the **Actionable Clinical Orders Layer** in MEDORA on top of the established **Patient**, **Encounter**, and **Clinical Record** foundations:

```
                         PATIENT (PAT-1001)
                                │
                          AUTH IDENTITY
                                │
                      HEALTHCARE RELATIONSHIPS
                                │
                         PATIENT CONSENT
                                │
                    CENTRALIZED ACCESS ENGINE
                                │
                      HEALTHCARE ENCOUNTER (ENC-1001)
                                │
                      CLINICAL RECORD (CR-1001)
                                │
                ┌───────────────┴───────────────┐
                ↓                               ↓
      PRESCRIPTION (RX-1001)          LAB ORDER (LAB-ORD-1001)
                │                               │
        ┌───────┴───────┐               ┌───────┴───────┐
        ↓               ↓               ↓               ↓
   MEDICINES        PRESCRIBER        TESTS          ORDERING
 (Dosage, Route,   (Doc & Org)    (Specimen,       (Doc & Org)
    Frequency)                     Priority)
        │                               │
        ↓                               ↓
   OPEN PHARMACY                   OPEN DIAGNOSTIC
    FULFILLMENT                      LAB CHOICE
```

---

### 2. Strict Scope Boundaries

1. **Prescription $\neq$ Pharmacy Order**:
   - A prescription is an authoritative clinical order signed by a qualified practitioner.
   - Preserves **Patient Freedom**: The patient is never locked to the hospital pharmacy and can fulfill at any licensed retail, hospital, or online pharmacy.
2. **Lab Order $\neq$ Lab Result**:
   - A lab order is a diagnostic test request issued by a practitioner.
   - Preserves **Open Lab Choice**: The patient can choose to perform tests at the hospital lab or any accredited independent diagnostic center.
   - Lab results are attached in subsequent diagnostic phases.
3. **No AI Prescriptions or Autonomous Decisions**:
   - Every prescription and lab order is clinician-authored and explicitly attributed.

---

### 3. Data Models (`types/database.types.ts`)

#### A. Prescription Model (`HealthcarePrescription`)
```typescript
export type PrescriptionStatus = "DRAFT" | "ISSUED" | "CANCELLED" | "COMPLETED" | "EXPIRED";
export type PrescriptionRoute = "ORAL" | "TOPICAL" | "INHALATION" | "INJECTION" | "OTHER";

export interface PrescriptionItem {
  id: string; // e.g. "RXI-1"
  medicine_name: string; // e.g. "Telmisartan"
  strength?: string; // e.g. "40 mg"
  dosage: string; // e.g. "1 tablet"
  route: PrescriptionRoute; // e.g. "ORAL"
  frequency: string; // e.g. "Once daily (morning)"
  duration: string; // e.g. "30 days"
  quantity?: string; // e.g. "30 tablets"
  instructions?: string; // e.g. "Take after breakfast with water"
}

export interface HealthcarePrescription {
  id: string; // e.g. "RX-1001"
  prescription_reference: string;
  patient_id: string; // FK -> PAT-1001
  patient_name: string;
  encounter_id: string; // FK -> ENC-1001
  clinical_record_id?: string;
  prescriber_id: string; // FK -> DOC-1001
  prescriber_name: string;
  prescriber_role: string;
  organization_id: string; // FK -> HSP-1001
  organization_name: string;
  department_name?: string;
  status: PrescriptionStatus;
  items: PrescriptionItem[];
  refills_allowed: number;
  refills_used: number;
  notes?: string;
  issued_at?: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}
```

#### B. Lab Order Model (`HealthcareLabOrder`)
```typescript
export type LabOrderPriority = "ROUTINE" | "URGENT";
export type LabOrderStatus = "DRAFT" | "ORDERED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface LabOrderItem {
  id: string; // e.g. "LOI-1"
  test_name: string; // e.g. "Complete Blood Count (CBC)"
  test_code?: string;
  specimen_type?: string; // e.g. "Whole Blood (EDTA)"
  instructions?: string;
}

export interface HealthcareLabOrder {
  id: string; // e.g. "LAB-ORD-1001"
  order_reference: string;
  patient_id: string; // FK -> PAT-1001
  patient_name: string;
  encounter_id: string; // FK -> ENC-1001
  ordering_provider_id: string; // FK -> DOC-1001
  ordering_provider_name: string;
  organization_id: string; // FK -> HSP-1001
  organization_name: string;
  priority: LabOrderPriority;
  reason: string; // Mandatory clinical indication
  instructions?: string;
  status: LabOrderStatus;
  items: LabOrderItem[];
  ordered_at?: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}
```

---

### 4. Lifecycle & Immutability Rules

1. **Prescription Lifecycle**:
   - `DRAFT`: Saved progress by attending clinician. Hidden from patient portal.
   - `ISSUED`: Digitally signed and locked against silent tampering. Visible to patient with QR verification link.
   - `CANCELLED`: Requires a mandatory documented `cancellation_reason`. Preserves original record and logs `PRESCRIPTION_CANCELLED`.
2. **Lab Order Lifecycle**:
   - `DRAFT`: In-progress order.
   - `ORDERED`: Placed with mandatory tests and clinical indication. Visible in patient portal and assigned lab queues.
   - `CANCELLED`: Requires a documented cancellation reason. Preserves historical intent and logs `LAB_ORDER_CANCELLED`.

---

### 5. Multi-Hospital Doctor Scoping & Access Control

- **Affiliation Enforcement**: Prescriptions and lab orders must match the hospital/clinic context where the encounter is occurring. Doctors with multi-hospital practices (e.g. `City Hospital` vs `Green Care Clinic`) have their orders cleanly partitioned by `organization_id`.
- **Strict Patient Isolation**: Patients query only their own issued orders. Cross-patient and cross-organization leaks are rejected.
- **Append-Only Audit**: Automatically logs `PRESCRIPTION_CREATED`, `PRESCRIPTION_ISSUED`, `PRESCRIPTION_CANCELLED`, `LAB_ORDER_CREATED`, `LAB_ORDER_ORDERED`, `LAB_ORDER_CANCELLED` with complete credential sanitization.

---

### 6. Verification Results

- **Automated Test Suite**: `scripts/test-phase4-prescription-lab.ts` (**47/47 assertions passed**).
- **Clinical Record Suite**: `scripts/test-phase4-clinical-record.ts` (**28/28 assertions passed**).
- **Encounter Suite**: `scripts/test-phase4-encounter.ts` (**20/20 assertions passed**).
- **Security Suite**: `scripts/test-phase3-security.ts` (**10/10 assertions passed**).
- **E2E Integration Suite**: `scripts/test-phase3-e2e.ts` (**22/22 assertions passed**).
- **TypeScript Typecheck**: `npm run typecheck` (**0 errors**).
- **Production Build**: `npm run build` (**110/110 routes compiled**).

---

### 7. Phase 4.3 Status
**Phase 4.3 is fully VERIFIED and Complete.**
