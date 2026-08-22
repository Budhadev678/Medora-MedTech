# S10 SECURITY BUG REGISTRY

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S10 Stabilization Track  
**Focus**: Security Vulnerabilities, Access Defects & Hardening Ledger  

---

## 1. Resolved Security Hardening Defects

| Bug ID | Phase Scope | Severity | Affected Area | Vulnerability / Defect | Security Hardening Applied | Status |
|---|---|---|---|---|---|---|
| **SEC-001** | Phase 1 | High | Unauthenticated Fallback | Missing credentials previously defaulted to mock demo user | Removed fallback; strictly returns `401 UNAUTHORIZED` | **RESOLVED & VERIFIED** |
| **SEC-002** | Phase 4 | Critical | Patient Data Isolation | Cross-patient URL querying permitted viewing other patient records | Enforced `validatePatientRecordAccess` returning `403 FORBIDDEN` | **RESOLVED & VERIFIED** |
| **SEC-003** | Phase 10 | High | Financial Mutation | Client request payload could theoretically modify bill net balance | Enforced server-authoritative gross and waterfall calculation | **RESOLVED & VERIFIED** |
