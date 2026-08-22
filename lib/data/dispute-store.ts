// ============================================================
// MEDORA — FINANCIAL DISPUTES & ANOMALIES REPOSITORY (PHASE 10.4)
// Authoritative Store for Financial Disputes, System Anomalies & Investigations
// ============================================================

import type {
  FinancialDispute,
  FinancialAnomaly,
  FinancialInvestigation,
  DisputeResolution,
} from "@/types/database.types";

let DISPUTES_STORE: FinancialDispute[] = [
  {
    id: "DISP-1001",
    dispute_number: "MEDORA-DISP-1001",
    patient_id: "PAT-1001",
    patient_name: "Rahul Verma",
    organization_id: "11111111-1111-1111-1111-111111111101",
    facility_id: "FAC-1001",
    bill_id: "BILL-1001",
    bill_item_id: "BILLITEM-1002",
    category: "UNRECOGNIZED_CHARGE",
    description: "Patient inquired regarding necessity and provenance of MRI Brain charge",
    status: "UNDER_REVIEW",
    priority: "MEDIUM",
    created_at: "2026-08-21T10:00:00Z",
    updated_at: "2026-08-21T10:00:00Z",
  },
];

let ANOMALIES_STORE: FinancialAnomaly[] = [];
let INVESTIGATIONS_STORE: FinancialInvestigation[] = [];
let RESOLUTIONS_STORE: DisputeResolution[] = [];

// ============================================================
// QUERIES
// ============================================================

export function getAllDisputes(): FinancialDispute[] {
  return [...DISPUTES_STORE];
}

export function getDisputeById(id: string): FinancialDispute | null {
  const clean = (id || "").trim().toLowerCase();
  return DISPUTES_STORE.find((d) => d.id.toLowerCase() === clean || d.dispute_number.toLowerCase() === clean) || null;
}

export function getDisputesByPatient(patientId: string): FinancialDispute[] {
  const clean = (patientId || "").trim().toLowerCase();
  return DISPUTES_STORE.filter((d) => d.patient_id.toLowerCase() === clean);
}

export function getAllAnomalies(): FinancialAnomaly[] {
  return [...ANOMALIES_STORE];
}

export function getInvestigationByDisputeId(disputeId: string): FinancialInvestigation | null {
  const clean = (disputeId || "").trim().toLowerCase();
  return INVESTIGATIONS_STORE.find((i) => (i.dispute_id || "").toLowerCase() === clean) || null;
}

export function getResolutionsForDispute(disputeId: string): DisputeResolution[] {
  const clean = (disputeId || "").trim().toLowerCase();
  return RESOLUTIONS_STORE.filter((r) => r.dispute_id.toLowerCase() === clean);
}

// ============================================================
// MUTATIONS
// ============================================================

export function saveDispute(dispute: FinancialDispute): void {
  const idx = DISPUTES_STORE.findIndex((d) => d.id === dispute.id);
  if (idx >= 0) DISPUTES_STORE[idx] = dispute;
  else DISPUTES_STORE.push(dispute);
}

export function saveAnomaly(anomaly: FinancialAnomaly): void {
  const idx = ANOMALIES_STORE.findIndex((a) => a.id === anomaly.id);
  if (idx >= 0) ANOMALIES_STORE[idx] = anomaly;
  else ANOMALIES_STORE.push(anomaly);
}

export function saveInvestigation(investigation: FinancialInvestigation): void {
  const idx = INVESTIGATIONS_STORE.findIndex((i) => i.id === investigation.id);
  if (idx >= 0) INVESTIGATIONS_STORE[idx] = investigation;
  else INVESTIGATIONS_STORE.push(investigation);
}

export function saveDisputeResolution(resolution: DisputeResolution): void {
  RESOLUTIONS_STORE.push(resolution);
}
