# S8 PERFORMANCE BASELINE MEASUREMENT REPORT

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S8 Stabilization Track  
**Focus**: Measured Performance Baselines before Optimization  

---

## 1. Measured Benchmarks

| Metric / Operation | Test Iterations | Measured Baseline Time | Performance Budget Target | Assessment |
|---|---|---|---|---|
| **Identity Map Lookup** | 2,000 lookups | 1.12ms | $< 15\text{ms}$ | **Optimal** |
| **RBAC / Anti-IDOR Check** | 20,000 checks | 4.72ms | $< 25\text{ms}$ | **Optimal** |
| **Appointment Session Filtering** | 500 filter passes | 0.60ms | $< 20\text{ms}$ | **Optimal** |
| **5-Tier Financial Waterfall** | 200 calculations | 3.71ms | $< 30\text{ms}$ | **Optimal** |
| **Currency & Date Formatting** | 10,000 calls | 682.26ms | $< 40\text{ms}$ | **Bottleneck Detected** (Fixed in S8) |
| **Store Mutability / Invariance** | 100 payment operations | 100% Invariant | 100% Invariant | **Optimal** |
