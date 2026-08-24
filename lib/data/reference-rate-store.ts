// ============================================================
// MEDORA — CANONICAL REFERENCE & BENCHMARK RATE STORE
// Server-Authoritative Price Transparency & Benchmark Reference Engine
// Clearly labeled as internal reference/demo benchmark data
// ============================================================

export type ReferenceRateSourceType =
  | "INTERNAL_DEMO_BENCHMARK"
  | "PUBLIC_REFERENCE"
  | "GOVERNMENT_TARIFF";

export type ReferenceComparisonStatus =
  | "BELOW_REFERENCE"
  | "WITHIN_REFERENCE"
  | "ABOVE_REFERENCE"
  | "SIGNIFICANTLY_ABOVE_REFERENCE"
  | "REFERENCE_UNAVAILABLE";

export interface ReferenceRate {
  reference_rate_id: string; // e.g. REF-MRI-01
  service_code: string; // e.g. MRI-BRAIN-01
  service_name: string; // e.g. Magnetic Resonance Imaging (MRI) — Brain
  category: "CONSULTATION" | "LABORATORY" | "IMAGING" | "BLOOD_CENTRE" | "BED_STAY" | "PROCEDURE";
  benchmark_amount: number; // e.g. 4900
  lower_reference_amount?: number; // e.g. 4200
  upper_reference_amount?: number; // e.g. 5200
  source_type: ReferenceRateSourceType;
  source_name: string; // "Medora Prototype Reference Tariff"
  source_version: string; // "2026.1-DEMO"
  effective_from: string; // "2026-01-01"
  effective_to?: string;
  geography?: string; // "National Benchmark (Metro / Tier-1)"
  notes: string;
  is_prototype: boolean;
}

export interface RateComparisonResult {
  has_reference: boolean;
  reference_rate?: ReferenceRate;
  hospital_charge: number;
  benchmark_amount: number;
  difference_amount: number; // hospital_charge - benchmark
  percentage_difference: number; // ((hospital_charge - benchmark) / benchmark) * 100
  status: ReferenceComparisonStatus;
  is_above_reference: boolean;
  is_significantly_above: boolean;
  status_label: string;
  status_color: "emerald" | "blue" | "amber" | "rose" | "slate";
  disclaimer: string;
  source_badge: string;
}

// Canonical seeded reference benchmarks
export const SEEDED_REFERENCE_RATES: ReferenceRate[] = [
  // 1. Imaging & Radiology
  {
    reference_rate_id: "REF-MRI-01",
    service_code: "MRI-BRAIN-01",
    service_name: "MRI Brain (Plain / Contrast Standard)",
    category: "IMAGING",
    benchmark_amount: 4900,
    lower_reference_amount: 4200,
    upper_reference_amount: 5200,
    source_type: "INTERNAL_DEMO_BENCHMARK",
    source_name: "Medora Demo Reference Tariff",
    source_version: "2026.1-DEMO",
    effective_from: "2026-01-01",
    geography: "Tier-1 / Metro Regional Median",
    notes: "Baseline diagnostic 1.5T/3T neuro-imaging reference rate.",
    is_prototype: true,
  },
  {
    reference_rate_id: "REF-IMG-XRAY-01",
    service_code: "XRAY-CHEST-PA",
    service_name: "Chest X-Ray PA View Digital",
    category: "IMAGING",
    benchmark_amount: 450,
    lower_reference_amount: 350,
    upper_reference_amount: 550,
    source_type: "INTERNAL_DEMO_BENCHMARK",
    source_name: "Medora Demo Reference Tariff",
    source_version: "2026.1-DEMO",
    effective_from: "2026-01-01",
    notes: "Digital radiography single view benchmark.",
    is_prototype: true,
  },
  {
    reference_rate_id: "REF-IMG-ECHO-01",
    service_code: "ECHO-2D",
    service_name: "2D Echocardiography with Color Doppler",
    category: "IMAGING",
    benchmark_amount: 1800,
    lower_reference_amount: 1500,
    upper_reference_amount: 2200,
    source_type: "INTERNAL_DEMO_BENCHMARK",
    source_name: "Medora Demo Reference Tariff",
    source_version: "2026.1-DEMO",
    effective_from: "2026-01-01",
    notes: "Non-invasive transthoracic echocardiogram standard tariff.",
    is_prototype: true,
  },

  // 2. Clinical Consultations
  {
    reference_rate_id: "REF-CONS-01",
    service_code: "CONS-OPD-CARDIO",
    service_name: "Cardiology Specialist OPD Consultation",
    category: "CONSULTATION",
    benchmark_amount: 750,
    lower_reference_amount: 600,
    upper_reference_amount: 900,
    source_type: "INTERNAL_DEMO_BENCHMARK",
    source_name: "Medora Demo Reference Tariff",
    source_version: "2026.1-DEMO",
    effective_from: "2026-01-01",
    notes: "Senior consultant outpatient clinical evaluation rate.",
    is_prototype: true,
  },
  {
    reference_rate_id: "REF-CONS-GEN-01",
    service_code: "CONS-OPD-GEN",
    service_name: "General Medicine Outpatient Consultation",
    category: "CONSULTATION",
    benchmark_amount: 500,
    lower_reference_amount: 400,
    upper_reference_amount: 650,
    source_type: "INTERNAL_DEMO_BENCHMARK",
    source_name: "Medora Demo Reference Tariff",
    source_version: "2026.1-DEMO",
    effective_from: "2026-01-01",
    notes: "Primary general medicine clinical visit benchmark.",
    is_prototype: true,
  },

  // 3. Laboratory Diagnostics
  {
    reference_rate_id: "REF-LAB-CBC-01",
    service_code: "CBC-01",
    service_name: "Complete Blood Count (CBC) with Differential",
    category: "LABORATORY",
    benchmark_amount: 350,
    lower_reference_amount: 280,
    upper_reference_amount: 420,
    source_type: "INTERNAL_DEMO_BENCHMARK",
    source_name: "Medora Demo Reference Tariff",
    source_version: "2026.1-DEMO",
    effective_from: "2026-01-01",
    notes: "Automated 5-part differential hematology panel.",
    is_prototype: true,
  },
  {
    reference_rate_id: "REF-LAB-LIP-01",
    service_code: "LIP-01",
    service_name: "Lipid Profile (Cholesterol, HDL, LDL, VLDL, Triglycerides)",
    category: "LABORATORY",
    benchmark_amount: 650,
    lower_reference_amount: 500,
    upper_reference_amount: 750,
    source_type: "INTERNAL_DEMO_BENCHMARK",
    source_name: "Medora Demo Reference Tariff",
    source_version: "2026.1-DEMO",
    effective_from: "2026-01-01",
    notes: "Serum lipid fractions comprehensive panel.",
    is_prototype: true,
  },
  {
    reference_rate_id: "REF-LAB-LFT-01",
    service_code: "LFT-01",
    service_name: "Liver Function Test (SGOT, SGPT, Bilirubin, Protein)",
    category: "LABORATORY",
    benchmark_amount: 700,
    lower_reference_amount: 550,
    upper_reference_amount: 850,
    source_type: "INTERNAL_DEMO_BENCHMARK",
    source_name: "Medora Demo Reference Tariff",
    source_version: "2026.1-DEMO",
    effective_from: "2026-01-01",
    notes: "Complete hepatic enzymatic panel benchmark.",
    is_prototype: true,
  },

  // 4. Blood Centre & Transfusion Services
  {
    reference_rate_id: "REF-BLD-PRBC-01",
    service_code: "BLD-PRBC-01",
    service_name: "Packed Red Blood Cells (PRBC) Unit Crossmatched",
    category: "BLOOD_CENTRE",
    benchmark_amount: 1450,
    lower_reference_amount: 1200,
    upper_reference_amount: 1650,
    source_type: "INTERNAL_DEMO_BENCHMARK",
    source_name: "Medora Demo Reference Tariff",
    source_version: "2026.1-DEMO",
    effective_from: "2026-01-01",
    notes: "Government-aligned processing & serology test fee for whole blood component.",
    is_prototype: true,
  },

  // 5. Inpatient Bed & Ward Stays
  {
    reference_rate_id: "REF-BED-ICU-01",
    service_code: "BED-ICU-CARDIO",
    service_name: "Cardiac ICU Bed Stay (Per 24h Block)",
    category: "BED_STAY",
    benchmark_amount: 4500,
    lower_reference_amount: 3800,
    upper_reference_amount: 5500,
    source_type: "INTERNAL_DEMO_BENCHMARK",
    source_name: "Medora Demo Reference Tariff",
    source_version: "2026.1-DEMO",
    effective_from: "2026-01-01",
    notes: "Continuous telemetry cardiac intensive care per diem benchmark.",
    is_prototype: true,
  },
  {
    reference_rate_id: "REF-BED-GEN-01",
    service_code: "BED-WARD-GEN",
    service_name: "General Inpatient Ward Bed Stay (Per 24h Block)",
    category: "BED_STAY",
    benchmark_amount: 1200,
    lower_reference_amount: 900,
    upper_reference_amount: 1500,
    source_type: "INTERNAL_DEMO_BENCHMARK",
    source_name: "Medora Demo Reference Tariff",
    source_version: "2026.1-DEMO",
    effective_from: "2026-01-01",
    notes: "Non-AC multi-occupancy inpatient general ward rate.",
    is_prototype: true,
  },
];

let IN_MEMORY_REFERENCE_RATES: ReferenceRate[] = [...SEEDED_REFERENCE_RATES];

/**
 * Retrieve all registered reference rates.
 */
export function getAllReferenceRates(): ReferenceRate[] {
  return [...IN_MEMORY_REFERENCE_RATES];
}

/**
 * Find benchmark rate for a service by service code or fuzzy match on service name.
 */
export function findReferenceRate(serviceCodeOrName: string): ReferenceRate | null {
  if (!serviceCodeOrName) return null;
  const q = serviceCodeOrName.trim().toLowerCase();

  // 1. Exact match on service code
  const exactCode = IN_MEMORY_REFERENCE_RATES.find(
    (r) => r.service_code.toLowerCase() === q || r.reference_rate_id.toLowerCase() === q
  );
  if (exactCode) return exactCode;

  // 2. Substring or keyword match on service name
  return (
    IN_MEMORY_REFERENCE_RATES.find((r) => {
      const name = r.service_name.toLowerCase();
      if (q.includes("mri") && name.includes("mri")) return true;
      if (q.includes("lipid") && name.includes("lipid")) return true;
      if (q.includes("cbc") && (name.includes("cbc") || name.includes("blood count"))) return true;
      if (q.includes("liver") && name.includes("liver")) return true;
      if (q.includes("echo") && name.includes("echo")) return true;
      if (q.includes("x-ray") && name.includes("x-ray")) return true;
      if (q.includes("blood") && name.includes("blood") && (q.includes("unit") || q.includes("prbc"))) return true;
      if (q.includes("icu") && name.includes("icu")) return true;
      if (q.includes("ward") && name.includes("ward")) return true;
      if (q.includes("consult") && (name.includes("consult") || name.includes("consultation"))) return true;
      return name.includes(q) || q.includes(name);
    }) || null
  );
}

/**
 * Authoritative Comparison Engine:
 * Compares a hospital bill-item charge against the reference benchmark.
 */
export function compareChargeWithBenchmark(
  serviceCodeOrName: string,
  chargedAmount: number
): RateComparisonResult {
  const ref = findReferenceRate(serviceCodeOrName);
  const disclaimer =
    "A reference rate is provided for transparency and demo benchmark comparison. It may not account for every clinical, facility, complexity, package or emergency-related factor.";

  if (!ref || ref.benchmark_amount <= 0) {
    return {
      has_reference: false,
      hospital_charge: chargedAmount,
      benchmark_amount: 0,
      difference_amount: 0,
      percentage_difference: 0,
      status: "REFERENCE_UNAVAILABLE",
      is_above_reference: false,
      is_significantly_above: false,
      status_label: "No Benchmark Available",
      status_color: "slate",
      disclaimer,
      source_badge: "Reference Unavailable",
    };
  }

  const diff = chargedAmount - ref.benchmark_amount;
  const pctDiff = Math.round((diff / ref.benchmark_amount) * 1000) / 10; // 1 decimal place

  // Determine comparison status
  let status: ReferenceComparisonStatus = "WITHIN_REFERENCE";
  let statusLabel = "Within Reference Range";
  let statusColor: "emerald" | "blue" | "amber" | "rose" | "slate" = "emerald";

  if (diff < -50 && pctDiff <= -5) {
    status = "BELOW_REFERENCE";
    statusLabel = `Below Reference Rate (${pctDiff}%)`;
    statusColor = "blue";
  } else if (pctDiff >= 20 || diff >= 1000) {
    status = "SIGNIFICANTLY_ABOVE_REFERENCE";
    statusLabel = `+₹${diff.toLocaleString("en-IN")} (+${pctDiff}%) Above Reference`;
    statusColor = "rose";
  } else if (diff > 50 && pctDiff > 5) {
    status = "ABOVE_REFERENCE";
    statusLabel = `+₹${diff.toLocaleString("en-IN")} (+${pctDiff}%) Above Reference`;
    statusColor = "amber";
  } else {
    status = "WITHIN_REFERENCE";
    statusLabel = "Within Reference Range";
    statusColor = "emerald";
  }

  return {
    has_reference: true,
    reference_rate: ref,
    hospital_charge: chargedAmount,
    benchmark_amount: ref.benchmark_amount,
    difference_amount: diff,
    percentage_difference: pctDiff,
    status,
    is_above_reference: status === "ABOVE_REFERENCE" || status === "SIGNIFICANTLY_ABOVE_REFERENCE",
    is_significantly_above: status === "SIGNIFICANTLY_ABOVE_REFERENCE",
    status_label: statusLabel,
    status_color: statusColor,
    disclaimer,
    source_badge: `${ref.source_name} (${ref.source_version})`,
  };
}
