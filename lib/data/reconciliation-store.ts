// ============================================================
// MEDORA — RECONCILIATION REPOSITORY (PHASE 10.3)
// Authoritative Store for Reconciliation Runs & Financial Exceptions
// ============================================================

import type { ReconciliationRun, FinancialException } from "@/types/database.types";

let RECONCILIATION_RUNS_STORE: ReconciliationRun[] = [
  {
    id: "RECON-2026-08-20-001",
    run_number: "MEDORA-RECON-1001",
    organization_id: "11111111-1111-1111-1111-111111111101",
    facility_id: "FAC-1001",
    period_start: "2026-08-20T00:00:00Z",
    period_end: "2026-08-20T23:59:59Z",
    status: "COMPLETED",
    matched_total: 14000.00,
    exception_total: 0.00,
    performed_by_id: "USR-FIN-01",
    performed_by_name: "Finance Auditor Ramesh",
    started_at: "2026-08-21T00:10:00Z",
    completed_at: "2026-08-21T00:15:00Z",
  },
];

let EXCEPTIONS_STORE: FinancialException[] = [];

// ============================================================
// QUERIES
// ============================================================

export function getAllReconciliationRuns(): ReconciliationRun[] {
  return [...RECONCILIATION_RUNS_STORE];
}

export function getReconciliationRunById(id: string): ReconciliationRun | null {
  const clean = (id || "").trim().toLowerCase();
  return RECONCILIATION_RUNS_STORE.find((r) => r.id.toLowerCase() === clean) || null;
}

export function getExceptionsForRun(reconId: string): FinancialException[] {
  const clean = (reconId || "").trim().toLowerCase();
  return EXCEPTIONS_STORE.filter((e) => e.reconciliation_id.toLowerCase() === clean);
}

export function getAllFinancialExceptions(): FinancialException[] {
  return [...EXCEPTIONS_STORE];
}

// ============================================================
// MUTATIONS
// ============================================================

export function saveReconciliationRun(run: ReconciliationRun): void {
  const idx = RECONCILIATION_RUNS_STORE.findIndex((r) => r.id === run.id);
  if (idx >= 0) RECONCILIATION_RUNS_STORE[idx] = run;
  else RECONCILIATION_RUNS_STORE.push(run);
}

export function saveFinancialException(exception: FinancialException): void {
  const idx = EXCEPTIONS_STORE.findIndex((e) => e.id === exception.id);
  if (idx >= 0) EXCEPTIONS_STORE[idx] = exception;
  else EXCEPTIONS_STORE.push(exception);
}
