# S3 DATABASE & DATA MODEL CHANGELOG

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S3 Stabilization Track  
**Focus**: Schema, Model, & Store Modifications  

---

## 1. Schema & DDL Modifications (`supabase/schema.sql`)

1. **Enum `user_role`**:
   - Added `'receptionist'` role to support front-desk reception, capacity management, and offline registration workflows.
2. **New Relational Tables Added (Tables 39–52)**:
   - `doctor_working_sessions`: Multi-facility doctor shift & capacity definitions.
   - `capacity_waitlists`: Patient waitlist for full working sessions.
   - `queue_entries`: Real-time queue tokens and physical check-in states.
   - `sample_custody_events`: Specimen chain-of-custody tracking.
   - `pharmacy_intakes`: Digital prescription routing to pharmacies.
   - `pharmacy_inventory_items`: Pharmacy catalog items & reorder thresholds.
   - `pharmacy_inventory_batches`: Individual batch numbers, manufacturing dates, expiry dates, unit costs, and remaining quantities.
   - `stock_reservations`: Temporary stock hold during checkout.
   - `dispensing_records`: Certified dispensing verification records.
   - `clinical_followups`: Scheduled medical follow-up consultations.
   - `financial_coverages`: 5-tier waterfall breakdown snapshots.
   - `reconciliation_runs`: Daily financial settlement runs.
   - `financial_exceptions`: Billing and payment discrepancy records.
   - `refund_records`: Approved payment refunds and reversals.
   - `care_relationships`: Patient-doctor ongoing care associations.
   - `notifications`: Multi-channel system notification logs.
3. **Comprehensive Row-Level Security (RLS)**:
   - Added `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and explicit tenant / user role access policies for all newly added tables.

---

## 2. In-Memory Data Store & Service Modifications

1. **`lib/services/pharmacy-inventory-service.ts`**:
   - Enhanced `evaluatePharmacyAvailability` to accept `prescriptionOrId: HealthcarePrescription | string` for robust multi-caller compatibility.
2. **`lib/data/payment-store.ts`**:
   - Exported `getPaymentIntentById(id: string)` to allow direct lookup of payment intents by their canonical identifier.
3. **`lib/services/payment-processing-service.ts`**:
   - Updated `executePaymentAttempt` to resolve payment intents by either ID or idempotency key.
4. **`scripts/test-phase-s3-database-integrity.ts`**:
   - Created comprehensive 10-group database integrity test suite validating primary key uniqueness, doctor multi-facility sessions, clinical cascades, sample custody, FEFO inventory, itemized billing, and balance invariance.
