# S9 VALIDATION TEST MATRIX

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S9 Stabilization Track  
**Focus**: Validation Invariants & Test Assertions  

---

## 1. Validation Test Ledger

| Test ID | Entity Under Test | Input / Condition | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|---|---|
| **VAL-001** | Identity Email | `patient@medora.health` | RFC format valid | Valid RFC email | **PASSED** |
| **VAL-002** | Identity Full Name | Non-empty string | Non-empty string | Non-empty string | **PASSED** |
| **VAL-003** | Doctor Affiliation | Session creation | Match affiliated organization | Verified with Org | **PASSED** |
| **VAL-004** | Encounter Reason | Whitespace string | Reject creation | `error: "Please enter valid clinical reason"` | **PASSED** |
| **VAL-005** | Medication Items | Drug dosage & duration | Complete fields | 100% complete | **PASSED** |
| **VAL-006** | Lab Specimen | Sample accessioning | Must reference existing lab order | Valid `lab_order_id` | **PASSED** |
| **VAL-007** | Bill Line Items | Sum of charges | Must equal `gross_total` | `gross_total == sum(items)` | **PASSED** |
| **VAL-008** | Financial Waterfall | Coverage discount | Non-negative patient liability | `projected_responsibility >= 0` | **PASSED** |
| **VAL-009** | Payment Records | Bill association | Must reference existing bill | Valid `bill_id` | **PASSED** |
