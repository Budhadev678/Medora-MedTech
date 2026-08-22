# 📄 MEDORA Phase 10.1 Documentation

## Billing Engine, Itemized Bill, Service Linkage & "Why Was I Charged?"

**Master Phase**: PHASE 10 — Itemized Billing & Financial Transparency  
**Current Sub-Phase**: PHASE 10.1  
**Status**: `COMPLETED & 100% VERIFIED`  
**Test Suite Pass**: 18/18 Assertions Passed (100%)

---

## 1. Executive Summary

Phase 10.1 establishes the core billing engine for MEDORA. Unlike traditional hospital billing software that allows arbitrary financial figures to be typed in, MEDORA mandates that every billable item must be traceable back to an authoritative healthcare service event.

### Key Capabilities Built
- **Decoupled Architecture**:
  - `SERVICE` $\neq$ `SERVICE EVENT` $\neq$ `PRICE` $\neq$ `BILLABLE ITEM` $\neq$ `BILL` $\neq$ `PAYMENT`.
- **Service Catalog & Price Catalog (`service_catalog`, `service_prices`)**:
  - Service categories: `CONSULTATION`, `LABORATORY`, `IMAGING`, `PROCEDURE`, `ROOM`, `PHARMACY`, `NURSING`, `OTHER`.
  - Versioned price list (`unit_price`, `effective_from`, `effective_to`). Preserves historical prices.
- **Source-Linked Billable Items (`BILLITEM-xxxx`)**:
  - Strict provenance linking to `ENCOUNTER`, `LAB_TEST`, `IMAGING`, `PROCEDURE`, `DISPENSING`, or `ADMISSION`.
  - Flags unvalidated/orphan entries as `BILLING_EXCEPTION`.
- **Bill Lifecycle & Controlled State Machine**:
  - `DRAFT` $\rightarrow$ `PENDING_REVIEW` $\rightarrow$ `ISSUED` $\rightarrow$ `ADJUSTMENT_PENDING` $\rightarrow$ `DISPUTED` $\rightarrow$ `CANCELLED`.
  - Type distinction: `ESTIMATE` (range estimation, NOT an amount owed) vs `FINAL` (authoritative charge).
- **Bill Versioning Engine (`BILL-1001 V1` $\rightarrow$ `V2`)**:
  - Preserves full version history with mandatory change reason, change delta calculation, and authorized actor attribution. Prevents silent edits.
- **"Why Was I Charged?" Provenance Chain**:
  - Traceability chain: `Doctor` $\rightarrow$ `Order` $\rightarrow$ `Service Event` $\rightarrow$ `Report/Dispensing` $\rightarrow$ `Bill Item`.

---

## 2. Technical Architecture & File Map

| Component | File Path | Description |
| :--- | :--- | :--- |
| **Types** | [`types/database.types.ts`](file:///c:/Users/Dell/Downloads/Medora-MedTech/types/database.types.ts) | Service catalog, bill, item, version & provenance interfaces |
| **Catalog Store** | [`lib/data/billing-catalog-store.ts`](file:///c:/Users/Dell/Downloads/Medora-MedTech/lib/data/billing-catalog-store.ts) | Service master catalog and versioned price list repository |
| **Billing Store** | [`lib/data/billing-store.ts`](file:///c:/Users/Dell/Downloads/Medora-MedTech/lib/data/billing-store.ts) | Authoritative repository for bills (`BILL-1001`), items & versions |
| **Domain Service** | [`lib/services/billing-engine-service.ts`](file:///c:/Users/Dell/Downloads/Medora-MedTech/lib/services/billing-engine-service.ts) | Server-authoritative bill generation, provenance compiler & versioning engine |
| **Hospital Console**| [`app/hospital/billing/page.tsx`](file:///c:/Users/Dell/Downloads/Medora-MedTech/app/hospital/billing/page.tsx) | Hospital Billing Command Console & Draft/Issue Manager |
| **Hospital Desk** | [`app/hospital/billing/[billId]/page.tsx`](file:///c:/Users/Dell/Downloads/Medora-MedTech/app/hospital/billing/[billId]/page.tsx) | Hospital Bill Workspace, Itemization & Version History |
| **Test Suite** | [`scripts/test-phase-10-1-billing-engine.ts`](file:///c:/Users/Dell/Downloads/Medora-MedTech/scripts/test-phase-10-1-billing-engine.ts) | Automated Phase 10.1 test suite (18/18 passed) |

---
