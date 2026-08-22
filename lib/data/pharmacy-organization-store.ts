// ============================================================
// MEDORA — PHARMACY ORGANIZATION & CATALOG REPOSITORY (PHASE 9.1)
// Authoritative Pharmacy Organization, Facility, Staff RBAC & Medicine Catalog Store
// ============================================================

import type {
  PharmacyOrganization,
  PharmacyFacility,
  PharmacyStaffMembership,
  MedicineCatalogItem,
  PharmacyStaffRole,
  PharmacyConnectivityStatus,
} from "@/types/database.types";
import { appendAuditEvent } from "@/lib/data/audit-store";

// Initial Seed Organizations
let PHARMACY_ORGANIZATIONS_STORE: PharmacyOrganization[] = [
  {
    id: "PHARM-ORG-1001",
    name: "ABC Pharmacy Group",
    legal_name: "ABC Healthcare & Pharmaceuticals Pvt Ltd",
    pharmacy_type: "PHARMACY_CHAIN",
    status: "ACTIVE",
    connectivity_status: "CONNECTED",
    contact_phone: "+91 98765 43210",
    contact_email: "contact@abcpharmacy.medora",
    created_at: "2026-08-01T08:00:00Z",
    updated_at: "2026-08-01T08:00:00Z",
  },
  {
    id: "PHARM-ORG-1002",
    name: "City Hospital In-House Pharmacy",
    legal_name: "City Hospital Medical Services Ltd",
    pharmacy_type: "HOSPITAL_PHARMACY",
    status: "ACTIVE",
    connectivity_status: "CONNECTED",
    contact_phone: "+91 661 2500111",
    contact_email: "pharmacy@cityhospital.medora",
    created_at: "2026-08-01T08:00:00Z",
    updated_at: "2026-08-01T08:00:00Z",
  },
];

// Initial Seed Facilities
let PHARMACY_FACILITIES_STORE: PharmacyFacility[] = [
  {
    id: "PHARM-FAC-1001",
    organization_id: "PHARM-ORG-1001",
    organization_name: "ABC Pharmacy Group",
    name: "ABC Pharmacy — Rourkela Central",
    address: "Main Road, Near Daily Market, Rourkela",
    city: "Rourkela",
    state: "Odisha",
    pincode: "769001",
    phone: "+91 98765 43210",
    operational_status: "ACTIVE",
    pickup_available: true,
    delivery_available: true,
    is_demo: false,
    created_at: "2026-08-01T08:00:00Z",
    updated_at: "2026-08-01T08:00:00Z",
  },
  {
    id: "PHARM-FAC-1002",
    organization_id: "PHARM-ORG-1001",
    organization_name: "ABC Pharmacy Group",
    name: "ABC Pharmacy — Rourkela Branch 2",
    address: "Sector 19 Commercial Complex, Rourkela",
    city: "Rourkela",
    state: "Odisha",
    pincode: "769019",
    phone: "+91 98765 43211",
    operational_status: "ACTIVE",
    pickup_available: true,
    delivery_available: false,
    is_demo: false,
    created_at: "2026-08-01T08:00:00Z",
    updated_at: "2026-08-01T08:00:00Z",
  },
  {
    id: "PHARM-FAC-1003",
    organization_id: "PHARM-ORG-1002",
    organization_name: "City Hospital In-House Pharmacy",
    name: "City Hospital — Ground Floor Pharmacy",
    address: "City Hospital Campus, Sector 5, Rourkela",
    city: "Rourkela",
    state: "Odisha",
    pincode: "769005",
    phone: "+91 661 2500111",
    operational_status: "ACTIVE",
    pickup_available: true,
    delivery_available: true,
    is_demo: false,
    created_at: "2026-08-01T08:00:00Z",
    updated_at: "2026-08-01T08:00:00Z",
  },
];

// Initial Seed Staff Memberships
let PHARMACY_STAFF_MEMBERSHIPS: PharmacyStaffMembership[] = [
  {
    id: "PHARM-MEM-1001",
    user_id: "USR-PHARM-01",
    user_name: "Pharmacist Priya",
    user_email: "priya@abcpharmacy.medora",
    organization_id: "PHARM-ORG-1001",
    facility_id: "PHARM-FAC-1001",
    role: "PHARMACIST",
    status: "ACTIVE",
    created_at: "2026-08-01T08:00:00Z",
    updated_at: "2026-08-01T08:00:00Z",
  },
  {
    id: "PHARM-MEM-1002",
    user_id: "USR-PHARM-ADMIN",
    user_name: "Manager Vikas",
    user_email: "vikas@abcpharmacy.medora",
    organization_id: "PHARM-ORG-1001",
    facility_id: "PHARM-FAC-1001",
    role: "PHARMACY_ADMIN",
    status: "ACTIVE",
    created_at: "2026-08-01T08:00:00Z",
    updated_at: "2026-08-01T08:00:00Z",
  },
];

// Master Medicine Catalog Data
let MEDICINE_CATALOG_STORE: MedicineCatalogItem[] = [
  {
    id: "MED-1001",
    display_name: "Paracetamol 500mg Tablet",
    generic_name: "Paracetamol",
    brand_name: "Dolo 500",
    strength: "500 mg",
    dosage_form: "TABLET",
    form: "TABLET",
    default_route: "ORAL",
    category: "ANALGESIC_ANTIPYRETIC",
    unit_price: 15.00,
    status: "ACTIVE",
    created_at: "2026-08-01T08:00:00Z",
    updated_at: "2026-08-01T08:00:00Z",
  },
  {
    id: "MED-1002",
    display_name: "Amoxicillin 500mg Capsule",
    generic_name: "Amoxicillin",
    brand_name: "Mox 500",
    strength: "500 mg",
    dosage_form: "CAPSULE",
    form: "CAPSULE",
    default_route: "ORAL",
    category: "ANTIBIOTIC",
    unit_price: 65.00,
    status: "ACTIVE",
    created_at: "2026-08-01T08:00:00Z",
    updated_at: "2026-08-01T08:00:00Z",
  },
  {
    id: "MED-1003",
    display_name: "Metformin 500mg Tablet",
    generic_name: "Metformin Hydrochloride",
    brand_name: "Glycomet 500",
    strength: "500 mg",
    dosage_form: "TABLET",
    form: "TABLET",
    default_route: "ORAL",
    category: "ANTIDIABETIC",
    unit_price: 40.00,
    status: "ACTIVE",
    created_at: "2026-08-01T08:00:00Z",
    updated_at: "2026-08-01T08:00:00Z",
  },
  {
    id: "MED-1004",
    display_name: "Atorvastatin 10mg Tablet",
    generic_name: "Atorvastatin Calcium",
    brand_name: "Atorva 10",
    strength: "10 mg",
    dosage_form: "TABLET",
    form: "TABLET",
    default_route: "ORAL",
    category: "LIPID_LOWERING",
    unit_price: 85.00,
    status: "ACTIVE",
    created_at: "2026-08-01T08:00:00Z",
    updated_at: "2026-08-01T08:00:00Z",
  },
  {
    id: "MED-1005",
    display_name: "Azithromycin 500mg Tablet",
    generic_name: "Azithromycin",
    brand_name: "Azithral 500",
    strength: "500 mg",
    dosage_form: "TABLET",
    form: "TABLET",
    default_route: "ORAL",
    category: "ANTIBIOTIC",
    unit_price: 110.00,
    status: "ACTIVE",
    created_at: "2026-08-01T08:00:00Z",
    updated_at: "2026-08-01T08:00:00Z",
  },
];

// ============================================================
// ORGANIZATIONS & FACILITIES QUERIES
// ============================================================

export function getAllPharmacyOrganizations(): PharmacyOrganization[] {
  return [...PHARMACY_ORGANIZATIONS_STORE];
}

export function getPharmacyOrganizationById(id: string): PharmacyOrganization | null {
  const clean = (id || "").trim().toLowerCase();
  return PHARMACY_ORGANIZATIONS_STORE.find((o) => o.id.toLowerCase() === clean) || null;
}

export function getAllPharmacyFacilities(): PharmacyFacility[] {
  return [...PHARMACY_FACILITIES_STORE];
}

export function getPharmacyFacilityById(id: string): PharmacyFacility | null {
  const clean = (id || "").trim().toLowerCase();
  return PHARMACY_FACILITIES_STORE.find((f) => f.id.toLowerCase() === clean) || null;
}

export function getFacilitiesByOrganization(orgId: string): PharmacyFacility[] {
  const clean = (orgId || "").trim().toLowerCase();
  return PHARMACY_FACILITIES_STORE.filter((f) => f.organization_id.toLowerCase() === clean);
}

// ============================================================
// STAFF MEMBERSHIPS & RBAC
// ============================================================

export function getPharmacyStaffMembership(userId: string, facilityId?: string): PharmacyStaffMembership | null {
  const cleanUser = (userId || "").trim().toLowerCase();
  return PHARMACY_STAFF_MEMBERSHIPS.find((m) => {
    if (m.user_id.toLowerCase() !== cleanUser) return false;
    if (facilityId && m.facility_id.toLowerCase() !== facilityId.trim().toLowerCase()) return false;
    return m.status === "ACTIVE";
  }) || null;
}

export function addPharmacyStaffMembership(params: {
  userId: string;
  userName: string;
  userEmail?: string;
  organizationId: string;
  facilityId: string;
  role: PharmacyStaffRole;
  actorId: string;
  actorName: string;
  actorRole: string;
}): { success: boolean; membership?: PharmacyStaffMembership; error?: string } {
  const facility = getPharmacyFacilityById(params.facilityId);
  if (!facility) return { success: false, error: `Pharmacy facility ${params.facilityId} not found.` };

  const existing = PHARMACY_STAFF_MEMBERSHIPS.find(
    (m) => m.user_id.toLowerCase() === params.userId.toLowerCase() && m.facility_id.toLowerCase() === params.facilityId.toLowerCase()
  );

  if (existing) {
    return { success: true, membership: existing };
  }

  const now = new Date().toISOString();
  const newMembership: PharmacyStaffMembership = {
    id: `PHARM-MEM-${1000 + PHARMACY_STAFF_MEMBERSHIPS.length + 1}`,
    user_id: params.userId,
    user_name: params.userName,
    user_email: params.userEmail,
    organization_id: params.organizationId,
    facility_id: params.facilityId,
    role: params.role,
    status: "ACTIVE",
    created_at: now,
    updated_at: now,
  };

  PHARMACY_STAFF_MEMBERSHIPS.push(newMembership);

  appendAuditEvent(
    "MEMBER_INVITE",
    params.actorId,
    params.actorName,
    params.actorRole,
    `Added staff member ${params.userName} as ${params.role} to pharmacy facility ${facility.name}`,
    params.userId,
    facility.organization_id,
    facility.organization_name,
    newMembership.id
  );

  return { success: true, membership: newMembership };
}

// ============================================================
// MEDICINE CATALOG MASTER QUERIES
// ============================================================

export function getAllMedicineCatalog(): MedicineCatalogItem[] {
  return [...MEDICINE_CATALOG_STORE];
}

export function getMedicineCatalogById(id: string): MedicineCatalogItem | null {
  const clean = (id || "").trim().toLowerCase();
  return MEDICINE_CATALOG_STORE.find((m) => m.id.toLowerCase() === clean) || null;
}

export function findMedicineByNameOrGeneric(query: string): MedicineCatalogItem[] {
  const q = (query || "").trim().toLowerCase();
  if (!q) return [...MEDICINE_CATALOG_STORE];
  return MEDICINE_CATALOG_STORE.filter(
    (m) => (m.display_name && m.display_name.toLowerCase().includes(q)) || m.generic_name.toLowerCase().includes(q) || m.id.toLowerCase() === q
  );
}
