// ============================================================
// MEDORA — HEALTHCARE ORGANIZATION & FACILITY STORE
// PHASE 5.1: ORGANIZATION & FACILITY FOUNDATION
// ============================================================

import type {
  HealthcareOrganization,
  HealthcareFacility,
  HealthcareFacilityStatus,
  HealthcareOrganizationType,
  HealthcareFacilityType,
  VerificationStatus,
} from "@/types/database.types";

const ORGANIZATIONS_STORAGE_KEY = "medora_organizations_v5";
const FACILITIES_STORAGE_KEY = "medora_facilities_v5";

// Default Seeded Organizations
export const DEFAULT_ORGANIZATIONS: HealthcareOrganization[] = [
  {
    id: "11111111-1111-1111-1111-111111111101",
    identifier: "HSP-1001",
    name: "City Healthcare Group",
    legal_name: "City Healthcare Hospitals & Clinics Pvt Ltd",
    type: "HOSPITAL_GROUP",
    license_no: "HSP-OD-2018-092",
    phone: "+91 674 2550100",
    email: "contact@cityhealthcare.org",
    website: "https://cityhealthcare.org",
    address: "MG Road, Central Healthcare District",
    city: "Bhubaneswar",
    district: "Khordha",
    state: "Odisha",
    postal_code: "751001",
    country: "India",
    status: "ACTIVE",
    verification_status: "verified",
    created_at: "2025-08-10T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "11111111-1111-1111-1111-111111111102",
    identifier: "HSP-1002",
    name: "Green Care Healthcare",
    legal_name: "Green Care Hospitals & Wellness Trust",
    type: "HOSPITAL_GROUP",
    license_no: "HSP-OD-2020-144",
    phone: "+91 671 2440200",
    email: "info@greencare.org",
    website: "https://greencare.org",
    address: "Ring Road, Cantonment",
    city: "Cuttack",
    district: "Cuttack",
    state: "Odisha",
    postal_code: "753001",
    country: "India",
    status: "ACTIVE",
    verification_status: "verified",
    created_at: "2025-08-15T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "11111111-1111-1111-1111-111111111103",
    identifier: "CLN-1001",
    name: "Green Care Primary Care Network",
    legal_name: "Green Care Clinics Network LLP",
    type: "CLINIC_GROUP",
    license_no: "CLN-OD-2021-055",
    phone: "+91 671 2440250",
    email: "clinic@greencare.org",
    address: "Cantonment High Street",
    city: "Cuttack",
    district: "Cuttack",
    state: "Odisha",
    postal_code: "753001",
    country: "India",
    status: "ACTIVE",
    verification_status: "verified",
    created_at: "2025-09-12T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "11111111-1111-1111-1111-111111111104",
    identifier: "LAB-1001",
    name: "ABC Diagnostic Laboratories",
    legal_name: "ABC Pathology & Diagnostics Ltd",
    type: "DIAGNOSTIC_GROUP",
    license_no: "LAB-OD-2019-112",
    phone: "+91 674 2550108",
    email: "lab@abcdiagnostics.com",
    address: "Janpath Road, Commercial Zone",
    city: "Bhubaneswar",
    district: "Khordha",
    state: "Odisha",
    postal_code: "751007",
    country: "India",
    status: "ACTIVE",
    verification_status: "verified",
    created_at: "2025-09-01T09:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "11111111-1111-1111-1111-111111111105",
    identifier: "PHA-1001",
    name: "Green Pharmacy Network",
    legal_name: "Green Care Retail Pharmacy Chain",
    type: "PHARMACY_GROUP",
    license_no: "PHA-OD-2019-883",
    phone: "+91 674 2550105",
    email: "pharmacy@greenpharmacy.com",
    address: "Janpath Commercial Complex",
    city: "Bhubaneswar",
    district: "Khordha",
    state: "Odisha",
    postal_code: "751007",
    country: "India",
    status: "ACTIVE",
    verification_status: "verified",
    created_at: "2025-09-01T09:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "11111111-1111-1111-1111-111111111106",
    identifier: "BLC-1001",
    name: "City Red Cross Blood Centre",
    legal_name: "Odisha Red Cross Society Blood Centre",
    type: "BLOOD_BANK_GROUP",
    license_no: "BLC-OD-2017-023",
    phone: "+91 674 2550199",
    email: "bloodbank@cityredcross.org",
    address: "Medical Enclave, Unit 4",
    city: "Bhubaneswar",
    district: "Khordha",
    state: "Odisha",
    postal_code: "751001",
    country: "India",
    status: "ACTIVE",
    verification_status: "verified",
    created_at: "2025-09-01T09:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

// Default Seeded Multi-Branch Facilities
export const DEFAULT_FACILITIES: HealthcareFacility[] = [
  // 1. City Hospital — Bhubaneswar Main Campus (FAC-1001)
  {
    id: "fac-1001-bbsr",
    facility_code: "FAC-1001",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_identifier: "HSP-1001",
    organization_name: "City Healthcare Group",
    name: "City Hospital — Bhubaneswar Main Campus",
    type: "HOSPITAL",
    license_no: "HSP-OD-2018-092-A",
    phone: "+91 674 2550100",
    emergency_phone: "112",
    email: "bbsr.hub@cityhealthcare.org",
    website: "https://cityhealthcare.org/bhubaneswar",
    address: "MG Road, Central District, Unit 3",
    city: "Bhubaneswar",
    district: "Khordha",
    state: "Odisha",
    postal_code: "751001",
    country: "India",
    latitude: 20.2961,
    longitude: 85.8245,
    operating_hours: "24/7 Emergency & Critical Care; OPD: 08:00 AM - 08:00 PM",
    status: "ACTIVE",
    verification_status: "verified",
    created_at: "2025-08-10T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  // 2. City Hospital — Rourkela Trauma Center (FAC-1002)
  {
    id: "fac-1001-rou",
    facility_code: "FAC-1002",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_identifier: "HSP-1001",
    organization_name: "City Healthcare Group",
    name: "City Hospital — Rourkela Trauma Center",
    type: "HOSPITAL",
    license_no: "HSP-OD-2018-092-B",
    phone: "+91 661 2500100",
    emergency_phone: "112",
    email: "rourkela@cityhealthcare.org",
    address: "Civil Township, Sector 2",
    city: "Rourkela",
    district: "Sundargarh",
    state: "Odisha",
    postal_code: "769004",
    country: "India",
    latitude: 22.2604,
    longitude: 84.8536,
    operating_hours: "24/7 Trauma & Emergency; OPD: 09:00 AM - 05:00 PM",
    status: "ACTIVE",
    verification_status: "verified",
    created_at: "2025-08-12T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  // 3. City Hospital — Cuttack Specialty Center (FAC-1003)
  {
    id: "fac-1001-ctc",
    facility_code: "FAC-1003",
    organization_id: "11111111-1111-1111-1111-111111111101",
    organization_identifier: "HSP-1001",
    organization_name: "City Healthcare Group",
    name: "City Hospital — Cuttack Specialty Center",
    type: "HOSPITAL",
    license_no: "HSP-OD-2018-092-C",
    phone: "+91 671 2300100",
    emergency_phone: "112",
    email: "cuttack@cityhealthcare.org",
    address: "Ring Road, Cantonment",
    city: "Cuttack",
    district: "Cuttack",
    state: "Odisha",
    postal_code: "753001",
    country: "India",
    latitude: 20.4625,
    longitude: 85.8828,
    operating_hours: "08:00 AM - 09:00 PM Daily",
    status: "ACTIVE",
    verification_status: "verified",
    created_at: "2025-08-15T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  // 4. Green Care Hospital — Main Hub (FAC-1004)
  {
    id: "fac-1002-main",
    facility_code: "FAC-1004",
    organization_id: "11111111-1111-1111-1111-111111111102",
    organization_identifier: "HSP-1002",
    organization_name: "Green Care Healthcare",
    name: "Green Care Hospital — Cuttack Campus",
    type: "HOSPITAL",
    license_no: "HSP-OD-2020-144-A",
    phone: "+91 671 2440200",
    emergency_phone: "112",
    email: "contact@greencare.org",
    address: "Cantonment Road, Sector 1",
    city: "Cuttack",
    district: "Cuttack",
    state: "Odisha",
    postal_code: "753001",
    country: "India",
    latitude: 20.465,
    longitude: 85.879,
    operating_hours: "24/7 Emergency & Inpatient Care",
    status: "ACTIVE",
    verification_status: "verified",
    created_at: "2025-08-15T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  // 5. Green Care Clinic — Day Outpatient Branch (FAC-2001)
  {
    id: "fac-2001-clinic",
    facility_code: "FAC-2001",
    organization_id: "11111111-1111-1111-1111-111111111103",
    organization_identifier: "CLN-1001",
    organization_name: "Green Care Primary Care Network",
    name: "Green Care Clinic — Cantonment Branch",
    type: "CLINIC",
    license_no: "CLN-OD-2021-055-A",
    phone: "+91 671 2440250",
    email: "clinic@greencare.org",
    address: "Cantonment High Street, Shop 12-14",
    city: "Cuttack",
    district: "Cuttack",
    state: "Odisha",
    postal_code: "753001",
    country: "India",
    latitude: 20.468,
    longitude: 85.881,
    operating_hours: "Mon - Sat: 08:00 AM - 08:00 PM; Sun: 09:00 AM - 01:00 PM",
    status: "ACTIVE",
    verification_status: "verified",
    created_at: "2025-09-12T10:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  // 6. ABC Diagnostics — Central Laboratory (FAC-3001)
  {
    id: "fac-3001-lab",
    facility_code: "FAC-3001",
    organization_id: "11111111-1111-1111-1111-111111111104",
    organization_identifier: "LAB-1001",
    organization_name: "ABC Diagnostic Laboratories",
    name: "ABC Diagnostics — Central Reference Lab",
    type: "LABORATORY",
    license_no: "LAB-OD-2019-112-A",
    phone: "+91 674 2550108",
    email: "lab@abcdiagnostics.com",
    address: "Janpath Road, Commercial Zone",
    city: "Bhubaneswar",
    district: "Khordha",
    state: "Odisha",
    postal_code: "751007",
    country: "India",
    latitude: 20.291,
    longitude: 85.835,
    operating_hours: "24/7 Specimen Processing; Collection Desk: 07:00 AM - 09:00 PM",
    status: "ACTIVE",
    verification_status: "verified",
    created_at: "2025-09-01T09:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  // 7. ABC Pharmacy — Central Outlet (FAC-4001)
  {
    id: "fac-4001-pha",
    facility_code: "FAC-4001",
    organization_id: "11111111-1111-1111-1111-111111111105",
    organization_identifier: "PHA-1001",
    organization_name: "Green Pharmacy Network",
    name: "ABC Pharmacy — Janpath Main Store",
    type: "PHARMACY",
    license_no: "PHA-OD-2019-883-A",
    phone: "+91 674 2550105",
    email: "orders@greenpharmacy.com",
    address: "Janpath Commercial Complex, Ground Floor",
    city: "Bhubaneswar",
    district: "Khordha",
    state: "Odisha",
    postal_code: "751007",
    country: "India",
    latitude: 20.292,
    longitude: 85.836,
    operating_hours: "24/7 Medicine Dispensing",
    status: "ACTIVE",
    verification_status: "verified",
    created_at: "2025-09-01T09:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

// In-Memory Node/CLI Fallback Cache
let memoryOrganizations: HealthcareOrganization[] = [...DEFAULT_ORGANIZATIONS];
let memoryFacilities: HealthcareFacility[] = [...DEFAULT_FACILITIES];

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

// ------------------------------------------------------------
// ORGANIZATIONS REPOSITORY
// ------------------------------------------------------------

export function getAllOrganizations(): HealthcareOrganization[] {
  if (isBrowser()) {
    try {
      const stored = localStorage.getItem(ORGANIZATIONS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(ORGANIZATIONS_STORAGE_KEY, JSON.stringify(DEFAULT_ORGANIZATIONS));
    } catch (e) {}
  }
  return memoryOrganizations;
}

export function getOrganizationById(idOrIdentifier: string): HealthcareOrganization | null {
  if (!idOrIdentifier) return null;
  const clean = idOrIdentifier.trim().toLowerCase();
  const all = getAllOrganizations();
  return (
    all.find(
      (o) =>
        o.id.toLowerCase() === clean ||
        o.identifier.toLowerCase() === clean ||
        (o as any).medora_id?.toLowerCase() === clean
    ) || null
  );
}

export function saveOrganizations(orgs: HealthcareOrganization[]): void {
  memoryOrganizations = orgs;
  if (isBrowser()) {
    try {
      localStorage.setItem(ORGANIZATIONS_STORAGE_KEY, JSON.stringify(orgs));
    } catch (e) {}
  }
}

export function createOrganization(
  data: Omit<HealthcareOrganization, "id" | "identifier" | "created_at" | "updated_at"> & {
    id?: string;
    identifier?: string;
  }
): { success: boolean; organization?: HealthcareOrganization; error?: string } {
  if (!data.name || !data.name.trim()) {
    return { success: false, error: "Organization name is required." };
  }
  if (!data.license_no || !data.license_no.trim()) {
    return { success: false, error: "Legal registration/license number is required." };
  }
  if (!data.city || !data.city.trim()) {
    return { success: false, error: "City is required." };
  }

  const all = getAllOrganizations();
  const identifier =
    data.identifier?.trim().toUpperCase() ||
    `ORG-${(1000 + all.length + 1).toString()}`;

  // Check unique identifier collision
  if (all.some((o) => o.identifier.toUpperCase() === identifier)) {
    return { success: false, error: `Organization identifier '${identifier}' already exists.` };
  }

  const now = new Date().toISOString();
  const newOrg: HealthcareOrganization = {
    id: data.id || `org-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    identifier,
    name: data.name.trim(),
    legal_name: data.legal_name?.trim() || data.name.trim(),
    type: data.type || "HOSPITAL_GROUP",
    license_no: data.license_no.trim(),
    phone: data.phone?.trim() || "+91 674 0000000",
    email: data.email?.trim() || "",
    website: data.website?.trim() || "",
    address: data.address?.trim() || "Main Road",
    city: data.city.trim(),
    district: data.district?.trim() || data.city.trim(),
    state: data.state?.trim() || "Odisha",
    postal_code: data.postal_code?.trim() || "751001",
    country: data.country?.trim() || "India",
    status: data.status || "ACTIVE",
    verification_status: data.verification_status || "verified",
    created_at: now,
    updated_at: now,
  };

  all.push(newOrg);
  saveOrganizations(all);
  return { success: true, organization: newOrg };
}

export function updateOrganization(
  idOrIdentifier: string,
  updates: Partial<HealthcareOrganization>
): { success: boolean; organization?: HealthcareOrganization; error?: string } {
  const all = getAllOrganizations();
  const index = all.findIndex(
    (o) =>
      o.id.toLowerCase() === idOrIdentifier.toLowerCase() ||
      o.identifier.toLowerCase() === idOrIdentifier.toLowerCase()
  );

  if (index < 0) {
    return { success: false, error: "Organization not found." };
  }

  const updated: HealthcareOrganization = {
    ...all[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };

  all[index] = updated;
  saveOrganizations(all);
  return { success: true, organization: updated };
}

export function deactivateOrganization(
  idOrIdentifier: string,
  reason?: string
): { success: boolean; organization?: HealthcareOrganization; error?: string } {
  return updateOrganization(idOrIdentifier, {
    status: "INACTIVE",
  });
}

// ------------------------------------------------------------
// FACILITIES REPOSITORY
// ------------------------------------------------------------

export function getAllFacilities(): HealthcareFacility[] {
  if (isBrowser()) {
    try {
      const stored = localStorage.getItem(FACILITIES_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(FACILITIES_STORAGE_KEY, JSON.stringify(DEFAULT_FACILITIES));
    } catch (e) {}
  }
  return memoryFacilities;
}

export function getFacilityById(idOrCode: string): HealthcareFacility | null {
  if (!idOrCode) return null;
  const clean = idOrCode.trim().toLowerCase();
  const all = getAllFacilities();
  return (
    all.find(
      (f) =>
        f.id.toLowerCase() === clean ||
        f.facility_code.toLowerCase() === clean ||
        (f as any).facilityCode?.toLowerCase() === clean
    ) || null
  );
}

export function getFacilitiesForOrganization(orgIdOrIdentifier: string): HealthcareFacility[] {
  if (!orgIdOrIdentifier) return [];
  const clean = orgIdOrIdentifier.trim().toLowerCase();
  const org = getOrganizationById(orgIdOrIdentifier);
  const orgId = org?.id.toLowerCase() || clean;
  const orgIdent = org?.identifier.toLowerCase() || clean;

  const all = getAllFacilities();
  return all.filter(
    (f) =>
      f.organization_id.toLowerCase() === orgId ||
      f.organization_id.toLowerCase() === orgIdent ||
      f.organization_identifier?.toLowerCase() === orgIdent ||
      f.organization_identifier?.toLowerCase() === orgId
  );
}

export function saveFacilities(facs: HealthcareFacility[]): void {
  memoryFacilities = facs;
  if (isBrowser()) {
    try {
      localStorage.setItem(FACILITIES_STORAGE_KEY, JSON.stringify(facs));
    } catch (e) {}
  }
}

export function createFacility(
  data: Omit<HealthcareFacility, "id" | "facility_code" | "created_at" | "updated_at"> & {
    id?: string;
    facility_code?: string;
  }
): { success: boolean; facility?: HealthcareFacility; error?: string } {
  if (!data.name || !data.name.trim()) {
    return { success: false, error: "Facility name is required." };
  }
  if (!data.organization_id || !data.organization_id.trim()) {
    return { success: false, error: "Parent Organization is required." };
  }
  if (!data.city || !data.city.trim()) {
    return { success: false, error: "Facility city is required." };
  }
  if (!data.postal_code || !data.postal_code.trim()) {
    return { success: false, error: "Postal/PIN code is required." };
  }

  const parentOrg = getOrganizationById(data.organization_id);
  if (!parentOrg) {
    return { success: false, error: `Parent Organization '${data.organization_id}' not found.` };
  }

  const all = getAllFacilities();
  const facilityCode =
    data.facility_code?.trim().toUpperCase() ||
    `FAC-${(1000 + all.length + 1).toString()}`;

  // Check unique facility code collision
  if (all.some((f) => f.facility_code.toUpperCase() === facilityCode)) {
    return { success: false, error: `Facility code '${facilityCode}' already exists.` };
  }

  const now = new Date().toISOString();
  const newFacility: HealthcareFacility = {
    id: data.id || `fac-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    facility_code: facilityCode,
    organization_id: parentOrg.id,
    organization_identifier: parentOrg.identifier,
    organization_name: parentOrg.name,
    name: data.name.trim(),
    type: data.type || "HOSPITAL",
    license_no: data.license_no?.trim() || `${parentOrg.license_no}-${facilityCode}`,
    phone: data.phone?.trim() || parentOrg.phone,
    emergency_phone: data.emergency_phone?.trim() || "112",
    email: data.email?.trim() || parentOrg.email || "",
    website: data.website?.trim() || parentOrg.website || "",
    address: data.address?.trim() || "Main Road",
    city: data.city.trim(),
    district: data.district?.trim() || data.city.trim(),
    state: data.state?.trim() || parentOrg.state,
    postal_code: data.postal_code.trim(),
    country: data.country?.trim() || "India",
    latitude: data.latitude,
    longitude: data.longitude,
    operating_hours: data.operating_hours?.trim() || "24/7 Operational",
    status: data.status || "ACTIVE",
    verification_status: data.verification_status || "verified",
    created_at: now,
    updated_at: now,
  };

  all.push(newFacility);
  saveFacilities(all);
  return { success: true, facility: newFacility };
}

export function updateFacility(
  idOrCode: string,
  updates: Partial<HealthcareFacility>
): { success: boolean; facility?: HealthcareFacility; error?: string } {
  const all = getAllFacilities();
  const index = all.findIndex(
    (f) =>
      f.id.toLowerCase() === idOrCode.toLowerCase() ||
      f.facility_code.toLowerCase() === idOrCode.toLowerCase()
  );

  if (index < 0) {
    return { success: false, error: "Facility not found." };
  }

  const updated: HealthcareFacility = {
    ...all[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };

  all[index] = updated;
  saveFacilities(all);
  return { success: true, facility: updated };
}

export function deactivateFacility(
  idOrCode: string,
  reason?: string
): { success: boolean; facility?: HealthcareFacility; error?: string } {
  return updateFacility(idOrCode, {
    status: "INACTIVE",
  });
}

// Reset store to seeded defaults (useful for test isolation)
export function resetFacilityStore(): void {
  memoryOrganizations = [...DEFAULT_ORGANIZATIONS];
  memoryFacilities = [...DEFAULT_FACILITIES];
  if (isBrowser()) {
    try {
      localStorage.setItem(ORGANIZATIONS_STORAGE_KEY, JSON.stringify(DEFAULT_ORGANIZATIONS));
      localStorage.setItem(FACILITIES_STORAGE_KEY, JSON.stringify(DEFAULT_FACILITIES));
    } catch (e) {}
  }
}
