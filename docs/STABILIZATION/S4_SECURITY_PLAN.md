# S4 SECURITY & ACCESS CONTROL STABILIZATION PLAN

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S4 Stabilization Track  
**Objective**: Authentication, Authorization, Role Permissions, Anti-IDOR, Organization Isolation & Data Privacy  

---

## 1. Executive Summary

Track S4 stabilizes MEDORA's security architecture across all actors, roles, APIs, and data layers. In healthcare environments handling sensitive electronic health records (EHR), prescriptions, diagnostic pathology reports, itemized billing, and financial transactions, client-side access checks are strictly insufficient.

S4 enforces the MEDORA Access Control Axiom:
```
WHO ARE YOU? ─────────────────► (Authentication)
       │
       ▼
WHAT ROLE DO YOU HAVE? ───────► (Role Validation)
       │
       ▼
WHAT FACILITY ARE YOU IN? ────► (Organization / Multi-Tenant Isolation)
       │
       ▼
WHICH RECORD ARE YOU ACCESSING?► (Record-Level Authorization / Anti-IDOR)
       │
       ▼
WHAT ACTION ARE YOU TAKING? ──► (Action Permission)
       │
       ▼
ALLOW / DENY
```

---

## 2. Scope & Risk Inventory

| Security Area | S1/S2/S3 Source | Affected Role | Risk Category | Expected Behavior | Status |
|---|---|---|---|---|---|
| **Unauthenticated API Access** | S2 API Audit | Unauthenticated | Critical | Missing token/header must return 401 UNAUTHORIZED | **VERIFIED** |
| **Patient Record IDOR** | S1 Audit | Patient | High | Patient A queries Patient B's records via query params/body; rejected with 403 FORBIDDEN | **VERIFIED** |
| **Doctor Scoped Care Access** | S3 Relationship | Doctor | High | Doctors access assigned patients/encounters across authorized facilities | **VERIFIED** |
| **Organization Tenant Isolation**| S1 Multi-Tenant | Hospital / Clinic | Critical | Hospital A cannot access Hospital B internal sessions or records | **VERIFIED** |
| **Diagnostic Lab Isolation** | Phase 8 Lab Suite| Lab Staff | High | Lab personnel access assigned specimens; no unrestricted EHR browsing | **VERIFIED** |
| **Pharmacy Dispensing Guards** | Phase 9 Suite | Pharmacy Staff | High | Dispensing requires verified OTP and pharmacist authentication | **VERIFIED** |
| **Privilege Escalation** | S1 Audit | All Users | Critical | Client-side role tampering cannot grant admin or mutate permissions | **VERIFIED** |
| **Safe Error Masking** | S1 Architecture | Normal Users | Medium | No SQL error leaks, stack traces, or internal table metadata | **VERIFIED** |
