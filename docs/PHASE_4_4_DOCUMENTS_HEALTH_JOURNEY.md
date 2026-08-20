# 📑 MEDORA — PHASE 4.4: MEDICAL DOCUMENTS + UNIFIED PATIENT HEALTH JOURNEY
## Architectural Specification & Verification Report

---

### 1. Primary Objective
Phase 4.4 establishes the **Unified Patient Healthcare History & Medical Document Layer** in MEDORA, seamlessly connecting:

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
                └───────────────┬───────────────┘
                                ↓
                    MEDICAL DOCUMENTS (DOC-1001)
                                │
                                ↓
                     UNIFIED HEALTH JOURNEY
```

---

### 2. Core Product Principles

1. **The Health Journey is a Dynamic Presentation Layer, Not a New Record**:
   - The Health Journey timeline does **NOT** duplicate underlying clinical data.
   - It aggregates lightweight `TimelineEvent` references pointing directly to the authoritative records in:
     - `lib/data/encounter-store.ts` (`ENCOUNTER`)
     - `lib/data/clinical-record-store.ts` (`CLINICAL_RECORD`)
     - `lib/data/prescription-store.ts` (`PRESCRIPTION`)
     - `lib/data/lab-order-store.ts` (`LAB_ORDER`)
     - `lib/data/medical-document-store.ts` (`MEDICAL_DOCUMENT`)
2. **Document Provenance & Source Truth**:
   - Every medical document explicitly declares:
     - **Who** created it (`created_by_id`, `created_by_name`).
     - **Source Type**: `PROVIDER_GENERATED` (verified healthcare organization/clinician) vs `PATIENT_UPLOADED` (personal upload, never falsely represented as provider-verified).
     - **Attributed Organization & Professional**: e.g. `ABC Diagnostics` (`LAB-1001`), `Dr. Ananya Sharma` (`DOC-1001`).
     - **Related Encounter / Orders**: `ENC-1001`, `CR-1001`, `RX-1001`, `LAB-ORD-1001`.
     - **File Integrity**: Cryptographic SHA-256 hash.
3. **Immutability, Versioning & Revocation**:
   - Documents are never silently replaced. Modifying a document creates a new version ($1 \rightarrow 2$) with a mandatory documented `update_reason`, preserving the previous version in `version_history`.
   - Revoking a document requires an explicit reason, transitions status to `REVOKED`, and blocks subsequent token generation while preserving historical auditability.
4. **Secure, Non-Public Storage References**:
   - Private storage URIs (`sec-storage://patients/...`) are never exposed directly to public URLs.
   - Viewing or downloading generates temporary, signed access tokens and audits the access event.

---

### 3. Data Models (`types/database.types.ts`)

#### A. Medical Document Model (`HealthcareMedicalDocument`)
```typescript
export type MedicalDocumentType =
  | "CONSULTATION_NOTE"
  | "LAB_REPORT"
  | "PRESCRIPTION_DOCUMENT"
  | "DISCHARGE_SUMMARY"
  | "DIAGNOSTIC_REPORT"
  | "REFERRAL"
  | "OTHER";

export type DocumentSourceType = "PROVIDER_GENERATED" | "PATIENT_UPLOADED";
export type MedicalDocumentStatus = "ACTIVE" | "ARCHIVED" | "REVOKED";

export interface DocumentVersionSnapshot {
  version: number;
  title: string;
  storage_reference: string;
  mime_type: string;
  file_size_bytes: number;
  file_hash_sha256?: string;
  updated_at: string;
  updated_by_id: string;
  updated_by_name: string;
  update_reason: string;
}

export interface HealthcareMedicalDocument {
  id: string; // e.g. "DOC-1001"
  document_reference: string;
  patient_id: string; // FK -> PAT-1001
  patient_name: string;
  encounter_id?: string;
  clinical_record_id?: string;
  prescription_id?: string;
  lab_order_id?: string;
  document_type: MedicalDocumentType;
  title: string;
  description?: string;
  source_type: DocumentSourceType;
  source_organization_id?: string;
  source_organization_name?: string;
  source_professional_id?: string;
  source_professional_name?: string;
  source_professional_role?: string;
  storage_reference: string;
  mime_type: string;
  file_size_bytes: number;
  file_hash_sha256?: string;
  status: MedicalDocumentStatus;
  version: number;
  version_history?: DocumentVersionSnapshot[];
  revocation_reason?: string;
  revoked_at?: string;
  created_at: string;
  updated_at: string;
  created_by_id: string;
  created_by_name: string;
}
```

#### B. Timeline Event Model (`TimelineEvent`)
```typescript
export type TimelineEventType =
  | "ENCOUNTER"
  | "CLINICAL_RECORD"
  | "PRESCRIPTION"
  | "LAB_ORDER"
  | "MEDICAL_DOCUMENT";

export interface TimelineEvent {
  id: string; // Dynamic composite e.g. "tle-enc-1001"
  patient_id: string;
  event_type: TimelineEventType;
  reference_id: string;
  title: string;
  summary: string;
  status: string;
  occurred_at: string;
  organization_name?: string;
  organization_id?: string;
  professional_name?: string;
  professional_id?: string;
  deep_link: string;
  metadata?: Record<string, any>;
}
```

---

### 4. Verification Results

- **Automated Test Suite**: `scripts/test-phase4-health-journey.ts` (**54/54 assertions passed**).
- **Regression Test Suites**:
  - Phase 4.3 Prescriptions & Lab Orders: `47/47 passed`
  - Phase 4.2 Clinical Record Core: `28/28 passed`
  - Phase 4.1 Healthcare Encounter Core: `20/20 passed`
  - Phase 3 Security & Access Engine: `10/10 passed`
  - Phase 3 E2E Integration Suite: `22/22 passed`
- **Total Assertions**: **181/181 passed (100%)**.
- **TypeScript Typecheck**: `npm run typecheck` (**0 errors**).
- **Production Build**: `npm run build` (**111/111 static/dynamic routes compiled**).

---

### 5. Phase 4.4 Status
**Phase 4.4 is fully VERIFIED and Complete.**
