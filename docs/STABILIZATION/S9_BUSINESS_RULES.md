# S9 BUSINESS RULE REGISTRY

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S9 Stabilization Track  
**Focus**: Authoritative Business Rules & Validation Constraints  

---

## 1. Registered Business Rules

| Rule ID | Module | Domain | Business Rule Statement | Enforcement Layer | Status |
|---|---|---|---|---|---|
| **BR-001** | Phase 1 | Identity | Every persona must possess a valid unique identifier (`PAT-*`, `DOC-*`, `HSP-*`, etc.) and RFC-compliant email | Server Store | **ENFORCED** |
| **BR-002** | Phase 4 & 5 | Doctor Affiliation | A doctor may only conduct working sessions at hospital facilities where an active practice affiliation exists | Store / API | **ENFORCED** |
| **BR-003** | Phase 6 | Appointment | An appointment must bind an authentic patient, doctor, session, and slot time without overbooking capacity | Store / API | **ENFORCED** |
| **BR-004** | Phase 6 | Queue | Check-in creates an incremental token associated strictly with today's clinic schedule | Queue Engine | **ENFORCED** |
| **BR-005** | Phase 7 | Consultation | Encounter requires a non-empty clinical reason for visit and valid doctor credential | Encounter Service | **ENFORCED** |
| **BR-006** | Phase 7 | Prescriptions | Prescribed medications must contain medicine name, dosage, frequency, and duration | Rx Store | **ENFORCED** |
| **BR-007** | Phase 8 | Laboratory | Specimen samples must maintain foreign key binding to parent lab order | Sample Store | **ENFORCED** |
| **BR-008** | Phase 9 | Pharmacy | Dispensing requires FEFO batch allocation and patient OTP verification | Pharmacy Engine | **ENFORCED** |
| **BR-009** | Phase 10 | Billing | Bill gross total must exactly equal the arithmetic sum of itemized line charges | Billing Engine | **ENFORCED** |
| **BR-010** | Phase 10 | Coverage | 5-Tier coverage waterfall discounts must never result in negative patient liability | Financial Service | **ENFORCED** |
