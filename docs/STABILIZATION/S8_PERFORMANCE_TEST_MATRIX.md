# S8 PERFORMANCE TEST MATRIX

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S8 Stabilization Track  
**Focus**: Executable Performance Test Matrix & Benchmark Ledger  

---

## 1. Test Matrix

| Test ID | Domain / Module | Workload | Target Budget | Measured Latency | Result |
|---|---|---|---|---|---|
| **PERF-001** | Identity Store Lookups | 2,000 lookups | $< 15\text{ms}$ | 1.12ms | **PASSED** |
| **PERF-002** | RBAC & Anti-IDOR Check | 20,000 checks | $< 25\text{ms}$ | 4.72ms | **PASSED** |
| **PERF-003** | Appointment Filter Passes | 500 queries | $< 20\text{ms}$ | 0.60ms | **PASSED** |
| **PERF-004** | 5-Tier Financial Waterfall | 200 calculations | $< 30\text{ms}$ | 3.71ms | **PASSED** |
| **PERF-005** | Currency & Date Localization | 10,000 conversions | $< 40\text{ms}$ | 29.75ms | **PASSED** |
| **PERF-006** | Store Memory Invariance | 100 payment cycles | Invariant | Invariant | **PASSED** |
