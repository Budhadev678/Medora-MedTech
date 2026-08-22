# MEDORA — S1 TERMINOLOGY REGISTRY
## Stabilization Track — S1 Document 11 of 15

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Date**: August 2026  
**Status**: VERIFIED AUDIT

---

## Technical Terms Requiring Simple Language Conversion

These terms appear on patient-facing screens and should be converted to simple language:

| Technical Term | Appears In | Suggested Simple Language |
|---|---|---|
| Encounter | Consultation pages, billing | Doctor Visit / Appointment Record |
| Encounter Status | Patient timeline | Visit Status |
| Settlement | Payment screens | Payment Confirmation |
| Reconciliation | Finance pages | Payment Verification |
| 3-Way Reconciliation | Hospital finance | Bill-Payment Matching |
| Anomaly | Dispute investigation | Billing Issue / Discrepancy |
| Anomaly Graph | Hospital finance | Issue Tracker |
| Idempotency Key | Internal logs | Reference Number |
| FEFO (First Expiry First Out) | Pharmacy screens | Stock Rotation |
| Chain of Custody | Lab sample tracking | Sample Tracking |
| Pathologist Verification | Lab reports | Doctor-Confirmed Results |
| Clinical Impression | Lab reports | Doctor's Assessment |
| Maker-Checker | Billing service | Approval Workflow |
| Financial Waterfall | Coverage calculation | Coverage Breakdown |
| Break-Glass Access | Emergency access | Emergency Medical Access |
| RLS (Row Level Security) | Internal | Data Protection |
| Provider ID | All services | Doctor ID |
| Triage Level | Emergency | Emergency Priority |
| OPD | Billing, hospital | Outpatient Department |
| E-Prescription | Pharmacy | Digital Prescription |
| Dispensing | Pharmacy | Medication Handover |
| Fulfillment | Pharmacy | Order Completion |
| Intake | Pharmacy, Lab | Order Received |

---

## Terminology Consistency Issues

| Issue | Current Usage | Should Be |
|---|---|---|
| Patient identifier inconsistency | Some screens say "PAT-1001", others show full name | Standardize display format |
| Organization vs Hospital | Used interchangeably | "Hospital" for patient-facing, "Organization" for admin |
| Facility vs Campus vs Branch | Mixed usage | "Branch" for patient-facing |
| Bill vs Invoice | Both appear | "Hospital Bill" for patients |
| Staff vs Employee | Both appear | "Staff Member" consistently |

---

## Localization File Status

- **File**: `lib/localization.ts` — 29,796 bytes
- **Status**: EXISTS but NOT WIRED to any UI component
- **Contains**: Translation strings for multiple languages
- **Action Needed**: Wire to UI components for multi-language support
