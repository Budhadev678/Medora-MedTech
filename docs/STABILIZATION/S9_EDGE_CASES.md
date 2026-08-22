# S9 EDGE CASE REGISTRY & VERIFICATION LEDGER

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S9 Stabilization Track  
**Focus**: Edge-Case Scenarios, Boundary Conditions & Safety Invariants  

---

## 1. Audited Edge Cases

| Edge Case ID | Scenario | Expected Safe Behavior | Actual Behavior | Result |
|---|---|---|---|---|
| **EC-001** | Encounter initiated with whitespace-only reason | Validation engine rejects submission with informative error | Returned `400 / error: "Please enter a valid clinical reason"` | **PASSED** |
| **EC-002** | Doctor creates working session for unaffiliated facility | Session creation blocked due to lack of hospital affiliation | Affiliation verified before session registration | **PASSED** |
| **EC-003** | Rapid double-click on consultation encounter submission | 3-second debounce window drops duplicate submission | Debounced idempotently | **PASSED** |
| **EC-004** | Financial coverage exceeding gross bill amount | Patient liability bounded at ₹0 minimum (no negative balance) | `projected_patient_responsibility >= 0` | **PASSED** |
| **EC-005** | Unauthorized patient reading diagnostic pathology report | Anti-IDOR engine returns `403 FORBIDDEN` | Request rejected with `403` | **PASSED** |
| **EC-006** | Accessioning laboratory sample with non-existent lab order | Rejection of orphan specimen creation | Foreign key validation blocks orphan | **PASSED** |
