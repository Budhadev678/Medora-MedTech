// ============================================================
// MEDORA — LABORATORY ORGANIZATION & STAFF REPOSITORY (PHASE 8.1)
// Authoritative Laboratory Organizations, Facilities & Staff Store
// ============================================================

import type {
  LaboratoryOrganization,
  LaboratoryFacility,
  LaboratoryStaffMembership,
  LaboratoryStaffRole,
  LaboratoryStaffStatus,
  LaboratoryFacilityStatus,
} from "@/types/database.types";
import { appendAuditEvent } from "@/lib/data/audit-store";

let LAB_ORGANIZATIONS: LaboratoryOrganization[] = [
  {
    id: "LAB-ORG-1001",
    organization_identifier: "LAB-ORG-1001",
    name: "ABC Diagnostics",
    status: "ACTIVE",
    contact_phone: "+91 98765 11111",
    contact_email: "contact@abcdiagnostics.com",
    address: "Central Lab Tower, Main Road, Rourkela",
    created_at: "2026-08-01T09:00:00Z",
    updated_at: "2026-08-01T09:00:00Z",
  },
  {
    id: "LAB-ORG-1002",
    organization_identifier: "LAB-ORG-1002",
    name: "Apex Clinical Labs",
    status: "ACTIVE",
    contact_phone: "+91 98765 22222",
    contact_email: "info@apexlabs.com",
    address: "12 Healthcare Avenue, Sambalpur",
    created_at: "2026-08-01T09:00:00Z",
    updated_at: "2026-08-01T09:00:00Z",
  },
];

let LAB_FACILITIES: LaboratoryFacility[] = [
  {
    id: "LAB-FAC-1001",
    organization_id: "LAB-ORG-1001",
    organization_name: "ABC Diagnostics",
    facility_identifier: "LAB-FAC-1001",
    name: "ABC Diagnostics — Rourkela Central Lab",
    address: "Plot 42, Civil Township, Rourkela, Odisha 769004",
    contact_phone: "+91 98765 11111",
    operating_hours: "07:00 AM - 09:00 PM (Mon-Sat)",
    status: "ACTIVE",
    verification_status: "NOT_VERIFIED",
    created_at: "2026-08-01T09:00:00Z",
    updated_at: "2026-08-01T09:00:00Z",
  },
  {
    id: "LAB-FAC-1002",
    organization_id: "LAB-ORG-1001",
    organization_name: "ABC Diagnostics",
    facility_identifier: "LAB-FAC-1002",
    name: "ABC Diagnostics — Sambalpur Branch",
    address: "Near District Hospital, Sambalpur, Odisha 768001",
    contact_phone: "+91 98765 11122",
    operating_hours: "08:00 AM - 08:00 PM (Mon-Sat)",
    status: "ACTIVE",
    verification_status: "NOT_VERIFIED",
    created_at: "2026-08-01T09:00:00Z",
    updated_at: "2026-08-01T09:00:00Z",
  },
  {
    id: "LAB-FAC-2001",
    organization_id: "LAB-ORG-1002",
    organization_name: "Apex Clinical Labs",
    facility_identifier: "LAB-FAC-2001",
    name: "Apex Clinical Labs — Main Branch",
    address: "12 Healthcare Avenue, Sambalpur, Odisha 768001",
    contact_phone: "+91 98765 22222",
    operating_hours: "24 Hours (7 Days)",
    status: "ACTIVE",
    verification_status: "NOT_VERIFIED",
    created_at: "2026-08-01T09:00:00Z",
    updated_at: "2026-08-01T09:00:00Z",
  },
];

let LAB_STAFF_MEMBERSHIPS: LaboratoryStaffMembership[] = [
  {
    id: "LAB-STAFF-1001",
    user_id: "USR-LAB-ADMIN",
    user_name: "Lab Manager Ramesh",
    user_email: "ramesh@abcdiagnostics.com",
    organization_id: "LAB-ORG-1001",
    organization_name: "ABC Diagnostics",
    facility_ids: ["LAB-FAC-1001", "LAB-FAC-1002"],
    role: "LAB_ADMIN",
    status: "ACTIVE",
    created_at: "2026-08-01T09:00:00Z",
    updated_at: "2026-08-01T09:00:00Z",
  },
  {
    id: "LAB-STAFF-1002",
    user_id: "USR-1005",
    user_name: "Technician Rahul",
    user_email: "rahul.tech@abcdiagnostics.com",
    organization_id: "LAB-ORG-1001",
    organization_name: "ABC Diagnostics",
    facility_ids: ["LAB-FAC-1001"],
    role: "LAB_TECHNICIAN",
    status: "ACTIVE",
    created_at: "2026-08-01T09:00:00Z",
    updated_at: "2026-08-01T09:00:00Z",
  },
  {
    id: "LAB-STAFF-1003",
    user_id: "USR-LAB-REC",
    user_name: "Receptionist Sunita",
    user_email: "sunita@abcdiagnostics.com",
    organization_id: "LAB-ORG-1001",
    organization_name: "ABC Diagnostics",
    facility_ids: ["LAB-FAC-1001"],
    role: "LAB_RECEPTION",
    status: "ACTIVE",
    created_at: "2026-08-01T09:00:00Z",
    updated_at: "2026-08-01T09:00:00Z",
  },
];

export function getAllLabOrganizations(): LaboratoryOrganization[] {
  return [...LAB_ORGANIZATIONS];
}

export function getLabOrganizationById(id: string): LaboratoryOrganization | null {
  const clean = (id || "").trim().toLowerCase();
  return LAB_ORGANIZATIONS.find((o) => o.id.toLowerCase() === clean || o.organization_identifier.toLowerCase() === clean) || null;
}

export function getAllLabFacilities(): LaboratoryFacility[] {
  return [...LAB_FACILITIES];
}

export function getLabFacilitiesByOrganization(orgId: string): LaboratoryFacility[] {
  const clean = (orgId || "").trim().toLowerCase();
  return LAB_FACILITIES.filter((f) => f.organization_id.toLowerCase() === clean);
}

export function getLabFacilityById(id: string): LaboratoryFacility | null {
  const clean = (id || "").trim().toLowerCase();
  return LAB_FACILITIES.find((f) => f.id.toLowerCase() === clean || f.facility_identifier.toLowerCase() === clean) || null;
}

export function getLabStaffMemberships(userId?: string, facilityId?: string): LaboratoryStaffMembership[] {
  return LAB_STAFF_MEMBERSHIPS.filter((m) => {
    if (userId && m.user_id.toLowerCase() !== userId.trim().toLowerCase()) return false;
    if (facilityId && !m.facility_ids.some((fid) => fid.toLowerCase() === facilityId.trim().toLowerCase())) return false;
    return true;
  });
}

export function inviteLabStaff(params: {
  userId: string;
  userName: string;
  userEmail: string;
  organizationId: string;
  facilityIds: string[];
  role: LaboratoryStaffRole;
  actorId: string;
  actorName: string;
  actorRole: string;
}): { success: boolean; membership?: LaboratoryStaffMembership; error?: string } {
  const org = getLabOrganizationById(params.organizationId);
  if (!org) return { success: false, error: `Laboratory organization ${params.organizationId} not found.` };

  const existing = LAB_STAFF_MEMBERSHIPS.find(
    (m) => m.user_id.toLowerCase() === params.userId.toLowerCase() && m.organization_id.toLowerCase() === params.organizationId.toLowerCase()
  );

  const now = new Date().toISOString();
  if (existing) {
    existing.role = params.role;
    existing.facility_ids = params.facilityIds;
    existing.status = "INVITED";
    existing.updated_at = now;
    return { success: true, membership: existing };
  }

  const newId = `LAB-STAFF-${1000 + LAB_STAFF_MEMBERSHIPS.length + 1}`;
  const newMembership: LaboratoryStaffMembership = {
    id: newId,
    user_id: params.userId,
    user_name: params.userName,
    user_email: params.userEmail,
    organization_id: params.organizationId,
    organization_name: org.name,
    facility_ids: params.facilityIds,
    role: params.role,
    status: "INVITED",
    invited_at: now,
    created_at: now,
    updated_at: now,
  };

  LAB_STAFF_MEMBERSHIPS.push(newMembership);

  appendAuditEvent(
    "MEMBER_INVITE",
    params.actorId,
    params.actorName,
    params.actorRole,
    `Invited staff ${params.userName} as ${params.role} to laboratory ${org.name}`,
    params.userId,
    params.organizationId,
    org.name,
    newId
  );

  return { success: true, membership: newMembership };
}

export function acceptLabStaffInvitation(membershipId: string, userId: string): { success: boolean; membership?: LaboratoryStaffMembership; error?: string } {
  const index = LAB_STAFF_MEMBERSHIPS.findIndex((m) => m.id === membershipId);
  if (index === -1) return { success: false, error: `Staff membership ${membershipId} not found.` };

  const existing = LAB_STAFF_MEMBERSHIPS[index];
  if (existing.user_id.toLowerCase() !== userId.toLowerCase()) {
    return { success: false, error: "Access denied. You can only accept your own invitation." };
  }

  const now = new Date().toISOString();
  const updated: LaboratoryStaffMembership = {
    ...existing,
    status: "ACTIVE",
    accepted_at: now,
    updated_at: now,
  };

  LAB_STAFF_MEMBERSHIPS[index] = updated;
  return { success: true, membership: updated };
}
