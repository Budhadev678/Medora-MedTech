# 🏛️ MEDORA — Ecosystem Relationship & Connectivity Architecture

## 1. The Master Axiom
> **"Every person, organization, facility, medical event, financial event, and emergency event is an independent entity connected through explicit relationships. Never connect entities using hardcoded names, text fields, or frontend-only state."**

---

## 2. Core Relational Hierarchy
```
                                  MEDORA
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
       PEOPLE                  ORGANIZATIONS                FACILITIES
          │                          │                          │
    ┌─────┼─────┐             ┌──────┼──────┐             ┌─────┼──────┐
    │     │     │             │      │      │             │     │      │
 Patient Doctor Staff      Hospital Clinic Lab Pharmacy  Hospital Clinic Lab
    │     │     │             │      │      │     │
    │     │     └─────────────┴──────┴──────┴─────┘ (Staff Memberships)
    │     │                          │
    │     └────── Affiliations ──────┘ (Doctor Affiliations)
    │                                │
    └────── Healthcare Encounters ───┘
```

---

## 3. Core Architectural Guarantees
1. **Zero Account Duplication:** If Dr. Sharma works at 3 hospitals, she has exactly 1 Doctor account (`DOC-1001`) with 3 distinct `doctor_affiliations`.
2. **Patient Independence:** Patient `PAT-1001` visiting City Hospital and Green Care Clinic has 1 persistent medical identity and distinct `encounters`.
3. **Open Pharmacy Fulfillment:** Digital Prescriptions are clinical outputs of an encounter and are never locked to a single retail pharmacy.
4. **"Why Was I Charged?" Traceability:** Every item on a bill (`bill_items`) links directly to the clinical event (`consultation`, `lab_order`, `prescription`, `emergency_case`) that generated it.
5. **Cross-Cutting Audit Ledger:** Every critical event generates an immutable `audit_logs` record detailing `WHO`, `WHAT`, `WHEN`, `WHY`, and `STATUS`.

---

## 4. Phase 2 Application Shell & Role Layout System
```
Authentication Session
        ↓
Resolved MEDORA Identity & Role (PAT-1001, DOC-1001, HSP-1001, etc.)
        ↓
Active Organization Context (OrganizationSwitcher for Multi-Hospital Doctors)
        ↓
Application Shell Selection:
        ├── PatientShell:
        │   ├── Mobile-First Consumer Layout (max-w-2xl)
        │   ├── Top Header: Brand + Emergency SOS Badge + Notifications + Profile
        │   ├── Primary Bottom Navigation: Home, Appointments, Records, Emergency
        │   └── "More" Slide-up Drawer: Prescriptions, Reports, Pharmacy, Bills, Care Plans, Profile
        │
        └── ProfessionalShell:
            ├── High-Density Operational Workspace (max-w-7xl)
            ├── Universal TopBar: Logo + Organization Context Switcher + Notifications + User Menu
            ├── Collapsible Workspace Sidebar: Expanded labels / Collapsed icons + active route indicator
            └── Responsive Drawer for tablet/mobile screen widths
```
