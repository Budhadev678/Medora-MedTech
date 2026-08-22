// ============================================================
// MEDORA — PHARMACY INVENTORY & RESERVATION REPOSITORY (PHASE 9.2)
// Authoritative Stock, Batch Expiry, Movement & Atomic Reservation Store
// ============================================================

import type {
  PharmacyInventoryItem,
  PharmacyInventoryBatch,
  PharmacyStockMovement,
  PharmacyStockReservation,
  StockMovementType,
  InventoryItemStatus,
  StockBatchStatus,
  StockReservationStatus,
} from "@/types/database.types";
import { getPharmacyFacilityById, getMedicineCatalogById } from "@/lib/data/pharmacy-organization-store";
import { appendAuditEvent } from "@/lib/data/audit-store";

// Initial Seed Inventory Data
let INVENTORY_ITEMS_STORE: PharmacyInventoryItem[] = [
  {
    id: "PHARM-INV-1001",
    facility_id: "PHARM-FAC-1001", // ABC Rourkela Central
    medicine_id: "MED-1001",
    medicine_name: "Paracetamol 500mg Tablet",
    generic_name: "Paracetamol",
    strength: "500 mg",
    dosage_form: "TABLET",
    total_quantity: 150,
    reserved_quantity: 0,
    available_quantity: 150,
    reorder_threshold: 30,
    status: "AVAILABLE",
    is_supported: true,
    unit_price: 15.00,
    created_at: "2026-08-01T08:00:00Z",
    updated_at: "2026-08-01T08:00:00Z",
  },
  {
    id: "PHARM-INV-1002",
    facility_id: "PHARM-FAC-1001",
    medicine_id: "MED-1002",
    medicine_name: "Amoxicillin 500mg Capsule",
    generic_name: "Amoxicillin",
    strength: "500 mg",
    dosage_form: "CAPSULE",
    total_quantity: 80,
    reserved_quantity: 0,
    available_quantity: 80,
    reorder_threshold: 20,
    status: "AVAILABLE",
    is_supported: true,
    unit_price: 65.00,
    created_at: "2026-08-01T08:00:00Z",
    updated_at: "2026-08-01T08:00:00Z",
  },
  {
    id: "PHARM-INV-1003",
    facility_id: "PHARM-FAC-1001",
    medicine_id: "MED-1003",
    medicine_name: "Metformin 500mg Tablet",
    generic_name: "Metformin Hydrochloride",
    strength: "500 mg",
    dosage_form: "TABLET",
    total_quantity: 0,
    reserved_quantity: 0,
    available_quantity: 0,
    reorder_threshold: 25,
    status: "OUT_OF_STOCK",
    is_supported: true,
    unit_price: 40.00,
    created_at: "2026-08-01T08:00:00Z",
    updated_at: "2026-08-01T08:00:00Z",
  },
  {
    id: "PHARM-INV-1004",
    facility_id: "PHARM-FAC-1003", // City Hospital Pharmacy
    medicine_id: "MED-1001",
    medicine_name: "Paracetamol 500mg Tablet",
    generic_name: "Paracetamol",
    strength: "500 mg",
    dosage_form: "TABLET",
    total_quantity: 200,
    reserved_quantity: 0,
    available_quantity: 200,
    reorder_threshold: 50,
    status: "AVAILABLE",
    is_supported: true,
    unit_price: 15.00,
    created_at: "2026-08-01T08:00:00Z",
    updated_at: "2026-08-01T08:00:00Z",
  },
  {
    id: "PHARM-INV-1005",
    facility_id: "PHARM-FAC-1003",
    medicine_id: "MED-1003",
    medicine_name: "Metformin 500mg Tablet",
    generic_name: "Metformin Hydrochloride",
    strength: "500 mg",
    dosage_form: "TABLET",
    total_quantity: 100,
    reserved_quantity: 0,
    available_quantity: 100,
    reorder_threshold: 25,
    status: "AVAILABLE",
    is_supported: true,
    unit_price: 40.00,
    created_at: "2026-08-01T08:00:00Z",
    updated_at: "2026-08-01T08:00:00Z",
  },
];

// Initial Seed Batches
let BATCHES_STORE: PharmacyInventoryBatch[] = [
  {
    id: "BATCH-1001",
    inventory_id: "PHARM-INV-1001",
    facility_id: "PHARM-FAC-1001",
    medicine_id: "MED-1001",
    batch_number: "PCM-2026-01",
    manufacturing_date: "2026-01-10",
    expiry_date: "2027-12-31",
    quantity: 150,
    reserved_quantity: 0,
    status: "ACTIVE",
    created_at: "2026-08-01T08:00:00Z",
    updated_at: "2026-08-01T08:00:00Z",
  },
  {
    id: "BATCH-1002",
    inventory_id: "PHARM-INV-1002",
    facility_id: "PHARM-FAC-1001",
    medicine_id: "MED-1002",
    batch_number: "AMX-2026-05",
    manufacturing_date: "2026-05-15",
    expiry_date: "2027-06-30",
    quantity: 80,
    reserved_quantity: 0,
    status: "ACTIVE",
    created_at: "2026-08-01T08:00:00Z",
    updated_at: "2026-08-01T08:00:00Z",
  },
  {
    id: "BATCH-1003",
    inventory_id: "PHARM-INV-1004",
    facility_id: "PHARM-FAC-1003",
    medicine_id: "MED-1001",
    batch_number: "PCM-HSP-88",
    manufacturing_date: "2026-02-01",
    expiry_date: "2028-01-31",
    quantity: 200,
    reserved_quantity: 0,
    status: "ACTIVE",
    created_at: "2026-08-01T08:00:00Z",
    updated_at: "2026-08-01T08:00:00Z",
  },
  {
    id: "BATCH-1004",
    inventory_id: "PHARM-INV-1005",
    facility_id: "PHARM-FAC-1003",
    medicine_id: "MED-1003",
    batch_number: "MET-HSP-12",
    manufacturing_date: "2026-03-10",
    expiry_date: "2027-11-30",
    quantity: 100,
    reserved_quantity: 0,
    status: "ACTIVE",
    created_at: "2026-08-01T08:00:00Z",
    updated_at: "2026-08-01T08:00:00Z",
  },
];

let MOVEMENTS_STORE: PharmacyStockMovement[] = [];
let RESERVATIONS_STORE: PharmacyStockReservation[] = [];

// ============================================================
// INVENTORY & BATCH QUERIES
// ============================================================

export function getFacilityInventory(facilityId: string): PharmacyInventoryItem[] {
  const cleanFac = (facilityId || "").trim().toLowerCase();
  return INVENTORY_ITEMS_STORE.filter((i) => i.facility_id.toLowerCase() === cleanFac);
}

export function getInventoryItem(facilityId: string, medicineId: string): PharmacyInventoryItem | null {
  const cleanFac = (facilityId || "").trim().toLowerCase();
  const cleanMed = (medicineId || "").trim().toLowerCase();
  return INVENTORY_ITEMS_STORE.find((i) => i.facility_id.toLowerCase() === cleanFac && i.medicine_id.toLowerCase() === cleanMed) || null;
}

export function getInventoryBatches(inventoryId: string): PharmacyInventoryBatch[] {
  const clean = (inventoryId || "").trim().toLowerCase();
  return BATCHES_STORE.filter((b) => b.inventory_id.toLowerCase() === clean);
}

export function getUsableBatchesForMedicine(facilityId: string, medicineId: string): PharmacyInventoryBatch[] {
  const cleanFac = (facilityId || "").trim().toLowerCase();
  const cleanMed = (medicineId || "").trim().toLowerCase();
  const todayStr = new Date().toISOString().split("T")[0];

  return BATCHES_STORE.filter((b) => {
    if (b.facility_id.toLowerCase() !== cleanFac || b.medicine_id.toLowerCase() !== cleanMed) return false;
    if (b.status === "EXPIRED" || b.status === "QUARANTINED") return false;
    if (b.expiry_date < todayStr) return false;
    if (b.quantity - b.reserved_quantity <= 0) return false;
    return true;
  }).sort((a, b) => a.expiry_date.localeCompare(b.expiry_date)); // FEFO sort
}

// ============================================================
// ATOMIC STOCK RESERVATION ENGINE
// ============================================================

export function reserveStockForPrescription(params: {
  prescriptionId: string;
  facilityId: string;
  medicineId: string;
  requestedQuantity: number;
  patientId: string;
  durationMinutes?: number;
  actorId: string;
  actorName: string;
  actorRole: string;
}): { success: boolean; reservation?: PharmacyStockReservation; error?: string } {
  if (params.requestedQuantity <= 0) {
    return { success: false, error: "Requested quantity must be greater than zero." };
  }

  const item = getInventoryItem(params.facilityId, params.medicineId);
  if (!item) return { success: false, error: `Medicine ${params.medicineId} not in facility inventory.` };

  const usableBatches = getUsableBatchesForMedicine(params.facilityId, params.medicineId);
  const totalUsableStock = usableBatches.reduce((acc, b) => acc + (b.quantity - b.reserved_quantity), 0);

  if (totalUsableStock < params.requestedQuantity) {
    return {
      success: false,
      error: `Insufficient stock for ${item.medicine_name}. Requested: ${params.requestedQuantity}, Usable Available: ${totalUsableStock}.`,
    };
  }

  // FEFO Allocation: Select earliest expiry batch that can satisfy
  const selectedBatch = usableBatches[0];
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (params.durationMinutes || 60) * 60 * 1000).toISOString();
  const nowStr = now.toISOString();

  // Deduct from batch reserved quantity
  selectedBatch.reserved_quantity += params.requestedQuantity;
  selectedBatch.updated_at = nowStr;

  // Deduct from item reserved quantity
  item.reserved_quantity += params.requestedQuantity;
  item.available_quantity = Math.max(0, item.total_quantity - item.reserved_quantity);
  item.updated_at = nowStr;

  const nextNum = 1000 + RESERVATIONS_STORE.length + 1;
  const reservation: PharmacyStockReservation = {
    id: `RES-${nextNum}`,
    prescription_id: params.prescriptionId,
    facility_id: params.facilityId,
    medicine_id: params.medicineId,
    medicine_name: item.medicine_name,
    batch_id: selectedBatch.id,
    batch_number: selectedBatch.batch_number,
    quantity: params.requestedQuantity,
    patient_id: params.patientId,
    status: "ACTIVE",
    expires_at: expiresAt,
    created_at: nowStr,
  };

  RESERVATIONS_STORE.push(reservation);

  // Record audit movement
  const movId = `STOCK-MOV-${1000 + MOVEMENTS_STORE.length + 1}`;
  MOVEMENTS_STORE.push({
    id: movId,
    facility_id: params.facilityId,
    medicine_id: params.medicineId,
    batch_id: selectedBatch.id,
    movement_type: "RESERVED",
    quantity: params.requestedQuantity,
    actor_id: params.actorId,
    actor_name: params.actorName,
    actor_role: params.actorRole,
    reason: `Reserved stock for prescription ${params.prescriptionId}`,
    reference_id: reservation.id,
    created_at: nowStr,
  });

  appendAuditEvent(
    "STOCK_RESERVED",
    params.actorId,
    params.actorName,
    params.actorRole,
    `Reserved ${params.requestedQuantity} units of ${item.medicine_name} (Batch ${selectedBatch.batch_number})`,
    params.patientId,
    params.facilityId,
    undefined,
    reservation.id
  );

  return { success: true, reservation };
}

export function releaseReservation(reservationId: string, actorId: string, actorName: string, actorRole: string): { success: boolean; error?: string } {
  const index = RESERVATIONS_STORE.findIndex((r) => r.id.toLowerCase() === reservationId.trim().toLowerCase());
  if (index === -1) return { success: false, error: `Reservation ${reservationId} not found.` };

  const existing = RESERVATIONS_STORE[index];
  if (existing.status !== "ACTIVE") return { success: true }; // Idempotent release

  const item = getInventoryItem(existing.facility_id, existing.medicine_id);
  if (item) {
    item.reserved_quantity = Math.max(0, item.reserved_quantity - existing.quantity);
    item.available_quantity = item.total_quantity - item.reserved_quantity;
    item.updated_at = new Date().toISOString();
  }

  if (existing.batch_id) {
    const batch = BATCHES_STORE.find((b) => b.id === existing.batch_id);
    if (batch) {
      batch.reserved_quantity = Math.max(0, batch.reserved_quantity - existing.quantity);
      batch.updated_at = new Date().toISOString();
    }
  }

  existing.status = "RELEASED";
  existing.released_at = new Date().toISOString();

  appendAuditEvent(
    "STOCK_RELEASED",
    actorId,
    actorName,
    actorRole,
    `Released stock reservation ${existing.id} (${existing.quantity} units of ${existing.medicine_name})`,
    existing.patient_id,
    existing.facility_id,
    undefined,
    existing.id
  );

  return { success: true };
}

export function getActiveReservationsForPrescription(prescriptionId: string): PharmacyStockReservation[] {
  const clean = (prescriptionId || "").trim().toLowerCase();
  return RESERVATIONS_STORE.filter((r) => r.prescription_id.toLowerCase() === clean && r.status === "ACTIVE");
}
