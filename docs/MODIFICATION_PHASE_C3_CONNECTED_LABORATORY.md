# MEDORA — MODIFICATION PHASE C.3: CONNECTED LABORATORY ORDER → SAMPLE → REPORT ENGINE

## 1. Executive Summary & Objective
Phase C.3 introduces the complete end-to-end connected diagnostic pathology workflow into MEDORA. The architecture strictly enforces the distinction between **Diagnostic Lab Orders** (`HealthcareLabOrder`) and **Certified Diagnostic Reports** (`HealthcareLabReport`), preserving complete physical specimen custody (`HealthcareLabSample`), multi-step technician entry, pathologist verification locking, and immutable report versioning.

---

## 2. Core Architectural Principles & Invariants

1. **Lab Order $\neq$ Lab Report**:
   - `HealthcareLabOrder` (`LAB-ORD-xxxx`): Represents clinician intent during an encounter ("Doctor requests CBC + Lipid Panel").
   - `HealthcareLabSample` (`SMP-xxxx`): Represents physical specimen collection, barcoding, transport, receipt, and quality checks.
   - `HealthcareTestResult` (`RES-xxxx`): Represents structured analyte outcomes entered by technicians and reviewed by pathologists.
   - `HealthcareLabReport` (`RPT-xxxx`): Represents finalized, verified, pathologist-certified diagnostic documentation released to doctors and patients.

2. **Full Lifecycle State Machines**:
   - **Order Lifecycle**: `DRAFT` $\rightarrow$ `ORDERED` $\rightarrow$ `ACCEPTED` $\rightarrow$ `SAMPLE_COLLECTED` $\rightarrow$ `PROCESSING` $\rightarrow$ `VERIFICATION_PENDING` $\rightarrow$ `REPORT_READY` $\rightarrow$ `RELEASED` / `CANCELLED` / `REJECTED`.
   - **Sample Lifecycle**: `ORDERED` $\rightarrow$ `COLLECTED` $\rightarrow$ `RECEIVED` $\rightarrow$ `PROCESSING` $\rightarrow$ `COMPLETED` / `REJECTED`.
   - **Result Lifecycle**: `PENDING` $\rightarrow$ `ENTERED` $\rightarrow$ `VERIFIED` $\rightarrow$ `AMENDED`.
   - **Report Lifecycle**: `DRAFT` $\rightarrow$ `PRELIMINARY` $\rightarrow$ `RELEASED` $\rightarrow$ `AMENDED` $\rightarrow$ `CANCELLED`.

3. **Multi-Role Laboratory Authorization**:
   - **Sample Collector / Phlebotomist**: Verified patient identity match, sample collection, barcoding.
   - **Intake Staff**: Specimen intake, condition validation, rejection with documented reason (`HEMOLYZED`, `INSUFFICIENT_VOLUME`, `CONTAINER_DAMAGED`), recollection triggering.
   - **Laboratory Technician**: Structured analyte result entry with automatic reference range checking and abnormal flag calculation (`NORMAL`, `HIGH`, `LOW`, `CRITICAL`).
   - **Pathologist / Certifier**: Clinical review, verification locking, final release certification, formal report amendment ($V_1 \rightarrow V_2$).

4. **Multi-Tenancy, Cross-Lab & Cross-Patient Security**:
   - **Cross-Lab Isolation**: Laboratory staff in Lab A cannot accept, collect, process, or alter Lab B's orders (`CROSS_LAB_DENIED`).
   - **Strict Patient Isolation**: Patient portal strictly filters released reports and orders belonging exclusively to the authenticated patient (`PAT-1001` vs `PAT-1002`). Unreleased drafts are hidden.

---

## 3. Diagnostic Test Catalog
The system includes standard pathology panels with standardized analyte parameter definitions:
- **`TEST-CBC-001` (CBC-01)**: Complete Blood Count (Whole Blood / EDTA). Parameters: Hemoglobin (`g/dL`), WBC Count (`10^3/µL`), Platelet Count (`10^3/µL`), RBC Count (`10^6/µL`), Hematocrit (`%`).
- **`TEST-LIP-001` (LIP-01)**: Lipid Profile Panel (Serum / Fasting). Parameters: Total Cholesterol (`mg/dL`), HDL Cholesterol (`mg/dL`), LDL Cholesterol (`mg/dL`), Triglycerides (`mg/dL`), VLDL (`mg/dL`).
- **`TEST-KFT-001` (REN-02)**: Renal / Kidney Function Test (Serum). Parameters: Serum Creatinine (`mg/dL`), Blood Urea Nitrogen (`mg/dL`), Uric Acid (`mg/dL`), Serum Sodium (`mEq/L`), Serum Potassium (`mEq/L`).
- **`TEST-LFT-001` (HEP-01)**: Liver Function Test (Serum). Parameters: Total Bilirubin (`mg/dL`), Direct Bilirubin (`mg/dL`), SGOT / AST (`U/L`), SGPT / ALT (`U/L`), Alkaline Phosphatase (`U/L`), Total Protein (`g/dL`), Serum Albumin (`g/dL`).
- **`TEST-DIA-001` (GLY-01)**: Glycated Hemoglobin / HbA1c (Whole Blood). Parameters: HbA1c (`%`), Estimated Average Glucose (`mg/dL`).
- **`TEST-THY-001` (THY-01)**: Thyroid Profile Panel (Serum). Parameters: TSH (`µIU/mL`), Free T3 (`pg/mL`), Free T4 (`ng/dL`).
- **`TEST-URI-001` (URI-01)**: Routine & Microscopic Urinalysis (Urine). Parameters: Urine Color, Specific Gravity, Urine pH, Urine Protein, Urine Glucose, Pus Cells / WBCs (`/HPF`), RBCs (`/HPF`).

---

## 4. End-to-End Execution Traceability Matrix

| Question | Answer Mechanism in MEDORA |
| :--- | :--- |
| **WHO ordered the test?** | `ordering_provider_id` & `ordering_provider_name` on `HealthcareLabOrder` |
| **FOR WHICH PATIENT?** | `patient_id` & `patient_name` linked with ABHA / MRN |
| **DURING WHICH ENCOUNTER?** | `encounter_id` linking doctor OPD consultation |
| **WHICH LAB processed it?** | `laboratory_id` & `laboratory_name` with facility tenant validation |
| **WHICH SAMPLE was collected?** | `HealthcareLabSample` (`SMP-xxxx`) with barcode, specimen type, collection timestamp |
| **WHO processed the result?** | `entered_by_id` & `entered_by_name` on `HealthcareTestResult` |
| **WHO verified it?** | `verified_by_id` & `verified_by_name` on `HealthcareTestResult` and `HealthcareLabReport` |
| **WHEN was report generated?** | `created_at` timestamp on `HealthcareLabReport` |
| **WHEN was report released?** | `released_at` timestamp on `HealthcareLabReport` |
| **WHO accessed it?** | `REPORT_ACCESSED` append-only audit event in security ledger |

---

## 5. Verification Results
- **Phase C.3 Test Suite (`scripts/test-phase-c3-connected-laboratory.ts`)**: 45/45 Passed (100%).
- **TypeScript Typecheck (`npx tsc --noEmit`)**: 0 errors.
- **Full Platform Regression (`Phase A.2, A.3, A.4, B.1, B.2, B.3, B.4, C.1, C.2, C.3, Phase 4.3`)**: 472/472 assertions passing.
