# S7 TEST CASES & QUALITY ASSURANCE LEDGER

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S7 Stabilization Track  
**Focus**: Executable Integration Test Cases across Phase 0–10  

---

## 1. Test Execution Breakdown

| Test ID | Phase Scope | Roles Involved | Action Executed | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| **TC-S7-001** | Phase 0 & 1 | Patient A | Authenticate with valid credentials | Identity resolved; role `patient` | `patient` resolved | **PASSED** |
| **TC-S7-002** | Phase 0 & 1 | Doctor | Authenticate with doctor credentials | Identity resolved; role `doctor` | `doctor` resolved | **PASSED** |
| **TC-S7-003** | Phase 0 & 1 | Lab Staff | Authenticate with lab credentials | Identity resolved; role `lab_staff` | `lab_staff` resolved | **PASSED** |
| **TC-S7-004** | Phase 0 & 1 | Pharmacy | Authenticate with pharmacy credentials | Identity resolved; role `pharmacy_staff` | `pharmacy_staff` resolved | **PASSED** |
| **TC-S7-005** | Phase 0 & 1 | Finance | Authenticate with finance credentials | Identity resolved; role `finance_staff` | `finance_staff` resolved | **PASSED** |
| **TC-S7-006** | Phase 3 | Patient A | Verify ABHA passport and clinical profile | ABHA & blood group O+ resolved | ABHA & O+ verified | **PASSED** |
| **TC-S7-007** | Phase 4 & 5 | Doctor | Query doctor multi-facility sessions | Sessions across $\ge 2$ hospital facilities | 2 facilities verified | **PASSED** |
| **TC-S7-008** | Phase 6 | Patient A | Book outpatient appointment slot | Appointment saved with valid ID | Saved `APT-S7-1001` | **PASSED** |
| **TC-S7-009** | Phase 6 | Receptionist | Execute check-in for appointment | Queue token issued (`C-01`) | Token `C-01` issued | **PASSED** |
| **TC-S7-010** | Phase 7 | Doctor | Document encounter and SOAP notes | Encounter saved with clinical notes | Encounter saved | **PASSED** |
| **TC-S7-011** | Phase 7 | Doctor | Issue signed digital prescription | E-Prescription finalized with medications | Finalized with 2 drugs | **PASSED** |
| **TC-S7-012** | Phase 8 | Doctor | Order diagnostic lipid panel | Lab order created and linked to encounter | Linked to encounter | **PASSED** |
| **TC-S7-013** | Phase 8 | Lab Staff | Accession biological blood specimen | Specimen generated barcode (`SMP-*`) | `SMP-1002` created | **PASSED** |
| **TC-S7-014** | Phase 8 | Lab Staff | Verify and release pathology test report | Certified report released | Report released | **PASSED** |
| **TC-S7-015** | Phase 9 | Pharmacy | Evaluate FEFO batch availability | Inventory batches reserved | Batches allocated | **PASSED** |
| **TC-S7-016** | Phase 10 | Finance | Generate draft itemized invoice | Sum of items equals gross total (₹1000) | Items match gross total | **PASSED** |
| **TC-S7-017** | Phase 10 | Finance | Compute 5-tier financial waterfall | Waterfall charges match gross total | Invariant to gross total | **PASSED** |
| **TC-S7-018** | Phase 10 | Patient A | Settle invoice via UPI payment | Payment recorded; balance invariant | Settled successfully | **PASSED** |
| **TC-S7-019** | Cross-Role | System | Validate foreign key relational integrity | All records reference parent IDs | 100% integrity intact | **PASSED** |
