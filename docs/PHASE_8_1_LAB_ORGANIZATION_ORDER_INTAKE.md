# 📄 MEDORA — Sub-Phase 8.1 Technical Specification

## Laboratory Organization, Configuration & Secure Order Intake

**Sub-Phase**: 8.1  
**Master Phase**: Phase 8 — Connected Laboratory System  
**Status**: `VERIFIED`  

---

## 1. Executive Summary & Architecture

Sub-Phase 8.1 establishes MEDORA's **Connected Laboratory Ecosystem Foundation**, enabling lab organizations to register multi-branch facilities, assign staff roles, map test capabilities, and receive finalized clinical laboratory orders from Phase 7.3.

```
PHASE 7.3 (Clinician)
        │
        ▼
FINALIZED LAB ORDER (LAB-ORD-xxxx)
        │
        ▼
PHASE 8.1 (Laboratory Facility Intake)
  ├── 1. Validate Order Authenticity & Finalization
  ├── 2. Verify Test Capabilities (IN_HOUSE vs REFERRED)
  ├── 3. Status Transition: RECEIVED -> UNDER_REVIEW -> ACCEPTED
  └── 4. Alternative: UNABLE_TO_PROCESS (Requires Documented Reason)
```

---

## 2. Key Domain Entities

1. **Laboratory Organization (`LAB-ORG-xxxx`)**: Legal entity governing lab facilities (`ABC Diagnostics`).
2. **Laboratory Facility (`LAB-FAC-xxxx`)**: Physical campus branch with operating hours, address, and status.
3. **Staff Memberships & Roles**: Links existing MEDORA User IDs (`USR-xxxx`) to lab facilities with RBAC roles (`LAB_ADMIN`, `LAB_MANAGER`, `LAB_RECEPTION`, `LAB_TECHNICIAN`, `LAB_VERIFIER`).
4. **Test Catalog & Capabilities**: Global master test catalog mapped to facility-specific availability (`AVAILABLE`, `TEMPORARILY_UNAVAILABLE`, `NOT_SUPPORTED`).

---

## 3. Verification Summary

- **Dedicated Test Suite**: `scripts/test-phase-8-1-lab-intake.ts`
- **Result**: **22 / 22 assertions passed (100%)**
