# S5 NAVIGATION BUG REGISTRY

**Project**: MEDORA — Transparent Connected Healthcare Ecosystem  
**Track**: S5 Stabilization Track  
**Focus**: Navigation Defects, Broken Links, Sidebar Gaps & Fixes  

---

## 1. Resolved Navigation Issues

| Bug ID | Component | Severity | Description | Fix Applied | Status |
|---|---|---|---|---|---|
| **S5-NAV-001** | `role-sidebar.tsx` | High | Lab sidebar item hardcoded `SMP-1001` (`/lab/samples/SMP-1001`) instead of general samples queue (`/lab/samples`) | Updated link to `/lab/samples` | **RESOLVED** |
| **S5-NAV-002** | `role-sidebar.tsx` | High | Lab sidebar lacked links for Report Verification and Released Reports | Added `/lab/verification` and `/lab/reports` navigation items | **RESOLVED** |
| **S5-NAV-003** | `role-sidebar.tsx` | High | Pharmacy sidebar lacked direct links for Order Preparation and Pickup queue | Added `/pharmacy/preparation`, `/pharmacy/pickup`, and `/pharmacy/dispensing` | **RESOLVED** |
| **S5-NAV-004** | `role-sidebar.tsx` | Medium | Hospital sidebar lacked direct link to Appointments desk | Added `{ label: "Appointments Desk", href: "/hospital/appointments" }` | **RESOLVED** |
| **S5-NAV-005** | `role-sidebar.tsx` | Medium | Doctor sidebar lacked direct link to My Patients directory | Added `{ label: "My Patients", href: "/doctor/patients" }` | **RESOLVED** |
| **S5-NAV-006** | `constants.ts` | Medium | `ROLE_DASHBOARD_ROUTES.emergency_staff` mapped to `/ambulance` instead of `/emergency` | Updated mapping to `/emergency` | **RESOLVED** |
| **S5-NAV-007** | `role-bottom-nav.tsx` | Low | Missing explicit aria labels on mobile bottom navigation tabs | Added `aria-label="Patient Bottom Navigation"` for accessibility | **RESOLVED** |
