// ============================================================
// MEDORA — MEDICINE CATALOG STORE (PHASE C.2)
// Extensible Pharmaceutical Catalog for Structured Prescribing
// ============================================================

import type { MedicineCatalogItem, MedicineForm, PrescriptionRoute } from "@/types/database.types";

export const SEEDED_MEDICINES: MedicineCatalogItem[] = [
  // 1. Cardiovascular / Antihypertensive
  {
    id: "MED-1001",
    generic_name: "Telmisartan",
    brand_name: "Telma 40",
    default_strength: "40 mg",
    strength_value: 40,
    strength_unit: "mg",
    form: "TABLET",
    default_route: "ORAL",
    category: "Antihypertensive (ARB)",
    is_restricted: false,
  },
  {
    id: "MED-1002",
    generic_name: "Amlodipine",
    brand_name: "Norvasc 5",
    default_strength: "5 mg",
    strength_value: 5,
    strength_unit: "mg",
    form: "TABLET",
    default_route: "ORAL",
    category: "Calcium Channel Blocker",
    is_restricted: false,
  },
  {
    id: "MED-1003",
    generic_name: "Aspirin (Enteric Coated)",
    brand_name: "Ecosprin 75",
    default_strength: "75 mg",
    strength_value: 75,
    strength_unit: "mg",
    form: "TABLET",
    default_route: "ORAL",
    category: "Antiplatelet",
    is_restricted: false,
  },
  {
    id: "MED-1004",
    generic_name: "Atorvastatin",
    brand_name: "Lipitor 10",
    default_strength: "10 mg",
    strength_value: 10,
    strength_unit: "mg",
    form: "TABLET",
    default_route: "ORAL",
    category: "Lipid-lowering Statin",
    is_restricted: false,
  },
  {
    id: "MED-1005",
    generic_name: "Metoprolol Succinate",
    brand_name: "Betaloc 25",
    default_strength: "25 mg",
    strength_value: 25,
    strength_unit: "mg",
    form: "TABLET",
    default_route: "ORAL",
    category: "Beta Blocker",
    is_restricted: false,
  },

  // 2. Analgesics & Antipyretics
  {
    id: "MED-1006",
    generic_name: "Paracetamol",
    brand_name: "Dolo 650",
    default_strength: "650 mg",
    strength_value: 650,
    strength_unit: "mg",
    form: "TABLET",
    default_route: "ORAL",
    category: "Analgesic / Antipyretic",
    is_restricted: false,
  },
  {
    id: "MED-1007",
    generic_name: "Ibuprofen + Paracetamol",
    brand_name: "Combiflam",
    default_strength: "400 mg + 325 mg",
    strength_value: 400,
    strength_unit: "mg",
    form: "TABLET",
    default_route: "ORAL",
    category: "NSAID Analgesic",
    is_restricted: false,
  },

  // 3. Antidiabetic
  {
    id: "MED-1008",
    generic_name: "Metformin Hydrochloride",
    brand_name: "Glycomet 500",
    default_strength: "500 mg",
    strength_value: 500,
    strength_unit: "mg",
    form: "TABLET",
    default_route: "ORAL",
    category: "Biguanide Antidiabetic",
    is_restricted: false,
  },
  {
    id: "MED-1009",
    generic_name: "Glimepiride",
    brand_name: "Amaryl 1",
    default_strength: "1 mg",
    strength_value: 1,
    strength_unit: "mg",
    form: "TABLET",
    default_route: "ORAL",
    category: "Sulfonylurea Antidiabetic",
    is_restricted: false,
  },

  // 4. Antibiotics
  {
    id: "MED-1010",
    generic_name: "Amoxicillin + Clavulanic Acid",
    brand_name: "Augmentin 625 Duo",
    default_strength: "625 mg",
    strength_value: 625,
    strength_unit: "mg",
    form: "TABLET",
    default_route: "ORAL",
    category: "Broad Spectrum Antibiotic",
    is_restricted: false,
  },
  {
    id: "MED-1011",
    generic_name: "Azithromycin",
    brand_name: "Azithral 500",
    default_strength: "500 mg",
    strength_value: 500,
    strength_unit: "mg",
    form: "TABLET",
    default_route: "ORAL",
    category: "Macrolide Antibiotic",
    is_restricted: false,
  },

  // 5. Gastrointestinal
  {
    id: "MED-1012",
    generic_name: "Pantoprazole",
    brand_name: "Pan 40",
    default_strength: "40 mg",
    strength_value: 40,
    strength_unit: "mg",
    form: "TABLET",
    default_route: "ORAL",
    category: "Proton Pump Inhibitor (PPI)",
    is_restricted: false,
  },
  {
    id: "MED-1013",
    generic_name: "Domperidone + Rabeprazole",
    brand_name: "Razo D",
    default_strength: "30 mg + 20 mg",
    strength_value: 20,
    strength_unit: "mg",
    form: "CAPSULE",
    default_route: "ORAL",
    category: "Gastroprokinetic / Antacid",
    is_restricted: false,
  },

  // 6. Respiratory / Antihistamines
  {
    id: "MED-1014",
    generic_name: "Cetirizine Hydrochloride",
    brand_name: "Cetzine 10",
    default_strength: "10 mg",
    strength_value: 10,
    strength_unit: "mg",
    form: "TABLET",
    default_route: "ORAL",
    category: "Antihistamine",
    is_restricted: false,
  },
  {
    id: "MED-1015",
    generic_name: "Salbutamol Inhaler",
    brand_name: "Asthalin 100mcg Inhaler",
    default_strength: "100 mcg/puff",
    strength_value: 100,
    strength_unit: "mcg",
    form: "INHALER",
    default_route: "INHALATION",
    category: "Bronchodilator",
    is_restricted: false,
  },
  {
    id: "MED-1016",
    generic_name: "Montelukast + Levocetirizine",
    brand_name: "Montair LC",
    default_strength: "10 mg + 5 mg",
    strength_value: 10,
    strength_unit: "mg",
    form: "TABLET",
    default_route: "ORAL",
    category: "Antiallergic / Bronchodilator",
    is_restricted: false,
  },
];

let inMemoryMedicineCatalog: MedicineCatalogItem[] = [...SEEDED_MEDICINES];
const STORAGE_KEY = "medora_medicine_catalog_v1";

/**
 * Retrieve all registered catalog medicines with localStorage persistence.
 */
export function getAllMedicines(): MedicineCatalogItem[] {
  if (typeof window === "undefined") {
    return inMemoryMedicineCatalog;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryMedicineCatalog));
      return inMemoryMedicineCatalog;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : inMemoryMedicineCatalog;
  } catch {
    return inMemoryMedicineCatalog;
  }
}

/**
 * Fast search utility querying generic or brand name with debouncing support.
 */
export function searchMedicines(query: string): MedicineCatalogItem[] {
  const clean = (query || "").trim().toLowerCase();
  if (!clean) return getAllMedicines().slice(0, 10);

  const all = getAllMedicines();
  return all.filter(
    (m) =>
      m.generic_name.toLowerCase().includes(clean) ||
      (m.brand_name && m.brand_name.toLowerCase().includes(clean)) ||
      (m.category && m.category.toLowerCase().includes(clean))
  );
}

/**
 * Retrieve a specific medicine from catalog by ID.
 */
export function getMedicineById(id: string): MedicineCatalogItem | null {
  if (!id) return null;
  const cleanId = id.trim().toUpperCase();
  const all = getAllMedicines();
  return all.find((m) => m.id.toUpperCase() === cleanId) || null;
}
