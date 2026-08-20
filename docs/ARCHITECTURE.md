# 🏛️ MEDORA — Master Ecosystem Relationship & Architectural Specification

> **Core Axiom:** Every person, organization, facility, medical event, financial transaction, and emergency event is an independent database entity linked through explicit relational foreign keys. Never connect things using hardcoded strings, comma-separated lists, or frontend-only state.

---

## 1. Master Ecosystem Hierarchy

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

## 2. Four Canonical Entity Categories

### Category A — Identities (People & Organizations)
* **People:** Patient (`PAT-1001`), Doctor (`DOC-1001`), Healthcare Staff (`STAFF-1001`), Pharmacist, Lab Technician, Emergency Dispatcher, Administrator (`ADM-1001`).
* **Organizations (Legal Entities):** Hospital (`HSP-1001`), Clinic (`CLN-1001`), Laboratory (`LAB-1001`), Pharmacy (`PHA-1001`), Blood Centre (`BLC-1001`), Insurance (`INS-1001`), Financing Partner (`FIN-1001`), Government Directorate (`GOV-1001`), Ambulance Provider (`AMB-1001`).
* **Facilities (Physical Branches):** Distinguishes parent organization entities from physical hospital campuses (e.g. City Hospital Group $\rightarrow$ `HSP-1001-BBSR` Bhubaneswar Main Hub, `HSP-1001-ROU` Rourkela Branch, `HSP-1001-CTC` Cuttack Specialty Center).

---

### Category B — Relationships (Many-to-Many & Contextual)
* **Doctor ↔ Hospital/Clinic (`doctor_affiliations`):** 1 Doctor UUID $\rightarrow$ multiple hospital appointments with distinct consultation fees, OPD rooms, and schedule allocations.
* **Staff ↔ Organization (`staff_memberships`):** Clinical and operational staff appointments.
* **Hospital ↔ Laboratory/Pharmacy/Blood Bank (`facility_partnerships`):** Connects internal or external service networks.
* **Patient ↔ Insurance Provider (`insurance_policies`):** Policy numbers and coverage limits.
* **Patient ↔ Medical Access Grant (`consent_records`):** Patient-controlled access grants specifying duration, purpose, and allowed clinical scopes.

---

### Category C — Healthcare Events & Clinical Lifecycle

```
Patient
   ↓
Appointment (APT-1001)
   ↓
Encounter (ENC-1001) ─── Facility + Department + Doctor
   ↓
Consultation (Chief Complaint, Vitals, Assessment, Treatment Plan)
   ├── Digital Prescription (RX-1001) ─── Open Fulfillment ──→ Selected Pharmacy (Dispensing)
   │
   └── Lab Order (LAB-ORD-1024) ────────→ Laboratory (Sample → Test → Pathologist Certified Report)
```

---

### Category D — Financial Lineage & Governance

```
                         Clinical Encounter (ENC-1001)
                                      │
                                      ▼
                             Transparent Bill (BIL-1001)
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            ▼                         ▼                         ▼
   Insurance Claim (CLM-1001)  Government Subsidy        Charity Discount
   (Pre-Auth & Approved)       (BSKY / PM-JAY)           (Hospital Welfare)
            │                         │                         │
            └─────────────────────────┼─────────────────────────┘
                                      ▼
                            CarePay Micro-Financing
                                      ▼
                           Patient Net Contribution
                                      │
                                      ▼
                        Receipt & Payment (RCP-1001)
                                      │
                                      ▼
                        Immutable Audit Log (AUD-1001)
```

---

## 3. Core Architectural Guarantees
1. **Zero Account Duplication:** If Dr. Sharma works at 3 hospitals, she has exactly 1 Doctor account (`DOC-1001`) with 3 distinct `doctor_affiliations`.
2. **Patient Independence:** Patient `PAT-1001` visiting City Hospital and Green Care Clinic has 1 persistent medical identity and distinct `encounters`.
3. **Open Pharmacy Fulfillment:** Digital Prescriptions are clinical outputs of an encounter and are never locked to a single retail pharmacy.
4. **"Why Was I Charged?" Traceability:** Every item on a bill (`bill_items`) links directly to the clinical event (`consultation`, `lab_order`, `prescription`, `emergency_case`) that generated it.
5. **Cross-Cutting Audit Ledger:** Every critical event generates an immutable `audit_logs` record detailing `WHO`, `WHAT`, `WHEN`, `WHY`, and `STATUS`.
