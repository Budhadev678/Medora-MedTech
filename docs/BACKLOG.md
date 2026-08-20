# 📌 MEDORA — Future Phases Backlog

This document records requirements and architecture intended for subsequent phases, preventing premature phase bleeding.

| Feature Name | Target Phase | Reason Deferred | Dependencies |
| :--- | :---: | :--- | :--- |
| **Patient Health Card & Vitals Tracker** | Phase 3 | Belongs to clinical patient health tracking | Phase 1 Auth & Identity Base |
| **Doctor Live Queue & Token Engine** | Phase 4 & 6 | Belongs to scheduling and OPD workflow | Phase 1 Doctor Affiliations |
| **Hospital Department & Ward Setup UI** | Phase 5 | Belongs to hospital facility management | Phase 1 Organizations Schema |
| **Digital Structured Prescription Authoring** | Phase 7 | Clinical consultation workflow | Phase 1 Open Rx Architecture |
| **Diagnostic Sample Lifecycle & Reports** | Phase 8 | Diagnostic lab execution workflow | Phase 1 Lab Facility Base |
| **Pharmacy Counter Dispensing & Verification** | Phase 9 | Medication fulfillment execution | Phase 1 Open Rx Architecture |
| **Lineage-Backed Itemized Billing ("Why charged?")** | Phase 10 | Financial transparency engine | Phase 7 Rx & Phase 8 Lab |
| **Full Clinical Audit Workflow Explorer** | Phase 11 | Compliance & deep audit analysis | Phase 1 Append-Only Audit Base |
