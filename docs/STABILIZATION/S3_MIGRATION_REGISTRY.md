# S3 MIGRATION REGISTRY & SCHEMA EVOLUTION

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S3 Stabilization Track  
**Focus**: Schema Migrations, Table Definitions & Upgrades  

---

## 1. Schema Version Matrix

| Migration Version | Description | Target Tables | Status |
|---|---|---|---|
| **001_core_identity** | Base identity, users, patients, doctors, facilities | `users`, `patients`, `doctors`, `facilities`, `departments` | **APPLIED** |
| **002_clinical_core** | Encounters, clinical notes, diagnoses, vitals | `encounters`, `clinical_records`, `diagnoses`, `vitals` | **APPLIED** |
| **003_prescriptions** | E-prescriptions, items, dosage rules | `prescriptions`, `prescription_items` | **APPLIED** |
| **004_diagnostics** | Lab orders, items, samples, reports | `lab_orders`, `lab_order_items`, `lab_samples`, `lab_reports`, `lab_report_items` | **APPLIED** |
| **005_pharmacy_suite**| Pharmacy intake, inventory batches, FEFO stock, dispensing | `pharmacy_intakes`, `pharmacy_inventory_items`, `pharmacy_inventory_batches`, `stock_reservations`, `dispensing_records` | **APPLIED** |
| **006_billing_finance**| Service pricing, bills, versioning, financial coverage, payments, allocations | `services`, `service_prices`, `bills`, `bill_items`, `bill_versions`, `financial_coverages`, `payment_intents`, `payment_records`, `payment_allocations`, `refund_records` | **APPLIED** |
| **007_operations_queue**| Doctor working sessions, capacity waitlists, queue entries | `doctor_working_sessions`, `capacity_waitlists`, `queue_entries` | **APPLIED** |
| **008_audit_notifications**| Audit trails, care relationships, notifications | `audit_logs`, `care_relationships`, `notifications` | **APPLIED** |

---

## 2. Table Count & Verification

- **Total SQL Schema Tables in `supabase/schema.sql`**: **52 tables**
- **Total In-Memory Authoritative Data Stores**: **24 stores**
- **PostgreSQL Enum Types Defined**: **18 enums** (`user_role`, `appointment_status`, `encounter_status`, `sample_status`, `bill_status`, `payment_status`, etc.)
- **Row-Level Security (RLS) Coverage**: **100% of tables (52/52)** have RLS enabled with explicit tenant and role policies.
