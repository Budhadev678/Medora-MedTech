# S8 DATABASE & QUERY PERFORMANCE REPORT

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S8 Stabilization Track  
**Focus**: Database Indexing, Query Complexity, N+1 Elimination & Store Throughput  

---

## 1. Index Audit & Key Invariants

1. **Identity & Auth Indexing**:
   - `identities.id` (UUID Primary Key) $\rightarrow$ Hash index ($O(1)$)
   - `identities.identifier` (`PAT-*`, `DOC-*`, `HSP-*`) $\rightarrow$ Unique index ($O(1)$)
   - `identities.email` $\rightarrow$ Unique lowercase index
2. **Clinical & Operational Indexing**:
   - `appointments.session_id` & `appointments.doctor_id` $\rightarrow$ B-Tree composite index
   - `queue_entries.session_id` & `queue_entries.date` $\rightarrow$ Real-time queue index
   - `prescriptions.encounter_id` & `prescriptions.patient_id` $\rightarrow$ Foreign key index
   - `lab_orders.encounter_id` & `lab_orders.patient_id` $\rightarrow$ Foreign key index
   - `bills.encounter_id` & `bills.patient_id` $\rightarrow$ Invariant billing index
3. **N+1 Prevention**:
   - Stores return fully populated aggregates with relational child arrays (e.g. `bill.items`, `prescription.medications`, `labOrder.tests`), eliminating multi-hop waterfall queries.
