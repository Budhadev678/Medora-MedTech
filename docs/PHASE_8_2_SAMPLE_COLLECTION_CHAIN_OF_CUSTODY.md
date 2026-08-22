# 📄 MEDORA — Sub-Phase 8.2 Technical Specification

## Patient Verification, Sample Collection & Chain of Custody

**Sub-Phase**: 8.2  
**Master Phase**: Phase 8 — Connected Laboratory System  
**Status**: `VERIFIED`  

---

## 1. Executive Summary & Workflow

Sub-Phase 8.2 implements MEDORA's **Specimen Collection & Chain of Custody Engine**, connecting patient arrival, identity verification, specimen registration with server-authoritative unique Sample IDs (`SMP-xxxx`), barcode label metadata, custody movements, rejection logging, and recollection linkage.

```
ACCEPTED LAB ORDER (LAB-ORD-xxxx)
        │
        ▼
PATIENT VERIFICATION (Two-Point: MEDORA ID + DOB)
        │
        ▼
SPECIMEN COLLECTION & LABELING (SMP-xxxx)
        │
        ▼
CHAIN OF CUSTODY MOVEMENT (SAMPLE_COLLECTED -> SAMPLE_TRANSFERRED -> READY_FOR_TESTING)
        │
        ├── Standard Flow: READY_FOR_TESTING ──> PHASE 8.3 HANDOFF
        │
        └── Rejection Flow: REJECTED -> RECOLLECTION_REQUIRED -> Linked SMP-yyyy
```

> [!IMPORTANT]
> **Strict Phase 8.2 Boundary**:
> - Specimen collection stops at `SAMPLE_READY_FOR_TESTING`.
> - Phase 8.2 does NOT enter test result values, verify reports, or process billing.

---

## 2. Verification Summary

- **Dedicated Test Suite**: `scripts/test-phase-8-2-sample-custody.ts`
- **Result**: **19 / 19 assertions passed (100%)**
