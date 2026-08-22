# MEDORA — PHASE 5.1 SPECIFICATION
## ORGANIZATION & HEALTHCARE FACILITY FOUNDATION

---

## 1. Executive Summary

Phase 5.1 establishes the authoritative legal organization and multi-branch healthcare facility foundation for the MEDORA ecosystem. It strictly decouples the legal parent entity (`HealthcareOrganization`, e.g. `ORG-1001` "City Healthcare Group") from physical campuses and branches (`HealthcareFacility`, e.g. `FAC-1001` "City Hospital Bhubaneswar", `FAC-1002` "City Hospital Rourkela", `FAC-1003` "City Hospital Cuttack").

---

## 2. Relational Hierarchy & Invariants

```
ORGANIZATION (Legal Parent, e.g. ORG-1001)
   ├── FACILITY BRANCH 1 (Physical Campus, e.g. FAC-1001 - Bhubaneswar Hub)
   ├── FACILITY BRANCH 2 (Physical Campus, e.g. FAC-1002 - Rourkela Trauma Center)
   └── FACILITY BRANCH 3 (Physical Campus, e.g. FAC-1003 - Cuttack Specialty Center)
```

### Core Invariants:
1. **Entity Separation**: `organization_id` and `facility_id` are separate concepts. An organization can own and operate multiple facilities across geographical regions.
2. **Unified Doctor & Staff Identities**: A practitioner (`DOC-1001`) maintains a single user profile in MEDORA, with distinct affiliations linking them to specific facilities. No duplicate practitioner accounts are created for different hospitals or clinics.
3. **Multi-Tenant Isolation**: Mutations to an organization or facility require verified platform admin or organization-scoped admin credentials. Cross-tenant tampering and IDOR attempts are strictly blocked.
4. **Soft Deactivation & Historical Record Preservation**: Deactivating an organization or facility sets `status: "INACTIVE"` with audit timestamps. Historical clinical encounters (C.1), prescriptions (C.2), lab reports (C.3), appointments (B.1), and longitudinal clinical timelines (C.4) remain intact and immutable.
5. **Real Database-Derived Metrics**: All dashboards compute metrics dynamically from authoritative repositories; no hardcoded statistical counts exist.

---

## 3. Data Model & Architecture

### HealthcareOrganization
| Field | Type | Description |
|---|---|---|
| `id` | `string` (UUID) | Primary Key |
| `identifier` | `string` | Human-readable identifier (e.g. `HSP-1001`, `ORG-1001`) |
| `name` | `string` | Display name of the healthcare organization |
| `legal_name` | `string` | Legal corporate registered entity name |
| `type` | `HealthcareOrganizationType` | `HOSPITAL_GROUP`, `CLINIC_GROUP`, `DIAGNOSTIC_GROUP`, `PHARMACY_GROUP`, `BLOOD_BANK_GROUP`, `HEALTHCARE_NETWORK` |
| `license_no` | `string` | Clinical establishment registration license |
| `phone` | `string` | Primary administrative phone |
| `email` | `string` | Administrative contact email |
| `address` | `string` | Headquarters street address |
| `city` | `string` | Headquarters city |
| `district` | `string` | Headquarters district |
| `state` | `string` | State (e.g. Odisha) |
| `postal_code` | `string` | PIN code |
| `country` | `string` | Country (`India`) |
| `status` | `string` | `ACTIVE`, `INACTIVE`, `PENDING_VERIFICATION`, `SUSPENDED` |
| `verification_status` | `VerificationStatus` | `verified`, `pending`, `rejected` |
| `created_at` | `string` (ISO 8601) | Record creation timestamp |
| `updated_at` | `string` (ISO 8601) | Last modification timestamp |

### HealthcareFacility
| Field | Type | Description |
|---|---|---|
| `id` | `string` (UUID/fac-*) | Primary Key |
| `facility_code` | `string` | Unique branch code (e.g. `FAC-1001`, `HSP-1001-BBSR`) |
| `organization_id` | `string` | Foreign Key to parent `HealthcareOrganization` |
| `organization_identifier`| `string` | Denormalized parent organization identifier |
| `organization_name` | `string` | Denormalized parent organization display name |
| `name` | `string` | Physical campus/branch facility name |
| `type` | `HealthcareFacilityType` | `HOSPITAL`, `CLINIC`, `LABORATORY`, `DIAGNOSTIC_CENTER`, `PHARMACY`, `BLOOD_CENTER` |
| `phone` | `string` | Branch contact phone |
| `emergency_phone` | `string` | 24/7 Emergency response line (e.g. `112`) |
| `address` | `string` | Physical campus street address |
| `city` | `string` | Facility city |
| `state` | `string` | Facility state |
| `postal_code` | `string` | Facility PIN code |
| `operating_hours` | `string` | Operating schedule |
| `status` | `HealthcareFacilityStatus` | `ACTIVE`, `INACTIVE`, `PENDING_VERIFICATION`, `SUSPENDED` |
| `created_at` | `string` (ISO 8601) | Timestamp |

---

## 4. UI Workspaces
- `/admin/organizations`: Full Organization Entity Registry with live multi-facility aggregation, search, type filtering, and creation modal with schema validation.
- `/admin/facilities`: Multi-Branch Facilities & Campuses Desk with parent organization filter, location metadata, live department/doctor counts, and branch onboarding modal.
- `/hospital`: Hospital Command Center with dynamic facility switcher context and real database metrics.

---

## 5. Automated Verification
- Suite: `scripts/test-phase-5-1-organization-facility.ts`
- Result: **27 / 27 Assertions Passing (100%)**
