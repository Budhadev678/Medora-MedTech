# 📱 MEDORA — Master Screen Inventory & Screen Tracking Matrix

This document catalogs every screen in the MEDORA platform across all roles.

---

## 🖥️ Screen Catalog

| Screen ID | Role | Route | Purpose | Status | Key Components | API / Service | DB Dependencies |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| `SCR-AUTH-01` | Public | `/login` | Multi-role unified sign in | `VERIFIED` | `LoginForm`, `DemoRoleLauncher` | `auth-context.login` | `profiles` |
| `SCR-AUTH-02` | Public | `/register` | Patient registration & onboarding | `VERIFIED` | `RegisterForm`, `ABHAStepper` | `auth-context.register`| `profiles`, `patients` |
| `SCR-PAT-01` | Patient | `/patient` | Patient home dashboard & pending actions | `IMPLEMENTED` | `UpcomingCard`, `PendingActions`, `QuickActions` | `patientService.getHome` | `patients`, `appointments`, `bills` |
| `SCR-PAT-02` | Patient | `/patient/profile` | Vitals, Emergency Card & ABHA ID | `NOT_STARTED` | `EmergencyCard`, `VitalsForm`, `ABHABadge` | `patientService.getProfile`| `patients` |
| `SCR-PAT-03` | Patient | `/patient/appointments` | Doctor discovery & slot booking | `NOT_STARTED` | `DoctorCard`, `SlotPicker`, `TokenBadge` | `appointmentService.book` | `doctors`, `appointments` |
| `SCR-PAT-04` | Patient | `/patient/health` | Healthcare timeline, Rx, Lab reports | `NOT_STARTED` | `TimelineView`, `PrescriptionCard`, `LabReportModal` | `healthService.getTimeline` | `prescriptions`, `lab_reports`, `timeline_events` |
| `SCR-PAT-05` | Patient | `/patient/bills` | Itemized bills & "Why was I charged?" | `NOT_STARTED` | `InvoiceCard`, `TraceabilityDrawer`, `DisputeDialog` | `billingService.getBills` | `bills`, `bill_items`, `bill_versions` |
| `SCR-DOC-01` | Doctor | `/doctor` | Clinical queue, schedule & availability | `IMPLEMENTED` | `QueueTable`, `DutyToggle`, `ScheduleCard` | `doctorService.getQueue` | `doctors`, `appointments` |
| `SCR-DOC-02` | Doctor | `/doctor/consult/[id]` | Digital consultation & Rx builder | `NOT_STARTED` | `ClinicalNotes`, `RxBuilder`, `LabOrderPicker` | `consultationService.save`| `consultations`, `prescriptions`, `lab_orders` |
| `SCR-DOC-03` | Doctor | `/doctor/patients/[id]`| Patient history & authorized records | `NOT_STARTED` | `HistoryTabs`, `AllergyAlert`, `ReportViewer` | `doctorService.getHistory` | `patients`, `consultations` |
| `SCR-HOSP-01`| Hospital | `/hospital` | Command center & bed occupancy | `IMPLEMENTED` | `OccupancyStats`, `DoctorRoster`, `DeptCards` | `hospitalService.getStats` | `hospitals`, `departments`, `doctors` |
| `SCR-LAB-01` | Lab Staff| `/lab` | Test orders intake & sample queue | `IMPLEMENTED` | `LabOrdersTable`, `SampleIntakeModal` | `labService.getOrders` | `lab_orders`, `samples` |
| `SCR-LAB-02` | Lab Staff| `/lab/reports/[id]` | Result values entry & report approval | `NOT_STARTED` | `ResultEntryForm`, `ApprovalDialog` | `labService.approveReport`| `lab_results`, `lab_reports` |
| `SCR-PHARM-01`| Pharmacy| `/pharmacy` | Rx queue, packaging & Medora ID dispense | `IMPLEMENTED` | `RxQueueCard`, `MedoraIdScanner`, `DispenseLog` | `pharmacyService.dispense` | `prescriptions`, `dispensing_records` |
| `SCR-EMERG-01`| Emergency| `/emergency` | Triage board & doctor auto-escalation | `IMPLEMENTED` | `TriageBoard`, `DoctorAvailabilityList`, `UrgentBloodModal` | `emergencyService.triage` | `emergency_cases`, `doctors`, `blood_requests` |
| `SCR-FIN-01` | Finance | `/finance` | Invoice audit, insurance split & disputes | `IMPLEMENTED` | `BillAuditTable`, `ClaimsSplitter`, `DisputeResolver` | `financeService.getAudit` | `bills`, `insurance_claims`, `disputes` |
| `SCR-ADMIN-01`| Admin | `/admin` | Master audit explorer & system security | `IMPLEMENTED` | `AuditLogTable`, `RoleAssignmentGrid` | `adminService.getAuditLogs`| `audit_logs`, `profiles` |

---

## 🎯 Screen Lifecycle Definitions
- `NOT_STARTED` ⬜: Defined in architecture, not yet implemented.
- `DESIGNED` 🎨: UI structure and component hierarchy finalized.
- `IMPLEMENTED` 🔨: Responsive Next.js page built with active state handlers.
- `TESTING` 🧪: Verification across mobile/desktop, edge cases, and empty states.
- `VERIFIED` ✅: End-to-end integration verified within the connected healthcare journey.
