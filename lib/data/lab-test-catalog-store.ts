// ============================================================
// MEDORA — LABORATORY TEST CATALOG STORE (PHASE C.3)
// Extensible Diagnostic Test & Parameter Catalog
// ============================================================

import type { LabTestCatalogItem } from "@/types/database.types";

export const SEEDED_LAB_TEST_CATALOG: LabTestCatalogItem[] = [
  // 1. Complete Blood Count (CBC)
  {
    id: "TEST-CBC-001",
    test_code: "CBC-01",
    test_name: "Complete Blood Count (CBC) with Differential",
    category: "HEMATOLOGY",
    sample_type: "WHOLE_BLOOD",
    turnaround_hours: 4,
    instructions: "EDTA whole blood tube. Invert 8-10 times gently.",
    parameters: [
      {
        id: "param-hb",
        name: "Hemoglobin",
        data_type: "NUMERIC",
        default_unit: "g/dL",
        reference_range: { low: 13.0, high: 17.0, text: "13.0 - 17.0 g/dL" },
      },
      {
        id: "param-wbc",
        name: "Total Leukocyte Count (WBC)",
        data_type: "NUMERIC",
        default_unit: "10^3/µL",
        reference_range: { low: 4.0, high: 11.0, text: "4.0 - 11.0 10^3/µL" },
      },
      {
        id: "param-plt",
        name: "Platelet Count",
        data_type: "NUMERIC",
        default_unit: "10^3/µL",
        reference_range: { low: 150, high: 450, text: "150 - 450 10^3/µL" },
      },
      {
        id: "param-rbc",
        name: "RBC Count",
        data_type: "NUMERIC",
        default_unit: "10^6/µL",
        reference_range: { low: 4.5, high: 5.9, text: "4.5 - 5.9 10^6/µL" },
      },
      {
        id: "param-pcv",
        name: "Hematocrit (PCV)",
        data_type: "NUMERIC",
        default_unit: "%",
        reference_range: { low: 40.0, high: 50.0, text: "40.0 - 50.0 %" },
      },
    ],
  },

  // 2. Lipid Profile
  {
    id: "TEST-LIP-001",
    test_code: "LIP-01",
    test_name: "Lipid Profile Panel",
    category: "BIOCHEMISTRY",
    sample_type: "SERUM",
    turnaround_hours: 6,
    instructions: "12-hour overnight fasting required. Plain red/gold clot activator tube.",
    parameters: [
      {
        id: "param-chol",
        name: "Total Cholesterol",
        data_type: "NUMERIC",
        default_unit: "mg/dL",
        reference_range: { low: 125, high: 200, text: "< 200 mg/dL (Desirable)" },
      },
      {
        id: "param-hdl",
        name: "HDL Cholesterol",
        data_type: "NUMERIC",
        default_unit: "mg/dL",
        reference_range: { low: 40, high: 60, text: "> 40 mg/dL" },
      },
      {
        id: "param-ldl",
        name: "LDL Cholesterol",
        data_type: "NUMERIC",
        default_unit: "mg/dL",
        reference_range: { low: 50, high: 100, text: "< 100 mg/dL (Optimal)" },
      },
      {
        id: "param-tg",
        name: "Triglycerides",
        data_type: "NUMERIC",
        default_unit: "mg/dL",
        reference_range: { low: 50, high: 150, text: "< 150 mg/dL (Normal)" },
      },
    ],
  },

  // 3. Renal Function Test (KFT / RFT)
  {
    id: "TEST-KFT-001",
    test_code: "REN-02",
    test_name: "Renal Function Test (KFT / RFT)",
    category: "BIOCHEMISTRY",
    sample_type: "SERUM",
    turnaround_hours: 4,
    instructions: "Plain red/gold tube. Non-fasting standard venipuncture.",
    parameters: [
      {
        id: "param-creat",
        name: "Serum Creatinine",
        data_type: "NUMERIC",
        default_unit: "mg/dL",
        reference_range: { low: 0.7, high: 1.3, text: "0.7 - 1.3 mg/dL" },
      },
      {
        id: "param-bun",
        name: "Blood Urea Nitrogen (BUN)",
        data_type: "NUMERIC",
        default_unit: "mg/dL",
        reference_range: { low: 7.0, high: 20.0, text: "7.0 - 20.0 mg/dL" },
      },
      {
        id: "param-uric",
        name: "Serum Uric Acid",
        data_type: "NUMERIC",
        default_unit: "mg/dL",
        reference_range: { low: 3.5, high: 7.2, text: "3.5 - 7.2 mg/dL" },
      },
    ],
  },

  // 4. Liver Function Test (LFT)
  {
    id: "TEST-LFT-001",
    test_code: "LFT-01",
    test_name: "Liver Function Test (LFT)",
    category: "BIOCHEMISTRY",
    sample_type: "SERUM",
    turnaround_hours: 6,
    instructions: "Avoid heavy alcohol or strenuous exercise 24 hours prior.",
    parameters: [
      {
        id: "param-sgot",
        name: "SGOT / AST",
        data_type: "NUMERIC",
        default_unit: "U/L",
        reference_range: { low: 10, high: 40, text: "10 - 40 U/L" },
      },
      {
        id: "param-sgpt",
        name: "SGPT / ALT",
        data_type: "NUMERIC",
        default_unit: "U/L",
        reference_range: { low: 10, high: 45, text: "10 - 45 U/L" },
      },
      {
        id: "param-bili",
        name: "Total Bilirubin",
        data_type: "NUMERIC",
        default_unit: "mg/dL",
        reference_range: { low: 0.2, high: 1.2, text: "0.2 - 1.2 mg/dL" },
      },
      {
        id: "param-alp",
        name: "Alkaline Phosphatase (ALP)",
        data_type: "NUMERIC",
        default_unit: "U/L",
        reference_range: { low: 44, high: 147, text: "44 - 147 U/L" },
      },
    ],
  },

  // 5. Glycated Hemoglobin (HbA1c)
  {
    id: "TEST-DIA-001",
    test_code: "DIA-01",
    test_name: "Glycated Hemoglobin (HbA1c)",
    category: "ENDOCRINOLOGY",
    sample_type: "WHOLE_BLOOD",
    turnaround_hours: 4,
    instructions: "EDTA lavender tube. Non-fasting random sample.",
    parameters: [
      {
        id: "param-hba1c",
        name: "HbA1c Level",
        data_type: "NUMERIC",
        default_unit: "%",
        reference_range: { low: 4.0, high: 5.6, text: "< 5.7 % (Non-diabetic)" },
      },
      {
        id: "param-eag",
        name: "Estimated Average Glucose (eAG)",
        data_type: "NUMERIC",
        default_unit: "mg/dL",
        reference_range: { low: 70, high: 115, text: "70 - 115 mg/dL" },
      },
    ],
  },

  // 6. Thyroid Profile Panel
  {
    id: "TEST-THY-001",
    test_code: "THY-01",
    test_name: "Thyroid Function Profile (T3, T4, TSH)",
    category: "ENDOCRINOLOGY",
    sample_type: "SERUM",
    turnaround_hours: 8,
    instructions: "Morning fasting sample preferred.",
    parameters: [
      {
        id: "param-tsh",
        name: "Thyroid Stimulating Hormone (TSH)",
        data_type: "NUMERIC",
        default_unit: "µIU/mL",
        reference_range: { low: 0.4, high: 4.5, text: "0.40 - 4.50 µIU/mL" },
      },
      {
        id: "param-t3",
        name: "Total Triiodothyronine (T3)",
        data_type: "NUMERIC",
        default_unit: "ng/dL",
        reference_range: { low: 80, high: 200, text: "80 - 200 ng/dL" },
      },
      {
        id: "param-t4",
        name: "Total Thyroxine (T4)",
        data_type: "NUMERIC",
        default_unit: "µg/dL",
        reference_range: { low: 4.5, high: 12.0, text: "4.5 - 12.0 µg/dL" },
      },
    ],
  },

  // 7. Urinalysis Routine & Microscopy
  {
    id: "TEST-URI-001",
    test_code: "URI-01",
    test_name: "Urinalysis Routine & Microscopy",
    category: "CLINICAL_PATHOLOGY",
    sample_type: "URINE",
    turnaround_hours: 2,
    instructions: "Clean catch midstream urine sample in sterile container.",
    parameters: [
      {
        id: "param-u-prot",
        name: "Urine Protein",
        data_type: "QUALITATIVE",
        options: ["Negative", "Trace", "1+", "2+", "3+"],
        reference_range: { text: "Negative" },
      },
      {
        id: "param-u-glu",
        name: "Urine Glucose",
        data_type: "QUALITATIVE",
        options: ["Negative", "Trace", "1+", "2+"],
        reference_range: { text: "Negative" },
      },
      {
        id: "param-u-sg",
        name: "Specific Gravity",
        data_type: "NUMERIC",
        reference_range: { low: 1.005, high: 1.030, text: "1.005 - 1.030" },
      },
      {
        id: "param-u-pus",
        name: "Pus Cells / WBC",
        data_type: "TEXT",
        reference_range: { text: "0 - 5 / hpf" },
      },
    ],
  },
];

let inMemoryCatalog: LabTestCatalogItem[] = [...SEEDED_LAB_TEST_CATALOG];
const STORAGE_KEY = "medora_lab_test_catalog_v1";

/**
 * Retrieve all diagnostic catalog tests with localStorage persistence.
 */
export function getAllLabTests(): LabTestCatalogItem[] {
  if (typeof window === "undefined") {
    return inMemoryCatalog;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryCatalog));
      return inMemoryCatalog;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : inMemoryCatalog;
  } catch {
    return inMemoryCatalog;
  }
}

/**
 * Fast search utility querying test name, code, or category.
 */
export function searchLabTests(query: string): LabTestCatalogItem[] {
  const clean = (query || "").trim().toLowerCase();
  if (!clean) return getAllLabTests();

  const all = getAllLabTests();
  return all.filter(
    (t) =>
      t.test_name.toLowerCase().includes(clean) ||
      t.test_code.toLowerCase().includes(clean) ||
      t.category.toLowerCase().includes(clean) ||
      t.sample_type.toLowerCase().includes(clean)
  );
}

/**
 * Retrieve a specific catalog test by ID or test code.
 */
export function getLabTestById(idOrCode: string): LabTestCatalogItem | null {
  if (!idOrCode) return null;
  const clean = idOrCode.trim().toUpperCase();
  const all = getAllLabTests();
  return all.find((t) => t.id.toUpperCase() === clean || t.test_code.toUpperCase() === clean) || null;
}
