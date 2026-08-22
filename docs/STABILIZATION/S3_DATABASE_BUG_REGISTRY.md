# S3 DATABASE BUG REGISTRY

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S3 Stabilization Track  
**Focus**: Database Inconsistencies, Schema Gaps & Fix Tracking  

---

## 1. Resolved Database & Schema Issues

| Bug ID | Component | Severity | Description | Root Cause | Fix Applied | Status |
|---|---|---|---|---|---|---|
| **S3-BUG-001** | `user_role` enum | High | Missing `'receptionist'` role enum in PostgreSQL schema | Schema enum had only `patient`, `doctor`, `nurse`, `lab_technician`, `pharmacist`, `billing_admin`, `admin`, `system` | Added `'receptionist'` to `user_role` enum in `supabase/schema.sql` | **RESOLVED** |
| **S3-BUG-002** | `schema.sql` RLS | Medium | Redundant duplicate `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` block at the end of SQL script | Copy-paste duplication during Phase 8 schema expansion | Replaced duplicate block with missing production tables 39–52 | **RESOLVED** |
| **S3-BUG-003** | Schema Tables 39–52 | Critical | Missing SQL tables for doctor working sessions, queue entries, custody events, pharmacy inventory batches, clinical followups, waterfall coverages | Schema was partially generated up to Table 38 | Added complete SQL table definitions 39–52 with all indexes and RLS policies | **RESOLVED** |
| **S3-BUG-004** | `pharmacy-inventory-service.ts` | High | `evaluatePharmacyAvailability` expected full `HealthcarePrescription` object, failing when caller passed prescription ID string | Parameter typing too restrictive | Updated method to accept `HealthcarePrescription | string` and resolve via `getPrescriptionById` | **RESOLVED** |
| **S3-BUG-005** | `payment-store.ts` | Medium | Missing `getPaymentIntentById` causing intent lookup to fail when queried by intent ID rather than idempotency key | Only `getPaymentIntentByIdempotencyKey` existed | Added `getPaymentIntentById` to `payment-store.ts` and updated `PaymentProcessingService.executePaymentAttempt` | **RESOLVED** |
| **S3-BUG-006** | Billing Item Price Field | Medium | Ambiguity between `base_amount` and `unit_price * quantity` | `BillableItem` in TypeScript uses `unit_price` and `base_amount` rather than `total_price` | Standardized calculation across services: `base_amount || (quantity * unit_price)` | **RESOLVED** |
| **S3-BUG-007** | Payment Total Invariance | Critical | Risk of payments mutating `bill.gross_total` rather than allocating against balance | Overwriting bill total destroys historical invoicing records | Enforced bill gross total invariance; payments create separate allocation records | **RESOLVED** |
