// ============================================================
// MEDORA — PROTOTYPE EXTERNAL / GOVERNMENT ESCALATION STORE
// Authoritative Store for Prototype External Grievance Cases
// Clearly labeled as prototype/demo reference without fake live government claims
// ============================================================

import type { ExternalDisputeCase } from "@/types/database.types";
export type { ExternalDisputeCase };

let EXTERNAL_CASES_STORE: ExternalDisputeCase[] = [];

const STORAGE_KEY = "medora_external_dispute_cases_v1";

export function getAllExternalCases(): ExternalDisputeCase[] {
  if (typeof window === "undefined") return [...EXTERNAL_CASES_STORE];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...EXTERNAL_CASES_STORE];
    const parsed = JSON.parse(raw);
    EXTERNAL_CASES_STORE = Array.isArray(parsed) ? parsed : EXTERNAL_CASES_STORE;
    return [...EXTERNAL_CASES_STORE];
  } catch {
    return [...EXTERNAL_CASES_STORE];
  }
}

export function getExternalCaseById(id: string): ExternalDisputeCase | null {
  const clean = (id || "").trim().toLowerCase();
  const all = getAllExternalCases();
  return all.find((c) => c.external_case_id.toLowerCase() === clean || c.dispute_id.toLowerCase() === clean) || null;
}

export function getExternalCasesByPatient(patientId: string): ExternalDisputeCase[] {
  const clean = (patientId || "").trim().toLowerCase();
  const all = getAllExternalCases();
  return all.filter((c) => c.patient_id.toLowerCase() === clean);
}

export function saveExternalCase(externalCase: ExternalDisputeCase): void {
  const all = getAllExternalCases();
  const idx = all.findIndex((c) => c.external_case_id === externalCase.external_case_id);
  if (idx >= 0) {
    all[idx] = externalCase;
  } else {
    all.unshift(externalCase);
  }
  EXTERNAL_CASES_STORE = all;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      window.dispatchEvent(new Event("medora-external-disputes-updated"));
    } catch (e) {
      console.error("Failed to persist external dispute cases:", e);
    }
  }
}
