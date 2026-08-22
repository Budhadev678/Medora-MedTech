# 🌐 MEDORA — CONNECTIVITY ARCHITECTURE (PHASE A.2)
## Implemented Identity, Organization Membership & Care Connectivity

---

### 1. Authoritative Conceptual Model

$$\text{USER ACCOUNT} \longrightarrow \text{PERSON PROFILE} \longrightarrow \begin{cases} \text{PATIENT PROFILE} \\ \text{PROFESSIONAL PROFILE} \longrightarrow \text{ORGANIZATION MEMBERSHIP} \longrightarrow \text{ORGANIZATION} \end{cases}$$

```
                                  MEDORA ECOSYSTEM (A.2)
                                             │
                     ┌───────────────────────┴───────────────────────┐
                     │                                               │
               USER ACCOUNT                                    ORGANIZATION
             (auth.users.id)                              (Unique Legal Entity)
                     │                                        ├── HSP-1001 (City Hospital)
                     ↓                                        ├── HSP-1002 (Green Care Hospital)
               PERSON PROFILE                                 ├── CLN-1001 (Green Care Clinic)
           (PER-1001, PER-1002)                               ├── LAB-1001 (ABC Diagnostics)
                     │                                        ├── PHA-1001 (ABC Pharmacy)
         ┌───────────┴───────────┐                            └── BLC-1001 (City Blood Centre)
         │                       │                                           │
  PATIENT PROFILE        PROFESSIONAL PROFILE                                │
(PAT-1001, PAT-1002)     (DOC-1001, STAFF-1001)                              │
         │                       │                                           │
         │                       └───────────────┬───────────────────────────┘
         │                                       │
         │                                       ↓
         │                            ORGANIZATION MEMBERSHIP
         │                         (MEM-1001, MEM-1002, MEM-1003)
         │                                       ├── Organization ID & Name
         │                                       ├── Department (e.g. Cardiology)
         │                                       ├── Role Title (e.g. Consultant)
         │                                       ├── Member Role (e.g. Doctor)
         │                                       ├── Consultation Fee & OPD Room
         │                                       └── Lifecycle Status (ACTIVE)
         │                                                       │
         └───────────────────────────┬───────────────────────────┘
                                     │
                                     ↓
                          CARE & ACCESS CONTRACT
                 (Patient ↔ Organization / Practitioner)
                                     ├── Care Relationship (REL-*)
                                     ├── Patient Consent (CNS-*)
                                     ├── Access Engine Multi-Factor Check
                                     └── Append-Only Audit Ledger (AUD-*)
```

---

### 2. Verified Multi-Organization Connectivity Matrix

| Person / Practitioner | User ID | Profile Type | Organization | Role Title | Member Role | Fee / Room | Membership ID & Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Dr. Ananya Sharma** | `b0000001-...` | Professional (`DOC-1001`) | **City Hospital** (`HSP-1001`) | Consultant Cardiologist | `doctor` | ₹500 • Room 102 | `MEM-1001` (`ACTIVE`) |
| **Dr. Ananya Sharma** | `b0000001-...` | Professional (`DOC-1001`) | **Green Care Hospital** (`HSP-1002`) | Visiting Specialist | `doctor` | ₹600 • OPD 2 | `MEM-1002` (`ACTIVE`) |
| **Dr. Ananya Sharma** | `b0000001-...` | Professional (`DOC-1001`) | **Green Care Clinic** (`CLN-1001`) | Consultant | `doctor` | ₹400 • Suite 1 | `MEM-1003` (`ACTIVE`) |
| **Dr. Rajesh Sharma** | `b0000002-...` | Professional (`DOC-1002`) | **City Hospital** (`HSP-1001`) | Senior Consultant | `doctor` | ₹500 • Room 101 | `MEM-2001` (`ACTIVE`) |
| **Dr. Priya Das** | `b0000003-...` | Professional (`DOC-1003`) | **City Hospital** (`HSP-1001`) | Visiting Surgeon | `doctor` | ₹700 • Surgical 3 | `MEM-3001` (`PENDING`) |
| **Sunita Mohanty** | `k0000001-...` | Staff (`STAFF-1001`) | **City Hospital** (`HSP-1001`) | Head Nurse | `staff` | — | `MEM-4001` (`ACTIVE`) |
| **Anita** | `k0000002-...` | Staff (`STAFF-1002`) | **City Hospital** (`HSP-1001`) | Receptionist | `staff` | — | `MEM-5001` (`ACTIVE`) |
| **Anita** | `k0000002-...` | Staff (`STAFF-1002`) | **Green Care Clinic** (`CLN-1001`) | Receptionist | `staff` | — | `MEM-5002` (`ACTIVE`) |
| **Rahul Multi-Role** | `m0000001-...` | Multi-Role (`PER-MULTI-1001`) | **City Hospital** (`HSP-1001`) | Junior Resident | `doctor` | ₹300 | `MEM-6001` (`ACTIVE`) |
| **Rahul Multi-Role** | `m0000001-...` | Multi-Role (`PER-MULTI-1001`) | **Green Care Clinic** (`CLN-1001`) | Clinic Administrator | `hospital_admin` | — | `MEM-6002` (`ACTIVE`) |
