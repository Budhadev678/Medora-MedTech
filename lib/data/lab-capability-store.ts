// ============================================================
// MEDORA — LAB TEST CATALOG & CAPABILITY MAPPING REPOSITORY (PHASE 8.1)
// Master Test Catalog & Facility-Specific Capability Store
// ============================================================

import type { LabTestMaster, LaboratoryCapability, CapabilityStatus, SampleType } from "@/types/database.types";
import { appendAuditEvent } from "@/lib/data/audit-store";

let MASTER_TEST_CATALOG: LabTestMaster[] = [
  {
    id: "TEST-CBC-001",
    code: "CBC-01",
    name: "Complete Blood Count (CBC)",
    category: "Hematology",
    specimen_type: "WHOLE_BLOOD",
    description: "Evaluates red blood cells, white blood cells, hemoglobin, hematocrit, and platelets.",
    status: "ACTIVE",
    created_at: "2026-08-01T09:00:00Z",
    updated_at: "2026-08-01T09:00:00Z",
  },
  {
    id: "TEST-LIP-001",
    code: "LIP-01",
    name: "Fasting Lipid Profile Panel",
    category: "Biochemistry",
    specimen_type: "SERUM",
    description: "Measures total cholesterol, HDL, LDL, VLDL, and triglycerides.",
    status: "ACTIVE",
    created_at: "2026-08-01T09:00:00Z",
    updated_at: "2026-08-01T09:00:00Z",
  },
  {
    id: "TEST-GLU-001",
    code: "GLU-01",
    name: "Fasting Blood Glucose (FBS)",
    category: "Biochemistry",
    specimen_type: "PLASMA",
    description: "Quantitative measurement of blood plasma glucose levels after overnight fasting.",
    status: "ACTIVE",
    created_at: "2026-08-01T09:00:00Z",
    updated_at: "2026-08-01T09:00:00Z",
  },
  {
    id: "TEST-LFT-001",
    code: "LFT-01",
    name: "Liver Function Test (LFT Panel)",
    category: "Biochemistry",
    specimen_type: "SERUM",
    description: "Assesses SGOT, SGPT, Bilirubin, Alkaline Phosphatase, Total Protein, and Albumin.",
    status: "ACTIVE",
    created_at: "2026-08-01T09:00:00Z",
    updated_at: "2026-08-01T09:00:00Z",
  },
  {
    id: "TEST-KFT-001",
    code: "KFT-01",
    name: "Kidney Function Test (KFT / Renal Panel)",
    category: "Biochemistry",
    specimen_type: "SERUM",
    description: "Measures Serum Creatinine, Blood Urea Nitrogen (BUN), and Uric Acid.",
    status: "ACTIVE",
    created_at: "2026-08-01T09:00:00Z",
    updated_at: "2026-08-01T09:00:00Z",
  },
  {
    id: "TEST-SPEC-999",
    code: "SPEC-99",
    name: "Specialized Genetic Sequencing Panel",
    category: "Genomics",
    specimen_type: "WHOLE_BLOOD",
    description: "High-throughput specialized genomic sequencing panel.",
    status: "ACTIVE",
    created_at: "2026-08-01T09:00:00Z",
    updated_at: "2026-08-01T09:00:00Z",
  },
];

let FACILITY_CAPABILITIES: LaboratoryCapability[] = [
  // Rourkela Central Lab (LAB-FAC-1001) Capabilities
  { id: "CAP-101", facility_id: "LAB-FAC-1001", facility_name: "ABC Diagnostics — Rourkela Central Lab", test_id: "TEST-CBC-001", test_name: "Complete Blood Count (CBC)", status: "AVAILABLE", processing_mode: "IN_HOUSE", updated_at: "2026-08-01T09:00:00Z" },
  { id: "CAP-102", facility_id: "LAB-FAC-1001", facility_name: "ABC Diagnostics — Rourkela Central Lab", test_id: "TEST-LIP-001", test_name: "Fasting Lipid Profile Panel", status: "AVAILABLE", processing_mode: "IN_HOUSE", updated_at: "2026-08-01T09:00:00Z" },
  { id: "CAP-103", facility_id: "LAB-FAC-1001", facility_name: "ABC Diagnostics — Rourkela Central Lab", test_id: "TEST-GLU-001", test_name: "Fasting Blood Glucose (FBS)", status: "AVAILABLE", processing_mode: "IN_HOUSE", updated_at: "2026-08-01T09:00:00Z" },
  { id: "CAP-104", facility_id: "LAB-FAC-1001", facility_name: "ABC Diagnostics — Rourkela Central Lab", test_id: "TEST-LFT-001", test_name: "Liver Function Test (LFT Panel)", status: "AVAILABLE", processing_mode: "IN_HOUSE", updated_at: "2026-08-01T09:00:00Z" },
  { id: "CAP-105", facility_id: "LAB-FAC-1001", facility_name: "ABC Diagnostics — Rourkela Central Lab", test_id: "TEST-KFT-001", test_name: "Kidney Function Test (KFT / Renal Panel)", status: "AVAILABLE", processing_mode: "IN_HOUSE", updated_at: "2026-08-01T09:00:00Z" },
  { id: "CAP-106", facility_id: "LAB-FAC-1001", facility_name: "ABC Diagnostics — Rourkela Central Lab", test_id: "TEST-SPEC-999", test_name: "Specialized Genetic Sequencing Panel", status: "NOT_SUPPORTED", processing_mode: "REFERRED", unavailability_reason: "Specialized equipment not installed", updated_at: "2026-08-01T09:00:00Z" },

  // Sambalpur Branch (LAB-FAC-1002) Capabilities
  { id: "CAP-201", facility_id: "LAB-FAC-1002", facility_name: "ABC Diagnostics — Sambalpur Branch", test_id: "TEST-CBC-001", test_name: "Complete Blood Count (CBC)", status: "AVAILABLE", processing_mode: "IN_HOUSE", updated_at: "2026-08-01T09:00:00Z" },
  { id: "CAP-202", facility_id: "LAB-FAC-1002", facility_name: "ABC Diagnostics — Sambalpur Branch", test_id: "TEST-GLU-001", test_name: "Fasting Blood Glucose (FBS)", status: "AVAILABLE", processing_mode: "IN_HOUSE", updated_at: "2026-08-01T09:00:00Z" },
  { id: "CAP-203", facility_id: "LAB-FAC-1002", facility_name: "ABC Diagnostics — Sambalpur Branch", test_id: "TEST-LIP-001", test_name: "Fasting Lipid Profile Panel", status: "TEMPORARILY_UNAVAILABLE", processing_mode: "IN_HOUSE", unavailability_reason: "Reagent stock depleted - awaiting delivery", updated_at: "2026-08-01T09:00:00Z" },
];

export function getAllMasterTests(): LabTestMaster[] {
  return [...MASTER_TEST_CATALOG];
}

export function getMasterTestById(testIdOrCode: string): LabTestMaster | null {
  const clean = (testIdOrCode || "").trim().toLowerCase();
  return MASTER_TEST_CATALOG.find((t) => t.id.toLowerCase() === clean || t.code.toLowerCase() === clean) || null;
}

export function getFacilityCapabilities(facilityId: string): LaboratoryCapability[] {
  const clean = (facilityId || "").trim().toLowerCase();
  return FACILITY_CAPABILITIES.filter((c) => c.facility_id.toLowerCase() === clean);
}

export function checkFacilityCapability(facilityId: string, testIdOrCode: string): {
  supported: boolean;
  status: CapabilityStatus;
  capability?: LaboratoryCapability;
  reason?: string;
} {
  const test = getMasterTestById(testIdOrCode);
  const testId = test ? test.id : testIdOrCode;

  const caps = getFacilityCapabilities(facilityId);
  const cap = caps.find((c) => c.test_id.toLowerCase() === testId.toLowerCase());

  if (!cap) {
    return { supported: false, status: "NOT_SUPPORTED", reason: `Test ${testIdOrCode} is not configured for facility ${facilityId}.` };
  }

  if (cap.status !== "AVAILABLE") {
    return { supported: false, status: cap.status, capability: cap, reason: cap.unavailability_reason || `Test ${cap.test_name} is ${cap.status}.` };
  }

  return { supported: true, status: "AVAILABLE", capability: cap };
}

export function setFacilityCapabilityStatus(
  facilityId: string,
  testId: string,
  status: CapabilityStatus,
  unavailabilityReason?: string,
  actorId: string = "LAB-STAFF-1001",
  actorName: string = "Lab Manager Ramesh",
  actorRole: string = "LAB_ADMIN"
): { success: boolean; capability?: LaboratoryCapability; error?: string } {
  const test = getMasterTestById(testId);
  if (!test) return { success: false, error: `Test ${testId} not found in master catalog.` };

  const now = new Date().toISOString();
  const index = FACILITY_CAPABILITIES.findIndex(
    (c) => c.facility_id.toLowerCase() === facilityId.trim().toLowerCase() && c.test_id.toLowerCase() === testId.trim().toLowerCase()
  );

  if (index >= 0) {
    const updated: LaboratoryCapability = {
      ...FACILITY_CAPABILITIES[index],
      status,
      unavailability_reason: unavailabilityReason,
      updated_at: now,
    };
    FACILITY_CAPABILITIES[index] = updated;

    appendAuditEvent(
      "SERVICE_UPDATE",
      actorId,
      actorName,
      actorRole,
      `Updated test capability for ${test.name} at facility ${facilityId} to ${status}`,
      testId,
      facilityId,
      "Laboratory Capability",
      updated.id
    );

    return { success: true, capability: updated };
  }

  const newCap: LaboratoryCapability = {
    id: `CAP-${100 + FACILITY_CAPABILITIES.length + 1}`,
    facility_id: facilityId,
    facility_name: facilityId,
    test_id: test.id,
    test_name: test.name,
    status,
    processing_mode: "IN_HOUSE",
    unavailability_reason: unavailabilityReason,
    updated_at: now,
  };

  FACILITY_CAPABILITIES.push(newCap);
  return { success: true, capability: newCap };
}
