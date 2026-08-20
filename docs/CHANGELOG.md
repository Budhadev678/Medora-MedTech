# 📝 MEDORA — Engineering Changelog

## [2026-08-20] — Master Ecosystem Architecture & Connectivity Model
### Added
- **Canonical Ecosystem Entity Hierarchy:** Defined Category A (Identities), Category B (Relationships), Category C (Healthcare Events), and Category D (Financial & Governance Events) in `types/database.types.ts` and `supabase/schema.sql`.
- **Doctor Multi-Hospital Affiliations:** Many-to-Many relationship model (`doctor_affiliations`) decoupling Doctor identities from single hospital ownership.
- **Multi-Branch Facility Model:** Distinguishes parent Organization entities (e.g. City Hospital Group) from physical Branches (`HSP-1001-BBSR`, `HSP-1001-ROU`, `HSP-1001-CTC`).
- **Open Prescription Architecture:** Decoupled prescription creation from pharmacy fulfillment.
- **Traceable Billing Architecture:** Every `bill_item` references its underlying medical event (`linked_event_type`, `linked_event_id`) to power "Why Was I Charged?".
- **Doctor & Hospital Interactive Workspaces:** Added "My Hospital Affiliations" tab and "Request New Affiliation" modal in `/doctor`, and "Affiliated Doctors" roster with 1-click `[Approve]`, `[Reject]`, `[End Affiliation]` and "Invite Doctor" in `/hospital`.

### Verified
- Zero cross-account data leakage across all 14 ecosystem test personas.
- Strict session invalidation on logout.
- 0 TypeScript compilation errors (`tsc --noEmit`).
- All 20 Next.js routes compiled and building cleanly.
