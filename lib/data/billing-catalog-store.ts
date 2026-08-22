// ============================================================
// MEDORA — SERVICE CATALOG & PRICE LIST REPOSITORY (PHASE 10.1)
// Authoritative Service Master & Versioned Pricing Store
// ============================================================

import type { ServiceCatalogItem, ServicePrice, ServiceCategory } from "@/types/database.types";

let SERVICE_CATALOG_STORE: ServiceCatalogItem[] = [
  {
    id: "SERV-CONS-01",
    service_code: "CONS-OPD-01",
    name: "Doctor Outpatient Consultation",
    category: "CONSULTATION",
    description: "Standard outpatient doctor consultation and clinical assessment",
    organization_id: "11111111-1111-1111-1111-111111111101",
    facility_id: "FAC-1001",
    active: true,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
  },
  {
    id: "SERV-IMG-01",
    service_code: "IMG-MRI-BRAIN-01",
    name: "MRI Brain Without Contrast",
    category: "IMAGING",
    description: "High-resolution 3T MRI scanning of brain structure without IV contrast",
    organization_id: "11111111-1111-1111-1111-111111111101",
    facility_id: "FAC-1001",
    active: true,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
  },
  {
    id: "SERV-LAB-01",
    service_code: "LAB-CBC-01",
    name: "Complete Blood Count (CBC)",
    category: "LABORATORY",
    description: "Automated hematology 5-part differential blood panel",
    organization_id: "11111111-1111-1111-1111-111111111101",
    facility_id: "FAC-1001",
    active: true,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
  },
  {
    id: "SERV-MED-01",
    service_code: "MED-PCM-500",
    name: "Paracetamol 500mg Tablet (10s)",
    category: "PHARMACY",
    description: "Analgesic & antipyretic 500mg tablets strip",
    organization_id: "PHARM-ORG-1001",
    facility_id: "PHARM-FAC-1001",
    active: true,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
  },
  {
    id: "SERV-ROOM-01",
    service_code: "ROOM-ICU-DAY",
    name: "Intensive Care Unit (ICU) Room Stay (Per Day)",
    category: "ROOM",
    description: "Specialized cardiac ICU bed stay per 24 hour block",
    organization_id: "11111111-1111-1111-1111-111111111101",
    facility_id: "FAC-1001",
    active: true,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
  },
];

let SERVICE_PRICES_STORE: ServicePrice[] = [
  {
    id: "PRICE-CONS-01",
    service_id: "SERV-CONS-01",
    organization_id: "11111111-1111-1111-1111-111111111101",
    facility_id: "FAC-1001",
    unit_price: 500.00,
    currency: "INR",
    effective_from: "2026-08-01T00:00:00Z",
    status: "ACTIVE",
    created_at: "2026-08-01T00:00:00Z",
  },
  {
    id: "PRICE-IMG-01",
    service_id: "SERV-IMG-01",
    organization_id: "11111111-1111-1111-1111-111111111101",
    facility_id: "FAC-1001",
    unit_price: 12000.00,
    currency: "INR",
    effective_from: "2026-08-01T00:00:00Z",
    status: "ACTIVE",
    created_at: "2026-08-01T00:00:00Z",
  },
  {
    id: "PRICE-LAB-01",
    service_id: "SERV-LAB-01",
    organization_id: "11111111-1111-1111-1111-111111111101",
    facility_id: "FAC-1001",
    unit_price: 500.00,
    currency: "INR",
    effective_from: "2026-08-01T00:00:00Z",
    status: "ACTIVE",
    created_at: "2026-08-01T00:00:00Z",
  },
  {
    id: "PRICE-MED-01",
    service_id: "SERV-MED-01",
    organization_id: "PHARM-ORG-1001",
    facility_id: "PHARM-FAC-1001",
    unit_price: 150.00,
    currency: "INR",
    effective_from: "2026-08-01T00:00:00Z",
    status: "ACTIVE",
    created_at: "2026-08-01T00:00:00Z",
  },
  {
    id: "PRICE-ROOM-01",
    service_id: "SERV-ROOM-01",
    organization_id: "11111111-1111-1111-1111-111111111101",
    facility_id: "FAC-1001",
    unit_price: 8000.00,
    currency: "INR",
    effective_from: "2026-08-01T00:00:00Z",
    status: "ACTIVE",
    created_at: "2026-08-01T00:00:00Z",
  },
];

// ============================================================
// SERVICE CATALOG QUERIES
// ============================================================

export function getAllServices(): ServiceCatalogItem[] {
  return [...SERVICE_CATALOG_STORE];
}

export function getServiceById(id: string): ServiceCatalogItem | null {
  const clean = (id || "").trim().toLowerCase();
  return SERVICE_CATALOG_STORE.find((s) => s.id.toLowerCase() === clean) || null;
}

export function getServiceByCode(code: string): ServiceCatalogItem | null {
  const clean = (code || "").trim().toLowerCase();
  return SERVICE_CATALOG_STORE.find((s) => s.service_code.toLowerCase() === clean) || null;
}

export function getActivePriceForService(serviceId: string, serviceDate?: string): ServicePrice | null {
  const cleanId = (serviceId || "").trim().toLowerCase();
  const prices = SERVICE_PRICES_STORE.filter((p) => p.service_id.toLowerCase() === cleanId && p.status === "ACTIVE");

  if (prices.length === 0) return null;

  if (serviceDate) {
    const sTime = new Date(serviceDate).getTime();
    const effectivePrice = prices.find((p) => {
      const from = new Date(p.effective_from).getTime();
      const to = p.effective_to ? new Date(p.effective_to).getTime() : Infinity;
      return sTime >= from && sTime <= to;
    });
    if (effectivePrice) return effectivePrice;
  }

  return prices[0];
}
