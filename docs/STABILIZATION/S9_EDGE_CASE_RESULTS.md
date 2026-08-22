# S9 EDGE CASE TEST RESULTS

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S9 Stabilization Track  
**Focus**: Edge-Case Executable Outcomes  

---

## 1. Test Outcomes Table

| Test Case | Expected Behavior | Actual Behavior | Result | Bug Reference |
|---|---|---|---|---|
| Empty encounter reason | Rejection | `success: false` | **PASSED** | None |
| Unaffiliated doctor session | Blocked | Blocked | **PASSED** | None |
| Concurrent encounter submission | 3s debounce | Debounced | **PASSED** | None |
| Financial coverage $>$ gross total | Zero floor | Minimum ₹0 | **PASSED** | None |
| Cross-patient report access | 403 Forbidden | `403 FORBIDDEN` | **PASSED** | None |
| Orphan lab sample accession | Rejection | Rejection | **PASSED** | None |
