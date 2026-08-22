# S6 UI/UX BUG REGISTRY

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S6 Stabilization Track  
**Focus**: Visual Defects, Formatting Inconsistencies & Responsive Fixes  

---

## 1. Resolved UI/UX Issues

| Bug ID | Component | Severity | Description | Fix Applied | Status |
|---|---|---|---|---|---|
| **S6-UI-001** | `lib/utils.ts` | Medium | Unformatted currency numbers in billing cards displayed without `₹` Indian Rupee symbol | Standardized `formatCurrency` across all bill itemization cards and payment summaries | **RESOLVED** |
| **S6-UI-002** | `components/ui/status-badge.tsx` | Medium | Status badges relied solely on background colors without semantic icons on certain status tags | Added Lucide icons for all 20+ statuses ensuring multi-modal accessibility | **RESOLVED** |
| **S6-UI-003** | `components/shared/role-sidebar.tsx` | Medium | Sidebar collapse toggle lacked accessible aria-labels and titles | Added `aria-label` and `title` to collapse toggle button | **RESOLVED** |
| **S6-UI-004** | `components/shared/role-bottom-nav.tsx` | Low | Missing explicit navigation landmark aria-label on mobile bottom navigation | Added `aria-label="Patient Bottom Navigation"` | **RESOLVED** |
| **S6-UI-005** | `components/ui/table.tsx` | Low | Missing responsive overflow wrapping on data tables causing horizontal viewport clipping on mobile | Added `relative w-full overflow-auto` container wrapping | **RESOLVED** |
